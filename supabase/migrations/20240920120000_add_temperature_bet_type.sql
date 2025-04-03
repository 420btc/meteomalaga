-- Add temperature bet type and 12-hour resolution support
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS bet_resolution_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS temperature_c NUMERIC(5,2) DEFAULT NULL;

-- Update the evaluate_bet function to handle 12-hour resolution for temperature bets
CREATE OR REPLACE FUNCTION evaluate_bet()
RETURNS TRIGGER AS $$
DECLARE
  margin INTEGER := 0;
  today TIMESTAMP := NOW() AT TIME ZONE 'CET';
  resolution_timestamp TIMESTAMP;
  actual_value NUMERIC;
BEGIN
  -- Only evaluate if status is pending and resolution time has passed
  IF NEW.status = 'pending' THEN
    -- Check if the resolution date has passed
    IF NEW.resolution_date IS NOT NULL THEN
      -- For temperature bets with 12-hour resolution
      IF NEW.bet_type = 'temperature' AND NEW.bet_resolution_hours = 12 THEN
        -- Calculate resolution timestamp (12 hours after bet was placed)
        resolution_timestamp := (to_timestamp(NEW.timestamp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AT TIME ZONE 'UTC') + interval '12 hours';
        
        -- Check if resolution time has passed
        IF resolution_timestamp <= today THEN
          -- Get the actual temperature value
          actual_value := NEW.result;
          
          -- Check if the bet is won (within 1°C margin)
          NEW.won := (ABS(NEW.temperature_c - actual_value) <= 1.0);
          
          -- Update status based on result
          IF NEW.won THEN
            NEW.status := 'ganada';
          ELSE
            NEW.status := 'perdida';
          END IF;
        END IF;
      ELSE
        -- Original logic for other bet types (24-hour resolution)
        resolution_timestamp := (to_timestamp(NEW.resolution_date, 'YYYY-MM-DD') AT TIME ZONE 'CET');
        
        IF resolution_timestamp <= today THEN
          -- Get the actual value based on bet_type
          IF NEW.bet_type = 'rain' THEN
            actual_value := NEW.result;
          ELSIF NEW.bet_type = 'temp_min' THEN
            actual_value := NEW.result;
          ELSIF NEW.bet_type = 'temp_max' THEN
            actual_value := NEW.result;
          END IF;
          
          -- Simple mode: exact match
          IF NEW.mode = 'Simple' THEN
            IF NEW.bet_type = 'rain' THEN
              IF NEW.option = 'rain_yes' THEN
                NEW.won := (actual_value > 0);
              ELSIF NEW.option = 'rain_no' THEN
                NEW.won := (actual_value = 0);
              ELSIF NEW.option = 'rain_amount' THEN
                NEW.won := (NEW.rain_mm = actual_value);
              END IF;
            ELSIF NEW.bet_type = 'temp_min' THEN
              NEW.won := (NEW.temp_min_c = actual_value);
            ELSIF NEW.bet_type = 'temp_max' THEN
              NEW.won := (NEW.temp_max_c = actual_value);
            END IF;
          -- Pro mode: within margin based on leverage
          ELSIF NEW.mode = 'Pro' THEN
            -- Calculate margin based on leverage
            CASE NEW.leverage
              WHEN 2 THEN margin := 5;
              WHEN 5 THEN margin := 4;
              WHEN 10 THEN margin := 3;
              WHEN 20 THEN margin := 2;
              WHEN 50 THEN margin := 1;
              WHEN 100 THEN margin := 0;
              ELSE margin := 5;
            END CASE;
            
            -- Check if the actual value is within the range
            IF NEW.range_min IS NOT NULL AND NEW.range_max IS NOT NULL THEN
              NEW.won := (actual_value >= NEW.range_min AND actual_value <= NEW.range_max);
            ELSE
              -- Fallback to checking if the value is within margin of the target
              IF NEW.bet_type = 'rain' THEN
                NEW.won := (ABS(NEW.rain_mm - actual_value) <= margin);
              ELSIF NEW.bet_type = 'temp_min' THEN
                NEW.won := (ABS(NEW.temp_min_c - actual_value) <= margin);
              ELSIF NEW.bet_type = 'temp_max' THEN
                NEW.won := (ABS(NEW.temp_max_c - actual_value) <= margin);
              END IF;
            END IF;
          END IF;
          
          -- Update status based on result
          IF NEW.won IS NOT NULL THEN
            IF NEW.won THEN
              NEW.status := 'ganada';
            ELSE
              NEW.status := 'perdida';
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the bet_history_view to include temperature betting information
CREATE OR REPLACE VIEW public.bet_history_view AS
SELECT 
  b.id,
  b.date,
  b.option,
  b.value,
  b.coins,
  b.leverage,
  b.timestamp,
  b.result,
  b.won,
  b.city,
  b.mode,
  b.rain_mm,
  b.resolution_date,
  b.user_id,
  b.status,
  b.bet_type,
  b.temp_min_c,
  b.temp_max_c,
  b.range_min,
  b.range_max,
  b.daily_cutoff,
  b.betting_allowed,
  b.daily_temp_bets_count,
  b.last_temp_bet_date,
  b.bet_resolution_hours,
  b.temperature_c,
  CASE
    WHEN b.option = 'rain_yes' THEN 'Lluvia: Sí'
    WHEN b.option = 'rain_no' THEN 'Lluvia: No'
    WHEN b.option = 'rain_amount' THEN 'Cantidad de lluvia'
    WHEN b.option = 'lightning' THEN 'Rayos'
    WHEN b.option = 'temp_min' THEN 'Temperatura mínima'
    WHEN b.option = 'temp_max' THEN 'Temperatura máxima'
    WHEN b.option = 'temperature' THEN 'Temperatura actual'
    ELSE 'Desconocido'
  END AS option_label,
  CASE
    WHEN b.status = 'pending' THEN 'pending'
    WHEN b.status = 'ganada' THEN 'won'
    ELSE 'lost'
  END AS status_label,
  CASE
    WHEN b.won IS NULL THEN 0
    WHEN b.won = true THEN b.coins * b.leverage
    ELSE -b.coins
  END AS profit
FROM public.bets_malaga b;

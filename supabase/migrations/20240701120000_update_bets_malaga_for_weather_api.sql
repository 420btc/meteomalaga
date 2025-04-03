-- Add new columns to the bets_malaga table for enhanced betting
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS bet_type TEXT DEFAULT 'rain',
ADD COLUMN IF NOT EXISTS temp_min_c INTEGER,
ADD COLUMN IF NOT EXISTS temp_max_c INTEGER,
ADD COLUMN IF NOT EXISTS range_min INTEGER,
ADD COLUMN IF NOT EXISTS range_max INTEGER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS bets_malaga_bet_type_idx ON public.bets_malaga (bet_type);
CREATE INDEX IF NOT EXISTS bets_malaga_temp_min_c_idx ON public.bets_malaga (temp_min_c);
CREATE INDEX IF NOT EXISTS bets_malaga_temp_max_c_idx ON public.bets_malaga (temp_max_c);

-- Update the bet_history_view to include the new columns
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
  CASE
    WHEN b.option = 'rain_yes' THEN 'Lluvia: Sí'
    WHEN b.option = 'rain_no' THEN 'Lluvia: No'
    WHEN b.option = 'rain_amount' THEN 'Cantidad de lluvia'
    WHEN b.option = 'lightning' THEN 'Rayos'
    WHEN b.option = 'temp_min' THEN 'Temperatura mínima'
    WHEN b.option = 'temp_max' THEN 'Temperatura máxima'
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

-- Create a function to evaluate bets based on the new columns
CREATE OR REPLACE FUNCTION evaluate_weather_bet()
RETURNS TRIGGER AS $$
DECLARE
  margin INTEGER := 0;
  today DATE := CURRENT_DATE;
  resolution_date DATE;
  actual_value INTEGER;
BEGIN
  -- Only evaluate if status is pending and resolution date has passed
  IF NEW.status = 'pending' THEN
    -- Check if the resolution date has passed
    IF NEW.resolution_date IS NOT NULL THEN
      resolution_date := to_date(NEW.resolution_date, 'YYYY-MM-DD');
      IF resolution_date <= today THEN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically evaluate bets when results are added
DROP TRIGGER IF EXISTS evaluate_weather_bet_trigger ON public.bets_malaga;
CREATE TRIGGER evaluate_weather_bet_trigger
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION evaluate_weather_bet();

-- Grant access to the view and functions
GRANT SELECT ON public.bet_history_view TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION evaluate_weather_bet() TO anon, authenticated, service_role;

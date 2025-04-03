-- Add new columns to the bets_malaga table for enhanced weather betting
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS wind_kmh_max FLOAT,
ADD COLUMN IF NOT EXISTS temp_min_c FLOAT,
ADD COLUMN IF NOT EXISTS temp_max_c FLOAT,
ADD COLUMN IF NOT EXISTS odds_wind_max INTEGER,
ADD COLUMN IF NOT EXISTS odds_temp_min INTEGER,
ADD COLUMN IF NOT EXISTS odds_temp_max INTEGER,
ADD COLUMN IF NOT EXISTS result_wind_max FLOAT,
ADD COLUMN IF NOT EXISTS result_temp_min FLOAT,
ADD COLUMN IF NOT EXISTS result_temp_max FLOAT,
ADD COLUMN IF NOT EXISTS won_wind_max BOOLEAN,
ADD COLUMN IF NOT EXISTS won_temp_min BOOLEAN,
ADD COLUMN IF NOT EXISTS won_temp_max BOOLEAN;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS bets_malaga_wind_kmh_max_idx ON public.bets_malaga (wind_kmh_max);
CREATE INDEX IF NOT EXISTS bets_malaga_temp_min_c_idx ON public.bets_malaga (temp_min_c);
CREATE INDEX IF NOT EXISTS bets_malaga_temp_max_c_idx ON public.bets_malaga (temp_max_c);

-- Update the evaluate_weather_bet function to handle new betting options
CREATE OR REPLACE FUNCTION evaluate_weather_bet()
RETURNS TRIGGER AS $$
DECLARE
  margin_rain FLOAT := 0.5;
  margin_wind FLOAT := 5.0;
  margin_temp FLOAT := 1.0;
  today DATE := CURRENT_DATE;
  resolution_date DATE;
BEGIN
  -- Only evaluate if status is pending and resolution date has passed
  IF NEW.status = 'pending' THEN
    -- Check if the resolution date has passed
    IF NEW.resolution_date IS NOT NULL THEN
      resolution_date := to_date(NEW.resolution_date, 'YYYY-MM-DD');
      IF resolution_date <= today THEN
        -- Evaluate rain bet
        IF NEW.rain_mm IS NOT NULL AND NEW.result IS NOT NULL THEN
          NEW.won := (ABS(NEW.rain_mm - NEW.result) <= margin_rain);
        END IF;
        
        -- Evaluate wind max bet
        IF NEW.wind_kmh_max IS NOT NULL AND NEW.result_wind_max IS NOT NULL THEN
          NEW.won_wind_max := (ABS(NEW.wind_kmh_max - NEW.result_wind_max) <= margin_wind);
        END IF;
        
        -- Evaluate temp min bet
        IF NEW.temp_min_c IS NOT NULL AND NEW.result_temp_min IS NOT NULL THEN
          NEW.won_temp_min := (ABS(NEW.temp_min_c - NEW.result_temp_min) <= margin_temp);
        END IF;
        
        -- Evaluate temp max bet
        IF NEW.temp_max_c IS NOT NULL AND NEW.result_temp_max IS NOT NULL THEN
          NEW.won_temp_max := (ABS(NEW.temp_max_c - NEW.result_temp_max) <= margin_temp);
        END IF;
        
        -- Update status based on result
        IF (NEW.won IS NOT NULL OR NEW.won_wind_max IS NOT NULL OR 
            NEW.won_temp_min IS NOT NULL OR NEW.won_temp_max IS NOT NULL) THEN
          -- If any bet is won, set status to ganada
          IF (NEW.won = true OR NEW.won_wind_max = true OR 
              NEW.won_temp_min = true OR NEW.won_temp_max = true) THEN
            NEW.status := 'ganada';
          ELSE
            -- If all bets are evaluated and none are won, set status to perdida
            IF ((NEW.rain_mm IS NULL OR NEW.won IS NOT NULL) AND
                (NEW.wind_kmh_max IS NULL OR NEW.won_wind_max IS NOT NULL) AND
                (NEW.temp_min_c IS NULL OR NEW.won_temp_min IS NOT NULL) AND
                (NEW.temp_max_c IS NULL OR NEW.won_temp_max IS NOT NULL)) THEN
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

-- Create a trigger to automatically evaluate bets when results are added
DROP TRIGGER IF EXISTS evaluate_weather_bet_trigger ON public.bets_malaga;
CREATE TRIGGER evaluate_weather_bet_trigger
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION evaluate_weather_bet();

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
  b.daily_cutoff,
  b.betting_allowed,
  b.wind_kmh_max,
  b.odds_wind_max,
  b.odds_temp_min,
  b.odds_temp_max,
  b.result_wind_max,
  b.result_temp_min,
  b.result_temp_max,
  b.won_wind_max,
  b.won_temp_min,
  b.won_temp_max,
  CASE
    WHEN b.option = 'rain_yes' THEN 'Lluvia: Sí'
    WHEN b.option = 'rain_no' THEN 'Lluvia: No'
    WHEN b.option = 'rain_amount' THEN 'Cantidad de lluvia'
    WHEN b.option = 'lightning' THEN 'Rayos'
    WHEN b.option = 'temp_min' THEN 'Temperatura mínima'
    WHEN b.option = 'temp_max' THEN 'Temperatura máxima'
    WHEN b.option = 'wind_max' THEN 'Viento máximo'
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

-- Grant access to the view and functions
GRANT SELECT ON public.bet_history_view TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION evaluate_weather_bet() TO anon, authenticated, service_role;

-- Add resolution_date column to the bets_malaga table
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS resolution_date TEXT;

-- Update existing bets to set resolution_date to one day after the bet date
UPDATE public.bets_malaga
SET resolution_date = (
  to_char(
    (to_date(date, 'YYYY-MM-DD') + interval '1 day')::date,
    'YYYY-MM-DD'
  )
)
WHERE resolution_date IS NULL;

-- Create an index on the resolution_date column for better performance
CREATE INDEX IF NOT EXISTS bets_malaga_resolution_date_idx ON public.bets_malaga (resolution_date);

-- Update the bet_history_view to include the resolution_date column
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
    WHEN b.won IS NULL THEN 'pending'
    WHEN b.won = true THEN 'won'
    ELSE 'lost'
  END AS status,
  CASE
    WHEN b.won IS NULL THEN 0
    WHEN b.won = true THEN b.coins * b.leverage
    ELSE -b.coins
  END AS profit
FROM public.bets_malaga b;

-- Update the evaluate_bet function to consider the resolution_date
CREATE OR REPLACE FUNCTION evaluate_bet()
RETURNS TRIGGER AS $$
DECLARE
  margin INTEGER := 0;
  today DATE := CURRENT_DATE;
  resolution_date DATE;
BEGIN
  -- Only evaluate if result is set but won is not yet determined
  IF NEW.result IS NOT NULL AND NEW.won IS NULL THEN
    -- Check if the resolution date has passed
    IF NEW.resolution_date IS NOT NULL THEN
      resolution_date := to_date(NEW.resolution_date, 'YYYY-MM-DD');
      IF resolution_date > today THEN
        -- Don't evaluate yet if resolution date is in the future
        RETURN NEW;
      END IF;
    END IF;
    
    -- Simple mode: exact match
    IF NEW.mode = 'Simple' THEN
      CASE NEW.option
        WHEN 'rain_yes' THEN
          NEW.won := (NEW.result > 0);
        WHEN 'rain_no' THEN
          NEW.won := (NEW.result = 0);
        WHEN 'rain_amount' THEN
          -- For rain amount, the bet is won if the value matches exactly
          NEW.won := (NEW.value = NEW.result OR NEW.rain_mm = NEW.result);
        WHEN 'lightning' THEN
          -- For lightning, the bet is won if the value is within 5 strikes of the actual result
          NEW.won := (ABS(NEW.value - NEW.result) <= 5);
        WHEN 'temp_min' THEN
          -- For temp_min, the bet is won if the value is within 2 degrees of the actual result
          NEW.won := (ABS(NEW.value - NEW.result) <= 2);
        WHEN 'temp_max' THEN
          -- For temp_max, the bet is won if the value is within 2 degrees of the actual result
          NEW.won := (ABS(NEW.value - NEW.result) <= 2);
        ELSE
          NEW.won := FALSE;
      END CASE;
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
      
      CASE NEW.option
        WHEN 'rain_amount' THEN
          -- For rain amount, the bet is won if the value is within margin of the actual result
          NEW.won := (ABS(COALESCE(NEW.value, NEW.rain_mm) - NEW.result) <= margin);
        WHEN 'lightning' THEN
          -- For lightning, the bet is won if the value is within margin of the actual result
          NEW.won := (ABS(NEW.value - NEW.result) <= margin);
        WHEN 'temp_min' THEN
          -- For temp_min, the bet is won if the value is within margin of the actual result
          NEW.won := (ABS(NEW.value - NEW.result) <= margin);
        WHEN 'temp_max' THEN
          -- For temp_max, the bet is won if the value is within margin of the actual result
          NEW.won := (ABS(NEW.value - NEW.result) <= margin);
        WHEN 'rain_yes' THEN
          NEW.won := (NEW.result > 0);
        WHEN 'rain_no' THEN
          NEW.won := (NEW.result = 0);
        ELSE
          NEW.won := FALSE;
      END CASE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the view
GRANT SELECT ON public.bet_history_view TO anon, authenticated, service_role;

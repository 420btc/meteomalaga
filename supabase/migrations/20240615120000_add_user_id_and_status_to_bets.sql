-- Add user_id and status columns to the bets_malaga table
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT 'anonymous',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Create an index on the user_id column for better performance
CREATE INDEX IF NOT EXISTS bets_malaga_user_id_idx ON public.bets_malaga (user_id);

-- Create an index on the status column for better performance
CREATE INDEX IF NOT EXISTS bets_malaga_status_idx ON public.bets_malaga (status);

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

-- Create a function to evaluate bets automatically based on status and resolution date
CREATE OR REPLACE FUNCTION evaluate_pending_bets()
RETURNS TRIGGER AS $$
DECLARE
  margin INTEGER := 0;
  today DATE := CURRENT_DATE;
  resolution_date DATE;
BEGIN
  -- Only evaluate if status is pending and resolution date has passed
  IF NEW.status = 'pending' THEN
    -- Check if the resolution date has passed
    IF NEW.resolution_date IS NOT NULL THEN
      resolution_date := to_date(NEW.resolution_date, 'YYYY-MM-DD');
      IF resolution_date <= today THEN
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
DROP TRIGGER IF EXISTS evaluate_pending_bets_trigger ON public.bets_malaga;
CREATE TRIGGER evaluate_pending_bets_trigger
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION evaluate_pending_bets();

-- Create a function to run every 5 minutes to check for bets that need to be resolved
CREATE OR REPLACE FUNCTION check_pending_bets()
RETURNS void AS $$
DECLARE
  bet_record RECORD;
  today DATE := CURRENT_DATE;
BEGIN
  -- Find all pending bets with resolution dates in the past
  FOR bet_record IN 
    SELECT id 
    FROM public.bets_malaga 
    WHERE status = 'pending' 
    AND resolution_date <= today::text
  LOOP
    -- Update the bet to trigger the evaluate_pending_bets trigger
    UPDATE public.bets_malaga
    SET updated_at = NOW()
    WHERE id = bet_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if it doesn't exist
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bets_malaga_updated_at ON public.bets_malaga;
CREATE TRIGGER update_bets_malaga_updated_at
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant access to the view and functions
GRANT SELECT ON public.bet_history_view TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION evaluate_pending_bets() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_pending_bets() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO anon, authenticated, service_role;

-- Add daily_cutoff column to the bets_malaga table
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS daily_cutoff BOOLEAN DEFAULT false;

-- Add betting_allowed column to the bets_malaga table
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS betting_allowed BOOLEAN DEFAULT true;

-- Create a function to check if betting is allowed based on time
CREATE OR REPLACE FUNCTION is_betting_allowed()
RETURNS BOOLEAN AS $$
DECLARE
  current_time TIMESTAMP WITH TIME ZONE := NOW() AT TIME ZONE 'CET';
  current_hour INTEGER := EXTRACT(HOUR FROM current_time);
BEGIN
  -- Betting is allowed before 8:00 AM CET
  RETURN current_hour < 8;
END;
$$ LANGUAGE plpgsql;

-- Create a function to update betting_allowed status
CREATE OR REPLACE FUNCTION update_betting_allowed_status()
RETURNS void AS $$
BEGIN
  -- Update betting_allowed status based on current time
  UPDATE public.bets_malaga
  SET betting_allowed = is_betting_allowed()
  WHERE betting_allowed != is_betting_allowed();
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update betting_allowed status
CREATE OR REPLACE FUNCTION check_betting_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if betting is allowed based on time
  IF NOT is_betting_allowed() THEN
    RAISE EXCEPTION 'Betting is not allowed after 8:00 AM CET';
  END IF;
  
  -- Set daily_cutoff flag
  NEW.daily_cutoff := NOT is_betting_allowed();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check betting time before inserting a new bet
DROP TRIGGER IF EXISTS check_betting_time_trigger ON public.bets_malaga;
CREATE TRIGGER check_betting_time_trigger
BEFORE INSERT ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION check_betting_time();

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

-- Grant access to the view and functions
GRANT SELECT ON public.bet_history_view TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_betting_allowed() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_betting_allowed_status() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_betting_time() TO anon, authenticated, service_role;

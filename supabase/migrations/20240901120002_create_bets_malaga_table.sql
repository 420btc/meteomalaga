-- Create the bets_malaga table with enhanced fields for the betting system
CREATE TABLE IF NOT EXISTS public.bets_malaga (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  city TEXT DEFAULT 'Málaga',
  date TEXT NOT NULL,
  option TEXT NOT NULL,
  value FLOAT NULL,
  coins INTEGER NOT NULL,
  leverage FLOAT NOT NULL,
  odds FLOAT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  result FLOAT NULL,
  won BOOLEAN NULL,
  status TEXT DEFAULT 'pending',
  rain_mm INTEGER NULL,
  resolution_date TEXT,
  bet_type TEXT DEFAULT 'rain',
  temp_min_c INTEGER NULL,
  temp_max_c INTEGER NULL,
  range_min INTEGER NULL,
  range_max INTEGER NULL,
  daily_cutoff BOOLEAN DEFAULT false,
  betting_allowed BOOLEAN DEFAULT true,
  mode TEXT DEFAULT 'Simple',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX bets_malaga_user_id_idx ON public.bets_malaga (user_id);
CREATE INDEX bets_malaga_date_idx ON public.bets_malaga (date);
CREATE INDEX bets_malaga_timestamp_idx ON public.bets_malaga (timestamp);
CREATE INDEX bets_malaga_status_idx ON public.bets_malaga (status);
CREATE INDEX bets_malaga_resolution_date_idx ON public.bets_malaga (resolution_date);

-- Enable Row Level Security
ALTER TABLE public.bets_malaga ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read bets
CREATE POLICY "Anyone can read bets" 
  ON public.bets_malaga 
  FOR SELECT 
  USING (true);

-- Create a policy that allows anyone to insert bets
CREATE POLICY "Anyone can insert bets" 
  ON public.bets_malaga 
  FOR INSERT 
  WITH CHECK (true);

-- Create a policy that allows anyone to update bets
CREATE POLICY "Anyone can update bets" 
  ON public.bets_malaga 
  FOR UPDATE 
  USING (true);

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

-- Create a function to evaluate bets automatically
CREATE OR REPLACE FUNCTION evaluate_bet()
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
CREATE TRIGGER evaluate_bet_trigger
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION evaluate_bet();

-- Create a trigger to check betting time before inserting a new bet
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

CREATE TRIGGER check_betting_time_trigger
BEFORE INSERT ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION check_betting_time();

-- Add a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_bets_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bets_malaga_updated_at
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION update_bets_updated_at_column();

-- Create a view for bet history with additional information
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
GRANT EXECUTE ON FUNCTION evaluate_bet() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_betting_time() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION update_bets_updated_at_column() TO anon, authenticated, service_role;

-- Update the bets_malaga table to enhance temperature betting
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS daily_temp_bets_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_temp_bet_date TEXT;

-- Create a function to check if temperature betting is allowed (max 2 per day)
CREATE OR REPLACE FUNCTION is_temp_betting_allowed(user_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  current_date_str TEXT := to_char(NOW() AT TIME ZONE 'CET', 'YYYY-MM-DD');
  temp_bets_today INTEGER;
BEGIN
  -- Count temperature bets made by this user today
  SELECT COUNT(*) INTO temp_bets_today
  FROM public.bets_malaga
  WHERE user_id = user_id_param
    AND (bet_type = 'temp_min' OR bet_type = 'temp_max')
    AND last_temp_bet_date = current_date_str;
  
  -- Allow betting if user has made less than 2 temperature bets today
  RETURN temp_bets_today < 2;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to check temperature betting limits before inserting a new bet
CREATE OR REPLACE FUNCTION check_temp_betting_limits()
RETURNS TRIGGER AS $$
DECLARE
  current_date_str TEXT := to_char(NOW() AT TIME ZONE 'CET', 'YYYY-MM-DD');
BEGIN
  -- Only check for temperature bets
  IF NEW.bet_type = 'temp_min' OR NEW.bet_type = 'temp_max' THEN
    -- Check if user has already made 2 temperature bets today
    IF NOT is_temp_betting_allowed(NEW.user_id) THEN
      RAISE EXCEPTION 'Maximum of 2 temperature bets per day allowed';
    END IF;
    
    -- Update the temperature bet counter and date
    NEW.last_temp_bet_date := current_date_str;
    
    -- Get current count of temperature bets for today
    SELECT COUNT(*) INTO NEW.daily_temp_bets_count
    FROM public.bets_malaga
    WHERE user_id = NEW.user_id
      AND (bet_type = 'temp_min' OR bet_type = 'temp_max')
      AND last_temp_bet_date = current_date_str;
    
    -- Increment the counter
    NEW.daily_temp_bets_count := NEW.daily_temp_bets_count + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS check_temp_betting_limits_trigger ON public.bets_malaga;
CREATE TRIGGER check_temp_betting_limits_trigger
BEFORE INSERT ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION check_temp_betting_limits();

-- Update the evaluate_bet function to handle temperature bets
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

-- Grant access to the new function
GRANT EXECUTE ON FUNCTION is_temp_betting_allowed(TEXT) TO anon, authenticated, service_role;

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

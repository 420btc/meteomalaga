-- Add rain_amount option to the bets_malaga table
ALTER TABLE public.bets_malaga
ADD COLUMN IF NOT EXISTS rain_amount FLOAT NULL;

-- Create a function to evaluate bets automatically
CREATE OR REPLACE FUNCTION evaluate_bet()
RETURNS TRIGGER AS $$
BEGIN
  -- Only evaluate if result is set but won is not yet determined
  IF NEW.result IS NOT NULL AND NEW.won IS NULL THEN
    CASE NEW.option
      WHEN 'rain_yes' THEN
        NEW.won := (NEW.result > 0);
      WHEN 'rain_no' THEN
        NEW.won := (NEW.result = 0);
      WHEN 'rain_amount' THEN
        -- For rain amount, the bet is won if the value is within 2mm of the actual result
        NEW.won := (ABS(NEW.value - NEW.result) <= 2);
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
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically evaluate bets when results are added
DROP TRIGGER IF EXISTS evaluate_bet_trigger ON public.bets_malaga;
CREATE TRIGGER evaluate_bet_trigger
BEFORE UPDATE ON public.bets_malaga
FOR EACH ROW
EXECUTE FUNCTION evaluate_bet();

-- Create a table for top winners
CREATE TABLE IF NOT EXISTS public.top_winners (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  wins INTEGER NOT NULL DEFAULT 0,
  coins INTEGER NOT NULL DEFAULT 0,
  avatar TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS top_winners_wins_idx ON public.top_winners (wins DESC);
CREATE INDEX IF NOT EXISTS top_winners_coins_idx ON public.top_winners (coins DESC);

-- Enable Row Level Security
ALTER TABLE public.top_winners ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to read top winners
CREATE POLICY "Anyone can read top winners" 
  ON public.top_winners 
  FOR SELECT 
  USING (true);

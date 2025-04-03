-- Create the bets_malaga table
CREATE TABLE public.bets_malaga (
  id SERIAL PRIMARY KEY,
  date TEXT NOT NULL,
  option TEXT NOT NULL,
  value FLOAT NULL,
  coins INTEGER NOT NULL,
  leverage INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  result FLOAT NULL,
  won BOOLEAN NULL
);

-- Add indexes for better performance
CREATE INDEX bets_malaga_date_idx ON public.bets_malaga (date);
CREATE INDEX bets_malaga_timestamp_idx ON public.bets_malaga (timestamp);

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

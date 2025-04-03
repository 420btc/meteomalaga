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

-- Create an index on the timestamp column for better performance
CREATE INDEX IF NOT EXISTS bets_malaga_timestamp_idx ON public.bets_malaga (timestamp DESC);

-- Enable RLS on the view
ALTER VIEW public.bet_history_view SECURITY INVOKER;

-- Create a function to get bet statistics
CREATE OR REPLACE FUNCTION public.get_bet_statistics()
RETURNS TABLE (
  total_bets bigint,
  won_bets bigint,
  lost_bets bigint,
  pending_bets bigint,
  total_profit bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_bets,
    COUNT(*) FILTER (WHERE won = true) AS won_bets,
    COUNT(*) FILTER (WHERE won = false) AS lost_bets,
    COUNT(*) FILTER (WHERE won IS NULL) AS pending_bets,
    COALESCE(SUM(
      CASE
        WHEN won IS NULL THEN 0
        WHEN won = true THEN coins * leverage
        ELSE -coins
      END
    ), 0)::bigint AS total_profit
  FROM public.bets_malaga;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the view and function
GRANT SELECT ON public.bet_history_view TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_bet_statistics() TO anon, authenticated, service_role;

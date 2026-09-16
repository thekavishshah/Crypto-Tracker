-- Create historical_prices table to store daily price history
CREATE TABLE IF NOT EXISTS historical_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  open NUMERIC(12, 2),
  high NUMERIC(12, 2),
  low NUMERIC(12, 2),
  close NUMERIC(12, 2) NOT NULL,
  volume BIGINT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_historical_prices_symbol_date ON historical_prices(symbol, date DESC);

-- Create predictions table to store model predictions
CREATE TABLE IF NOT EXISTS predictions (
  id BIGSERIAL PRIMARY KEY,
  symbol TEXT NOT NULL,
  prediction_date DATE NOT NULL,
  target_date DATE NOT NULL,
  model_type TEXT NOT NULL, -- 'linear_regression' or 'ma_crossover'
  predicted_price NUMERIC(12, 2),
  predicted_direction TEXT, -- 'up', 'down', 'neutral'
  confidence NUMERIC(5, 2), -- percentage 0-100
  reasoning TEXT, -- human-readable explanation
  model_params JSONB, -- store model details (slope, MA values, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for predictions
CREATE INDEX IF NOT EXISTS idx_predictions_symbol_date ON predictions(symbol, target_date DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_type, created_at DESC);

-- Create prediction_results table to track accuracy
CREATE TABLE IF NOT EXISTS prediction_results (
  id BIGSERIAL PRIMARY KEY,
  prediction_id BIGINT REFERENCES predictions(id) ON DELETE CASCADE,
  actual_price NUMERIC(12, 2) NOT NULL,
  actual_direction TEXT NOT NULL,
  was_direction_correct BOOLEAN,
  price_error NUMERIC(12, 2), -- absolute error
  price_error_percent NUMERIC(5, 2), -- percentage error
  evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for results
CREATE INDEX IF NOT EXISTS idx_prediction_results_prediction_id ON prediction_results(prediction_id);

-- Enable Row Level Security (optional, for future auth)
ALTER TABLE historical_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_results ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for now (adjust when adding auth)
CREATE POLICY "Allow public read on historical_prices" ON historical_prices FOR SELECT USING (true);
CREATE POLICY "Allow public insert on historical_prices" ON historical_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on predictions" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on prediction_results" ON prediction_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert on prediction_results" ON prediction_results FOR INSERT WITH CHECK (true);

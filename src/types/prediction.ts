export interface HistoricalPrice {
  id?: number;
  symbol: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
  date: string;
  created_at?: string;
}

export interface Prediction {
  id?: number;
  symbol: string;
  prediction_date: string;
  target_date: string;
  model_type: 'linear_regression' | 'ma_crossover';
  predicted_price?: number;
  predicted_direction: 'up' | 'down' | 'neutral';
  confidence: number;
  reasoning: string;
  model_params: Record<string, any>;
  created_at?: string;
}

export interface PredictionResult {
  id?: number;
  prediction_id: number;
  actual_price: number;
  actual_direction: 'up' | 'down' | 'neutral';
  was_direction_correct: boolean;
  price_error: number;
  price_error_percent: number;
  evaluated_at?: string;
}

export interface ModelAccuracy {
  model_type: string;
  total_predictions: number;
  directional_accuracy: number; // percentage
  mean_absolute_percentage_error: number; // MAPE
  correct_predictions: number;
  incorrect_predictions: number;
}

export interface PredictionWithResult extends Prediction {
  result?: PredictionResult;
}

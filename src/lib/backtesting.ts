import {
  HistoricalPrice,
  Prediction,
  PredictionResult,
  ModelAccuracy,
} from '@/types/prediction';
import { linearRegressionPrediction, maCrossoverPrediction } from './predictionModels';

export interface BacktestResult {
  predictions: Prediction[];
  results: PredictionResult[];
  accuracy: ModelAccuracy;
}

/**
 * Run backtest for a specific model on historical data
 * For each day in the test period, make a prediction using only prior data
 * and compare it to the actual next-day price
 */
export function runBacktest(
  historicalData: HistoricalPrice[],
  modelType: 'linear_regression' | 'ma_crossover',
  lookbackDays: number = 30,
  testDays: number = 60
): BacktestResult {
  // Sort data by date
  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const predictions: Prediction[] = [];
  const results: PredictionResult[] = [];

  // We need at least lookbackDays + testDays + 1 (for actual outcome)
  const minDataPoints = lookbackDays + testDays + 1;
  if (sortedData.length < minDataPoints) {
    console.warn(
      `Insufficient data for backtesting. Need ${minDataPoints}, have ${sortedData.length}`
    );
    return {
      predictions: [],
      results: [],
      accuracy: {
        model_type: modelType,
        total_predictions: 0,
        directional_accuracy: 0,
        mean_absolute_percentage_error: 0,
        correct_predictions: 0,
        incorrect_predictions: 0,
      },
    };
  }

  // Start backtest from (lookbackDays) to (length - 1)
  // We need at least lookbackDays of history before making first prediction
  const startIndex = lookbackDays;
  const endIndex = Math.min(sortedData.length - 1, startIndex + testDays);

  for (let i = startIndex; i < endIndex; i++) {
    // Use data up to index i (not including i) to predict day i
    const trainingData = sortedData.slice(0, i);

    // Make prediction
    let prediction: Prediction | null = null;

    if (modelType === 'linear_regression') {
      prediction = linearRegressionPrediction(trainingData, lookbackDays);
    } else if (modelType === 'ma_crossover') {
      prediction = maCrossoverPrediction(trainingData, 7, 21);
    }

    if (!prediction) {
      continue;
    }

    // Get actual outcome (next day)
    const actualData = sortedData[i];
    const previousData = sortedData[i - 1];
    const actualPrice = actualData.close;
    const previousPrice = previousData.close;

    // Determine actual direction
    const priceChange = actualPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    let actual_direction: 'up' | 'down' | 'neutral';
    if (priceChangePercent > 0.5) {
      actual_direction = 'up';
    } else if (priceChangePercent < -0.5) {
      actual_direction = 'down';
    } else {
      actual_direction = 'neutral';
    }

    // Calculate errors
    const price_error = Math.abs((prediction.predicted_price || 0) - actualPrice);
    const price_error_percent = (price_error / actualPrice) * 100;

    // Check if direction was correct
    const was_direction_correct = prediction.predicted_direction === actual_direction;

    // Create result
    const result: PredictionResult = {
      prediction_id: predictions.length + 1, // temporary ID
      actual_price: actualPrice,
      actual_direction,
      was_direction_correct,
      price_error,
      price_error_percent,
    };

    predictions.push(prediction);
    results.push(result);
  }

  // Calculate overall accuracy metrics
  const total_predictions = results.length;
  const correct_predictions = results.filter((r) => r.was_direction_correct).length;
  const incorrect_predictions = total_predictions - correct_predictions;
  const directional_accuracy =
    total_predictions > 0 ? (correct_predictions / total_predictions) * 100 : 0;

  // Calculate MAPE (Mean Absolute Percentage Error)
  const total_mape = results.reduce((sum, r) => sum + r.price_error_percent, 0);
  const mean_absolute_percentage_error =
    total_predictions > 0 ? total_mape / total_predictions : 0;

  const accuracy: ModelAccuracy = {
    model_type: modelType,
    total_predictions,
    directional_accuracy: Number(directional_accuracy.toFixed(2)),
    mean_absolute_percentage_error: Number(mean_absolute_percentage_error.toFixed(2)),
    correct_predictions,
    incorrect_predictions,
  };

  return {
    predictions,
    results,
    accuracy,
  };
}

/**
 * Run backtest for multiple symbols and combine results
 */
export function runMultiSymbolBacktest(
  historicalDataBySymbol: Record<string, HistoricalPrice[]>,
  modelType: 'linear_regression' | 'ma_crossover',
  lookbackDays: number = 30,
  testDays: number = 60
): {
  allPredictions: Prediction[];
  allResults: PredictionResult[];
  overallAccuracy: ModelAccuracy;
  accuracyBySymbol: Record<string, ModelAccuracy>;
} {
  const allPredictions: Prediction[] = [];
  const allResults: PredictionResult[] = [];
  const accuracyBySymbol: Record<string, ModelAccuracy> = {};

  for (const [symbol, data] of Object.entries(historicalDataBySymbol)) {
    const backtestResult = runBacktest(data, modelType, lookbackDays, testDays);

    allPredictions.push(...backtestResult.predictions);
    allResults.push(...backtestResult.results);
    accuracyBySymbol[symbol] = backtestResult.accuracy;
  }

  // Calculate overall accuracy
  const total_predictions = allResults.length;
  const correct_predictions = allResults.filter((r) => r.was_direction_correct).length;
  const incorrect_predictions = total_predictions - correct_predictions;
  const directional_accuracy =
    total_predictions > 0 ? (correct_predictions / total_predictions) * 100 : 0;

  const total_mape = allResults.reduce((sum, r) => sum + r.price_error_percent, 0);
  const mean_absolute_percentage_error =
    total_predictions > 0 ? total_mape / total_predictions : 0;

  const overallAccuracy: ModelAccuracy = {
    model_type: modelType,
    total_predictions,
    directional_accuracy: Number(directional_accuracy.toFixed(2)),
    mean_absolute_percentage_error: Number(mean_absolute_percentage_error.toFixed(2)),
    correct_predictions,
    incorrect_predictions,
  };

  return {
    allPredictions,
    allResults,
    overallAccuracy,
    accuracyBySymbol,
  };
}

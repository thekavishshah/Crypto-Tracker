import regression from 'regression';
import { HistoricalPrice, Prediction } from '@/types/prediction';

/**
 * Linear Regression Model
 * Fits a linear trend line to the last N days of price data
 * and predicts the next day's price based on the trend
 */
export function linearRegressionPrediction(
  historicalData: HistoricalPrice[],
  lookbackDays: number = 30
): Prediction | null {
  if (historicalData.length < lookbackDays) {
    return null;
  }

  // Sort by date ascending
  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Take last N days
  const recentData = sortedData.slice(-lookbackDays);

  // Prepare data for regression: [day_index, price]
  const regressionData: [number, number][] = recentData.map((item, index) => [
    index,
    item.close,
  ]);

  // Fit linear regression
  const result = regression.linear(regressionData);

  // Predict next day (index = lookbackDays)
  const predictedPrice = result.predict(lookbackDays)[1];

  // Calculate daily slope (price change per day)
  const slope = result.equation[0]; // m in y = mx + b
  const intercept = result.equation[1]; // b in y = mx + b

  // Get current price
  const currentPrice = recentData[recentData.length - 1].close;

  // Calculate predicted change
  const predictedChange = predictedPrice - currentPrice;
  const predictedChangePercent = (predictedChange / currentPrice) * 100;

  // Determine direction
  let predicted_direction: 'up' | 'down' | 'neutral';
  if (predictedChangePercent > 0.5) {
    predicted_direction = 'up';
  } else if (predictedChangePercent < -0.5) {
    predicted_direction = 'down';
  } else {
    predicted_direction = 'neutral';
  }

  // Calculate R² for confidence
  const r2 = result.r2;
  const confidence = Math.min(Math.max(r2 * 100, 10), 95); // Clamp between 10-95%

  // Create reasoning
  const reasoning = `Linear regression on ${lookbackDays}-day trend. Daily slope: ${slope.toFixed(
    2
  )} (${slope > 0 ? '+' : ''}${((slope / currentPrice) * 100).toFixed(
    2
  )}%/day). R²: ${r2.toFixed(3)}. Current: $${currentPrice.toFixed(
    2
  )}, Predicted: $${predictedPrice.toFixed(2)} (${
    predictedChangePercent > 0 ? '+' : ''
  }${predictedChangePercent.toFixed(2)}%)`;

  const currentDate = new Date();
  const targetDate = new Date(currentDate);
  targetDate.setDate(targetDate.getDate() + 1);

  return {
    symbol: historicalData[0].symbol,
    prediction_date: currentDate.toISOString().split('T')[0],
    target_date: targetDate.toISOString().split('T')[0],
    model_type: 'linear_regression',
    predicted_price: Number(predictedPrice.toFixed(2)),
    predicted_direction,
    confidence: Number(confidence.toFixed(2)),
    reasoning,
    model_params: {
      slope,
      intercept,
      r2,
      lookback_days: lookbackDays,
      current_price: currentPrice,
    },
  };
}

/**
 * Moving Average Crossover Model
 * Compares short-term (7-day) and long-term (21-day) moving averages
 * to predict price direction
 */
export function maCrossoverPrediction(
  historicalData: HistoricalPrice[],
  shortWindow: number = 7,
  longWindow: number = 21
): Prediction | null {
  if (historicalData.length < longWindow) {
    return null;
  }

  // Sort by date ascending
  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate moving averages
  const calculateMA = (data: HistoricalPrice[], window: number): number => {
    const recent = data.slice(-window);
    const sum = recent.reduce((acc, item) => acc + item.close, 0);
    return sum / window;
  };

  const shortMA = calculateMA(sortedData, shortWindow);
  const longMA = calculateMA(sortedData, longWindow);

  // Calculate previous day MAs to detect crossover
  const prevShortMA = calculateMA(sortedData.slice(0, -1), shortWindow);
  const prevLongMA = calculateMA(sortedData.slice(0, -1), longWindow);

  const currentPrice = sortedData[sortedData.length - 1].close;

  // Determine signal
  const maDiff = shortMA - longMA;
  const maDiffPercent = (maDiff / longMA) * 100;
  const prevMaDiff = prevShortMA - prevLongMA;

  let predicted_direction: 'up' | 'down' | 'neutral';
  let signal = '';

  // Bullish crossover: short MA crosses above long MA
  if (prevMaDiff <= 0 && maDiff > 0) {
    predicted_direction = 'up';
    signal = 'Bullish crossover detected';
  }
  // Bearish crossover: short MA crosses below long MA
  else if (prevMaDiff >= 0 && maDiff < 0) {
    predicted_direction = 'down';
    signal = 'Bearish crossover detected';
  }
  // Short MA above long MA (bullish trend)
  else if (maDiff > 0) {
    predicted_direction = maDiffPercent > 1 ? 'up' : 'neutral';
    signal = 'Bullish trend (short MA above long MA)';
  }
  // Short MA below long MA (bearish trend)
  else {
    predicted_direction = maDiffPercent < -1 ? 'down' : 'neutral';
    signal = 'Bearish trend (short MA below long MA)';
  }

  // Calculate confidence based on MA separation
  const separation = Math.abs(maDiffPercent);
  let confidence: number;

  if (separation > 5) {
    confidence = 85; // Strong signal
  } else if (separation > 2) {
    confidence = 70; // Moderate signal
  } else if (separation > 0.5) {
    confidence = 55; // Weak signal
  } else {
    confidence = 40; // Very weak signal
  }

  // Estimate predicted price based on MA trend
  // Simple estimate: current + (short MA - long MA)
  const predicted_price = currentPrice + maDiff;

  const reasoning = `${shortWindow}/${longWindow}-day MA crossover. ${signal}. Short MA: $${shortMA.toFixed(
    2
  )}, Long MA: $${longMA.toFixed(2)}, Diff: ${maDiff > 0 ? '+' : ''}${maDiff.toFixed(
    2
  )} (${maDiffPercent > 0 ? '+' : ''}${maDiffPercent.toFixed(
    2
  )}%). Current: $${currentPrice.toFixed(2)}`;

  const currentDate = new Date();
  const targetDate = new Date(currentDate);
  targetDate.setDate(targetDate.getDate() + 1);

  return {
    symbol: historicalData[0].symbol,
    prediction_date: currentDate.toISOString().split('T')[0],
    target_date: targetDate.toISOString().split('T')[0],
    model_type: 'ma_crossover',
    predicted_price: Number(predicted_price.toFixed(2)),
    predicted_direction,
    confidence: Number(confidence.toFixed(2)),
    reasoning,
    model_params: {
      short_ma: shortMA,
      long_ma: longMA,
      short_window: shortWindow,
      long_window: longWindow,
      ma_diff: maDiff,
      ma_diff_percent: maDiffPercent,
      signal,
    },
  };
}

/**
 * Calculate moving average for a given window
 */
export function calculateMovingAverage(
  data: HistoricalPrice[],
  window: number
): number[] {
  const result: number[] = [];

  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    const avg = slice.reduce((sum, item) => sum + item.close, 0) / window;
    result.push(avg);
  }

  return result;
}

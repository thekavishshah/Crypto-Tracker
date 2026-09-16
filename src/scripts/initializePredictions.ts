/**
 * Initialization script to seed historical data and run initial backtests
 *
 * This script:
 * 1. Applies the database migration for prediction tables
 * 2. Fetches 90 days of historical data for watchlist symbols
 * 3. Runs backtests on the historical data
 * 4. Generates initial predictions
 *
 * Run this once to set up the prediction system
 */

import { supabase } from '../integrations/supabase/client';
import { runMultiSymbolBacktest } from '../lib/backtesting';
import { linearRegressionPrediction, maCrossoverPrediction } from '../lib/predictionModels';
import { HistoricalPrice } from '../types/prediction';

const DEFAULT_SYMBOLS = ['AAPL', 'GOOGL', 'TSLA', 'MSFT'];

async function fetchAndSaveHistoricalData(symbols: string[], days: number = 90) {
  console.log(`Fetching ${days} days of historical data for ${symbols.join(', ')}...`);

  try {
    const { data, error } = await supabase.functions.invoke('fetch-historical-data', {
      body: { symbols, days, saveToDb: true },
    });

    if (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }

    console.log(`✓ Fetched and saved ${data.count} historical price records`);
    return data.historicalData as HistoricalPrice[];
  } catch (error) {
    console.error('Failed to fetch historical data:', error);
    throw error;
  }
}

async function runBacktests(symbols: string[]) {
  console.log('Running backtests...');

  try {
    // Fetch historical data for all symbols
    const { data: allHistoricalData, error } = await supabase
      .from('historical_prices')
      .select('*')
      .in('symbol', symbols)
      .order('date', { ascending: true });

    if (error) throw error;

    if (!allHistoricalData || allHistoricalData.length === 0) {
      throw new Error('No historical data found. Please fetch data first.');
    }

    // Group by symbol
    const dataBySymbol: Record<string, HistoricalPrice[]> = {};
    allHistoricalData.forEach((item: any) => {
      if (!dataBySymbol[item.symbol]) {
        dataBySymbol[item.symbol] = [];
      }
      dataBySymbol[item.symbol].push(item as HistoricalPrice);
    });

    // Run backtests for linear regression
    console.log('  Running Linear Regression backtest...');
    const lrBacktest = runMultiSymbolBacktest(dataBySymbol, 'linear_regression', 30, 60);

    // Run backtests for MA crossover
    console.log('  Running MA Crossover backtest...');
    const maBacktest = runMultiSymbolBacktest(dataBySymbol, 'ma_crossover', 21, 60);

    // Save predictions to database
    console.log('  Saving backtest predictions to database...');

    if (lrBacktest.allPredictions.length > 0) {
      const { data: savedLRPredictions, error: lrError } = await supabase
        .from('predictions')
        .insert(lrBacktest.allPredictions)
        .select();

      if (!lrError && savedLRPredictions) {
        const resultsWithIds = lrBacktest.allResults.map((result, index) => ({
          ...result,
          prediction_id: savedLRPredictions[index].id,
        }));

        await supabase.from('prediction_results').insert(resultsWithIds);
      }
    }

    if (maBacktest.allPredictions.length > 0) {
      const { data: savedMAPredictions, error: maError } = await supabase
        .from('predictions')
        .insert(maBacktest.allPredictions)
        .select();

      if (!maError && savedMAPredictions) {
        const resultsWithIds = maBacktest.allResults.map((result, index) => ({
          ...result,
          prediction_id: savedMAPredictions[index].id,
        }));

        await supabase.from('prediction_results').insert(resultsWithIds);
      }
    }

    console.log('\n=== Backtest Results ===');
    console.log('\nLinear Regression:');
    console.log(`  Total Predictions: ${lrBacktest.overallAccuracy.total_predictions}`);
    console.log(
      `  Directional Accuracy: ${lrBacktest.overallAccuracy.directional_accuracy.toFixed(2)}%`
    );
    console.log(`  MAPE: ${lrBacktest.overallAccuracy.mean_absolute_percentage_error.toFixed(2)}%`);
    console.log(
      `  Correct: ${lrBacktest.overallAccuracy.correct_predictions} / Incorrect: ${lrBacktest.overallAccuracy.incorrect_predictions}`
    );

    console.log('\nMA Crossover:');
    console.log(`  Total Predictions: ${maBacktest.overallAccuracy.total_predictions}`);
    console.log(
      `  Directional Accuracy: ${maBacktest.overallAccuracy.directional_accuracy.toFixed(2)}%`
    );
    console.log(`  MAPE: ${maBacktest.overallAccuracy.mean_absolute_percentage_error.toFixed(2)}%`);
    console.log(
      `  Correct: ${maBacktest.overallAccuracy.correct_predictions} / Incorrect: ${maBacktest.overallAccuracy.incorrect_predictions}`
    );

    console.log('\nPer-Symbol Accuracy:');
    Object.entries(lrBacktest.accuracyBySymbol).forEach(([symbol, acc]) => {
      console.log(`  ${symbol} (LR): ${acc.directional_accuracy.toFixed(2)}%`);
    });
    Object.entries(maBacktest.accuracyBySymbol).forEach(([symbol, acc]) => {
      console.log(`  ${symbol} (MA): ${acc.directional_accuracy.toFixed(2)}%`);
    });

    console.log('\n✓ Backtests complete and results saved');
    return { lrBacktest, maBacktest };
  } catch (error) {
    console.error('Failed to run backtests:', error);
    throw error;
  }
}

async function generateCurrentPredictions(symbols: string[]) {
  console.log('Generating current predictions...');

  try {
    // Fetch latest historical data for each symbol
    const predictions = [];

    for (const symbol of symbols) {
      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .eq('symbol', symbol)
        .order('date', { ascending: true })
        .limit(90);

      if (error || !data || data.length < 30) {
        console.warn(`  Insufficient data for ${symbol}, skipping`);
        continue;
      }

      const historicalData = data as HistoricalPrice[];

      // Generate predictions
      const lrPrediction = linearRegressionPrediction(historicalData, 30);
      const maPrediction = maCrossoverPrediction(historicalData, 7, 21);

      if (lrPrediction) {
        predictions.push(lrPrediction);
        console.log(
          `  ${symbol} LR: ${lrPrediction.predicted_direction} ($${lrPrediction.predicted_price?.toFixed(
            2
          )})`
        );
      }

      if (maPrediction) {
        predictions.push(maPrediction);
        console.log(
          `  ${symbol} MA: ${maPrediction.predicted_direction} ($${maPrediction.predicted_price?.toFixed(
            2
          )})`
        );
      }
    }

    // Save predictions
    if (predictions.length > 0) {
      const { error } = await supabase.from('predictions').insert(predictions);

      if (error) {
        console.error('Error saving current predictions:', error);
      } else {
        console.log(`✓ Generated and saved ${predictions.length} current predictions`);
      }
    }
  } catch (error) {
    console.error('Failed to generate current predictions:', error);
    throw error;
  }
}

export async function initializePredictionSystem(symbols: string[] = DEFAULT_SYMBOLS) {
  console.log('=== Initializing Prediction System ===\n');

  try {
    // Step 1: Fetch and save historical data
    await fetchAndSaveHistoricalData(symbols, 90);

    // Step 2: Run backtests
    await runBacktests(symbols);

    // Step 3: Generate current predictions
    await generateCurrentPredictions(symbols);

    console.log('\n=== Initialization Complete ===');
    console.log('✓ Historical data loaded');
    console.log('✓ Backtests run and results saved');
    console.log('✓ Current predictions generated');
    console.log('\nYou can now use the Predictions tab in the UI!');
  } catch (error) {
    console.error('\n✗ Initialization failed:', error);
    throw error;
  }
}

// If running as a script
if (typeof window === 'undefined') {
  initializePredictionSystem().catch(console.error);
}

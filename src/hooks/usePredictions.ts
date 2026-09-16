import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HistoricalPrice, Prediction, ModelAccuracy } from '@/types/prediction';
import { linearRegressionPrediction, maCrossoverPrediction } from '@/lib/predictionModels';
import { runBacktest } from '@/lib/backtesting';
import { toast } from 'sonner';

export const usePredictions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [accuracy, setAccuracy] = useState<{
    linear_regression?: ModelAccuracy;
    ma_crossover?: ModelAccuracy;
  }>({});

  /**
   * Fetch historical data from Supabase or API
   */
  const fetchHistoricalData = useCallback(
    async (symbol: string, days: number = 90): Promise<HistoricalPrice[]> => {
      try {
        // First, check if we have data in Supabase
        const { data: existingData, error: fetchError } = await supabase
          .from('historical_prices')
          .select('*')
          .eq('symbol', symbol.toUpperCase())
          .order('date', { ascending: true })
          .limit(days);

        if (fetchError) throw fetchError;

        // If we have enough data, return it
        if (existingData && existingData.length >= days * 0.8) {
          return existingData as HistoricalPrice[];
        }

        // Otherwise, fetch from API
        const { data: apiData, error: apiError } = await supabase.functions.invoke(
          'fetch-historical-data',
          {
            body: { symbols: [symbol], days, saveToDb: true },
          }
        );

        if (apiError) throw apiError;

        return apiData.historicalData.filter(
          (item: HistoricalPrice) => item.symbol === symbol.toUpperCase()
        );
      } catch (error) {
        console.error('Error fetching historical data:', error);
        toast.error(`Failed to fetch historical data for ${symbol}`);
        return [];
      }
    },
    []
  );

  /**
   * Generate predictions for a symbol
   */
  const generatePredictions = useCallback(
    async (symbol: string): Promise<Prediction[]> => {
      setIsLoading(true);
      try {
        // Fetch historical data (fetch 127 to get all available data)
        const historicalData = await fetchHistoricalData(symbol, 127);

        if (historicalData.length < 30) {
          toast.error(`Insufficient data for ${symbol}. Need at least 30 days.`);
          return [];
        }

        const newPredictions: Prediction[] = [];

        // Generate linear regression prediction
        const lrPrediction = linearRegressionPrediction(historicalData, 30);
        if (lrPrediction) {
          newPredictions.push(lrPrediction);
        }

        // Generate MA crossover prediction
        const maPrediction = maCrossoverPrediction(historicalData, 7, 21);
        if (maPrediction) {
          newPredictions.push(maPrediction);
        }

        // Save predictions to database
        if (newPredictions.length > 0) {
          const { error: insertError } = await supabase
            .from('predictions')
            .insert(newPredictions);

          if (insertError) {
            console.error('Error saving predictions:', insertError);
          }
        }

        return newPredictions;
      } catch (error) {
        console.error('Error generating predictions:', error);
        toast.error('Failed to generate predictions');
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHistoricalData]
  );

  /**
   * Run backtesting for a symbol
   */
  const runBacktesting = useCallback(
    async (symbol: string, testDays: number = 60) => {
      setIsLoading(true);
      try {
        // Fetch historical data (need 127 days to ensure we have 91+ trading days)
        const historicalData = await fetchHistoricalData(symbol, 127);

        const minRequired = 30 + testDays + 1; // lookback + test + outcome
        if (historicalData.length < minRequired) {
          toast.error(`Insufficient data for backtesting ${symbol}. Need at least ${minRequired} days, have ${historicalData.length}.`);
          return;
        }

        // Run backtest for linear regression
        const lrBacktest = runBacktest(historicalData, 'linear_regression', 30, testDays);

        // Run backtest for MA crossover
        const maBacktest = runBacktest(historicalData, 'ma_crossover', 21, testDays);

        // Update accuracy state
        setAccuracy({
          linear_regression: lrBacktest.accuracy,
          ma_crossover: maBacktest.accuracy,
        });

        // Save predictions and results to database
        if (lrBacktest.predictions.length > 0) {
          const { data: savedPredictions, error: predError } = await supabase
            .from('predictions')
            .insert(lrBacktest.predictions)
            .select();

          if (!predError && savedPredictions) {
            // Save results with correct prediction IDs
            const resultsWithIds = lrBacktest.results.map((result, index) => ({
              ...result,
              prediction_id: savedPredictions[index].id,
            }));

            await supabase.from('prediction_results').insert(resultsWithIds);
          }
        }

        if (maBacktest.predictions.length > 0) {
          const { data: savedPredictions, error: predError } = await supabase
            .from('predictions')
            .insert(maBacktest.predictions)
            .select();

          if (!predError && savedPredictions) {
            const resultsWithIds = maBacktest.results.map((result, index) => ({
              ...result,
              prediction_id: savedPredictions[index].id,
            }));

            await supabase.from('prediction_results').insert(resultsWithIds);
          }
        }

        toast.success(
          `Backtesting complete for ${symbol}. LR accuracy: ${lrBacktest.accuracy.directional_accuracy.toFixed(
            1
          )}%, MA accuracy: ${maBacktest.accuracy.directional_accuracy.toFixed(1)}%`
        );
      } catch (error) {
        console.error('Error running backtest:', error);
        toast.error('Failed to run backtest');
      } finally {
        setIsLoading(false);
      }
    },
    [fetchHistoricalData]
  );

  /**
   * Fetch latest predictions from database
   */
  const fetchPredictions = useCallback(async (symbols: string[]) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .in('symbol', symbols.map((s) => s.toUpperCase()))
        .order('created_at', { ascending: false })
        .limit(symbols.length * 2); // Get latest 2 predictions per symbol

      if (error) throw error;

      setPredictions((data as Prediction[]) || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
      toast.error('Failed to fetch predictions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch accuracy metrics from database
   */
  const fetchAccuracy = useCallback(async () => {
    try {
      // Fetch all prediction results with their predictions
      const { data, error } = await supabase
        .from('prediction_results')
        .select(
          `
          *,
          predictions!inner (
            model_type
          )
        `
        );

      if (error) throw error;

      if (!data || data.length === 0) {
        return;
      }

      // Calculate accuracy by model type
      const lrResults = data.filter((r: any) => r.predictions.model_type === 'linear_regression');
      const maResults = data.filter((r: any) => r.predictions.model_type === 'ma_crossover');

      const calculateAccuracy = (results: any[]): ModelAccuracy => {
        const total = results.length;
        const correct = results.filter((r) => r.was_direction_correct).length;
        const mape =
          results.reduce((sum, r) => sum + r.price_error_percent, 0) / total || 0;

        return {
          model_type: results[0]?.predictions?.model_type || 'unknown',
          total_predictions: total,
          directional_accuracy: (correct / total) * 100,
          mean_absolute_percentage_error: mape,
          correct_predictions: correct,
          incorrect_predictions: total - correct,
        };
      };

      setAccuracy({
        linear_regression: lrResults.length > 0 ? calculateAccuracy(lrResults) : undefined,
        ma_crossover: maResults.length > 0 ? calculateAccuracy(maResults) : undefined,
      });
    } catch (error) {
      console.error('Error fetching accuracy:', error);
    }
  }, []);

  return {
    predictions,
    accuracy,
    isLoading,
    fetchHistoricalData,
    generatePredictions,
    runBacktesting,
    fetchPredictions,
    fetchAccuracy,
  };
};

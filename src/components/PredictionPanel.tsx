import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, RefreshCw } from 'lucide-react';
import { Prediction, ModelAccuracy } from '@/types/prediction';

interface PredictionPanelProps {
  predictions: Prediction[];
  accuracy: {
    linear_regression?: ModelAccuracy;
    ma_crossover?: ModelAccuracy;
  };
  isLoading: boolean;
  onGeneratePredictions: (symbol: string) => void;
  onRunBacktest: (symbol: string) => void;
  watchlist: string[];
}

const PredictionPanel = ({
  predictions,
  accuracy,
  isLoading,
  onGeneratePredictions,
  onRunBacktest,
  watchlist,
}: PredictionPanelProps) => {
  // Group predictions by symbol
  const predictionsBySymbol = predictions.reduce((acc, pred) => {
    if (!acc[pred.symbol]) {
      acc[pred.symbol] = [];
    }
    acc[pred.symbol].push(pred);
    return acc;
  }, {} as Record<string, Prediction[]>);

  const getDirectionIcon = (direction: string) => {
    if (direction === 'up') return <TrendingUp className="h-4 w-4 text-gain" />;
    if (direction === 'down') return <TrendingDown className="h-4 w-4 text-loss" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const getDirectionColor = (direction: string) => {
    if (direction === 'up') return 'text-gain';
    if (direction === 'down') return 'text-loss';
    return 'text-muted-foreground';
  };

  const getModelName = (modelType: string) => {
    if (modelType === 'linear_regression') return 'Linear Regression';
    if (modelType === 'ma_crossover') return 'MA Crossover';
    return modelType;
  };

  const AccuracyCard = ({ modelAccuracy }: { modelAccuracy: ModelAccuracy }) => (
    <Card className="bg-muted/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4" />
          {getModelName(modelAccuracy.model_type)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Directional Accuracy</span>
          <span className="text-sm font-bold">
            {modelAccuracy.directional_accuracy.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Correct / Total</span>
          <span className="text-sm font-medium">
            {modelAccuracy.correct_predictions} / {modelAccuracy.total_predictions}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">MAPE</span>
          <span className="text-sm font-medium">
            {modelAccuracy.mean_absolute_percentage_error.toFixed(2)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Accuracy Overview */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Model Performance (Backtested)
        </h3>
        {accuracy.linear_regression || accuracy.ma_crossover ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accuracy.linear_regression && (
              <AccuracyCard modelAccuracy={accuracy.linear_regression} />
            )}
            {accuracy.ma_crossover && <AccuracyCard modelAccuracy={accuracy.ma_crossover} />}
          </div>
        ) : (
          <Card className="p-6 text-center bg-muted/30">
            <p className="text-muted-foreground text-sm mb-3">
              No backtest results yet. Run backtest to see model accuracy.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => watchlist.length > 0 && onRunBacktest(watchlist[0])}
              disabled={isLoading || watchlist.length === 0}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Run Backtest
            </Button>
          </Card>
        )}
      </div>

      {/* Predictions by Symbol */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Current Predictions
        </h3>

        {predictions.length > 0 ? (
          <Tabs defaultValue={Object.keys(predictionsBySymbol)[0]} className="w-full">
            <TabsList className="w-full grid grid-cols-2 md:grid-cols-4">
              {Object.keys(predictionsBySymbol).map((symbol) => (
                <TabsTrigger key={symbol} value={symbol}>
                  {symbol}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(predictionsBySymbol).map(([symbol, symbolPredictions]) => (
              <TabsContent key={symbol} value={symbol} className="space-y-4 mt-4">
                {symbolPredictions.map((prediction, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {getModelName(prediction.model_type)}
                            <Badge variant="outline" className="ml-2">
                              {prediction.confidence}% confidence
                            </Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Prediction for {prediction.target_date}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDirectionIcon(prediction.predicted_direction)}
                          <span
                            className={`text-lg font-bold ${getDirectionColor(
                              prediction.predicted_direction
                            )}`}
                          >
                            {prediction.predicted_direction.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Predicted Price</span>
                          <span className="text-lg font-semibold">
                            ${prediction.predicted_price?.toFixed(2)}
                          </span>
                        </div>

                        <div className="pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Model Reasoning:
                          </p>
                          <p className="text-sm">{prediction.reasoning}</p>
                        </div>

                        {prediction.model_params && (
                          <div className="pt-3 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Technical Details:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {prediction.model_type === 'linear_regression' && (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">Slope:</span>{' '}
                                    <span className="font-mono">
                                      {prediction.model_params.slope?.toFixed(4)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">R²:</span>{' '}
                                    <span className="font-mono">
                                      {prediction.model_params.r2?.toFixed(3)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Lookback:</span>{' '}
                                    <span className="font-mono">
                                      {prediction.model_params.lookback_days} days
                                    </span>
                                  </div>
                                </>
                              )}
                              {prediction.model_type === 'ma_crossover' && (
                                <>
                                  <div>
                                    <span className="text-muted-foreground">Short MA:</span>{' '}
                                    <span className="font-mono">
                                      ${prediction.model_params.short_ma?.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Long MA:</span>{' '}
                                    <span className="font-mono">
                                      ${prediction.model_params.long_ma?.toFixed(2)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">MA Diff:</span>{' '}
                                    <span className="font-mono">
                                      {prediction.model_params.ma_diff_percent?.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Signal:</span>{' '}
                                    <span className="font-mono text-xs">
                                      {prediction.model_params.signal}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onGeneratePredictions(symbol)}
                    disabled={isLoading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Predictions
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRunBacktest(symbol)}
                    disabled={isLoading}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Run Backtest
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              No predictions yet. Generate predictions for your watchlist stocks.
            </p>
            <Button
              onClick={() => watchlist.length > 0 && onGeneratePredictions(watchlist[0])}
              disabled={isLoading || watchlist.length === 0}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Generate Predictions
            </Button>
          </Card>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">About These Predictions</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Linear Regression:</strong> Fits a trend line to 30 days of price history to
            predict next-day price. Uses ordinary least squares regression with R² for confidence.
          </p>
          <p>
            <strong>MA Crossover:</strong> Compares 7-day and 21-day moving averages to identify
            bullish/bearish trends. Crossovers signal directional changes.
          </p>
          <p>
            <strong>Backtesting:</strong> Each model is tested on historical data by making
            predictions using only past information and comparing to actual outcomes. Accuracy
            metrics show real performance, not theoretical estimates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictionPanel;

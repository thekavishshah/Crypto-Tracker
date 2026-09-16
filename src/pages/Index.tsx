import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, Activity } from "lucide-react";
import StockCard from "@/components/StockCard";
import StockTable from "@/components/StockTable";
import StockChart from "@/components/StockChart";
import TickerInput from "@/components/TickerInput";
import StockChatbot from "@/components/StockChatbot";
import PredictionPanel from "@/components/PredictionPanel";
import { useStockData } from "@/hooks/useStockData";
import { usePredictions } from "@/hooks/usePredictions";

const Index = () => {
  const {
    stockData,
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    refreshData,
  } = useStockData();

  const {
    predictions,
    accuracy,
    isLoading: isPredictionsLoading,
    generatePredictions,
    runBacktesting,
    fetchPredictions,
    fetchAccuracy,
  } = usePredictions();

  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);

  // Fetch predictions and accuracy on mount
  useEffect(() => {
    if (watchlist.length > 0) {
      fetchPredictions(watchlist);
      fetchAccuracy();
    }
  }, [watchlist]);

  const gainers = stockData.filter(stock => stock.direction === 'up').length;
  const losers = stockData.filter(stock => stock.direction === 'down').length;
  const totalValue = stockData.reduce((sum, stock) => sum + stock.lastClose, 0);

  const selectedStockData = selectedStock 
    ? stockData.find(stock => stock.symbol === selectedStock)
    : stockData[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/95 p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Stock Movement Tracker
            </h1>
            <p className="text-muted-foreground">Real-time stock price monitoring and analysis</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Watchlist</span>
              </div>
              <p className="text-2xl font-bold">{watchlist.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gain" />
                <span className="text-sm text-muted-foreground">Gainers</span>
              </div>
              <p className="text-2xl font-bold text-gain">{gainers}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-loss rotate-180" />
                <span className="text-sm text-muted-foreground">Losers</span>
              </div>
              <p className="text-2xl font-bold text-loss">{losers}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Total Value</span>
              </div>
              <p className="text-2xl font-bold">${totalValue.toFixed(0)}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ticker Input */}
      <TickerInput
        onAddTickers={addToWatchlist}
        onRefresh={refreshData}
        watchlist={watchlist}
        onRemoveFromWatchlist={removeFromWatchlist}
        isLoading={isLoading}
      />

      {/* Main Content */}
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="table">Table</TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="space-y-4">
          {stockData.length > 0 ? (
            <StockTable stocks={stockData} />
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Add some tickers to your watchlist to see stock data</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          {stockData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockData.map((stock) => (
                <StockCard key={stock.id} stock={stock} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Add some tickers to your watchlist to see stock data</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          {stockData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {stockData.map((stock) => (
                  <Badge
                    key={stock.symbol}
                    variant={selectedStock === stock.symbol ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => setSelectedStock(stock.symbol)}
                  >
                    {stock.symbol}
                  </Badge>
                ))}
              </div>
              {selectedStockData && (
                <StockChart
                  symbol={selectedStockData.symbol}
                  data={[]}
                  currentPrice={selectedStockData.lastClose}
                  change={selectedStockData.pctChange}
                />
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Add some tickers to your watchlist to see charts</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionPanel
            predictions={predictions}
            accuracy={accuracy}
            isLoading={isPredictionsLoading}
            onGeneratePredictions={generatePredictions}
            onRunBacktest={runBacktesting}
            watchlist={watchlist}
          />
        </TabsContent>
      </Tabs>

      {/* Backend Integration Info */}
      <Card className="bg-muted/50 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Backend Integration Ready</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This frontend is ready to connect to your FastAPI backend or Supabase. The mock data demonstrates the expected API structure.
          </p>
          <div className="text-xs text-muted-foreground">
            <p>• API Endpoint: <code className="bg-muted px-1 rounded">GET /movements?symbols=AAPL,TSLA</code></p>
            <p>• Database: Ready for Supabase integration with RLS policies</p>
            <p>• Real-time: WebSocket support for live price updates</p>
          </div>
        </CardContent>
      </Card>

      <StockChatbot 
        stockData={stockData}
        isVisible={isChatbotVisible}
        onToggle={() => setIsChatbotVisible(!isChatbotVisible)}
      />
    </div>
  );
};

export default Index;

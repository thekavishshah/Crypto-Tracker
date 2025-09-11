import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface TickerInputProps {
  onAddTickers: (tickers: string[]) => void;
  onRefresh: () => void;
  watchlist: string[];
  onRemoveFromWatchlist: (ticker: string) => void;
  isLoading?: boolean;
}

const TickerInput = ({ 
  onAddTickers, 
  onRefresh, 
  watchlist, 
  onRemoveFromWatchlist,
  isLoading = false 
}: TickerInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      toast.error("Please enter at least one ticker symbol");
      return;
    }

    const tickers = inputValue
      .split(",")
      .map(ticker => ticker.trim().toUpperCase())
      .filter(ticker => ticker.length > 0);

    if (tickers.length === 0) {
      toast.error("Please enter valid ticker symbols");
      return;
    }

    // Validate ticker format (basic validation)
    const invalidTickers = tickers.filter(ticker => 
      !/^[A-Z]{1,5}$/.test(ticker)
    );

    if (invalidTickers.length > 0) {
      toast.error(`Invalid ticker symbols: ${invalidTickers.join(", ")}`);
      return;
    }

    onAddTickers(tickers);
    setInputValue("");
    toast.success(`Added ${tickers.length} ticker${tickers.length > 1 ? 's' : ''} to watchlist`);
  };

  const handleRemoveTicker = (ticker: string) => {
    onRemoveFromWatchlist(ticker);
    toast.success(`Removed ${ticker} from watchlist`);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Stock Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Enter ticker symbols (e.g., AAPL, TSLA, GOOGL)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onRefresh}
            disabled={isLoading}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </form>

        {watchlist.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Watchlist</h4>
            <div className="flex flex-wrap gap-2">
              {watchlist.map((ticker) => (
                <Badge 
                  key={ticker} 
                  variant="secondary" 
                  className="pr-1 bg-secondary/80 hover:bg-secondary"
                >
                  <span className="mr-1">{ticker}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTicker(ticker)}
                    className="h-auto p-0.5 hover:bg-destructive/20 rounded-sm"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Enter comma-separated ticker symbols (e.g., AAPL, TSLA, GOOGL)
        </div>
      </CardContent>
    </Card>
  );
};

export default TickerInput;
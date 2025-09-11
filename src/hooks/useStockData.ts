import { useState, useCallback } from 'react';
import { StockMovement } from '@/types/stock';
import { toast } from 'sonner';

// Mock data for demonstration
const generateMockStockData = (symbols: string[]): StockMovement[] => {
  return symbols.map((symbol, index) => {
    const basePrice = Math.random() * 500 + 50; // Random price between $50-$550
    const changePercent = (Math.random() - 0.5) * 10; // Random change between -5% and +5%
    const previousClose = basePrice;
    const lastClose = previousClose * (1 + changePercent / 100);
    
    return {
      id: `${symbol}-${Date.now()}-${index}`,
      symbol,
      previousClose: Number(previousClose.toFixed(2)),
      lastClose: Number(lastClose.toFixed(2)),
      pctChange: Number(changePercent.toFixed(2)),
      direction: changePercent > 0.1 ? 'up' : changePercent < -0.1 ? 'down' : 'neutral',
      date: new Date().toISOString(),
      volume: Math.floor(Math.random() * 10000000) + 1000000, // Random volume
    };
  });
};

export const useStockData = () => {
  const [stockData, setStockData] = useState<StockMovement[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>(['AAPL', 'GOOGL', 'TSLA', 'MSFT']);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStockData = useCallback(async (symbols: string[]) => {
    setIsLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would call your backend API
      // const response = await fetch('/api/movements?symbols=' + symbols.join(','));
      // const data = await response.json();
      
      const mockData = generateMockStockData(symbols);
      setStockData(mockData);
      
      toast.success(`Updated data for ${symbols.length} stocks`);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToWatchlist = useCallback((tickers: string[]) => {
    const newTickers = tickers.filter(ticker => !watchlist.includes(ticker));
    if (newTickers.length > 0) {
      const updatedWatchlist = [...watchlist, ...newTickers];
      setWatchlist(updatedWatchlist);
      fetchStockData(updatedWatchlist);
    } else {
      toast.info('All tickers are already in your watchlist');
    }
  }, [watchlist, fetchStockData]);

  const removeFromWatchlist = useCallback((ticker: string) => {
    const updatedWatchlist = watchlist.filter(t => t !== ticker);
    setWatchlist(updatedWatchlist);
    setStockData(prev => prev.filter(stock => stock.symbol !== ticker));
  }, [watchlist]);

  const refreshData = useCallback(() => {
    if (watchlist.length > 0) {
      fetchStockData(watchlist);
    } else {
      toast.info('Add some tickers to your watchlist first');
    }
  }, [watchlist, fetchStockData]);

  return {
    stockData,
    watchlist,
    isLoading,
    addToWatchlist,
    removeFromWatchlist,
    refreshData,
    fetchStockData,
  };
};
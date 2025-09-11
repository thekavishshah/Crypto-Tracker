export interface StockMovement {
  id: string;
  symbol: string;
  previousClose: number;
  lastClose: number;
  pctChange: number;
  direction: 'up' | 'down' | 'neutral';
  date: string;
  volume?: number;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  addedAt: string;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  lastUpdated: string;
}
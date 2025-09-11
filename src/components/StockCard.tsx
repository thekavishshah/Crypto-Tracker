import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StockMovement } from "@/types/stock";
import { cn } from "@/lib/utils";

interface StockCardProps {
  stock: StockMovement;
}

const StockCard = ({ stock }: StockCardProps) => {
  const isPositive = stock.direction === 'up';
  const isNegative = stock.direction === 'down';
  const isNeutral = stock.direction === 'neutral';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">{stock.symbol}</CardTitle>
          <div className="flex items-center gap-2">
            {isPositive && <TrendingUp className="h-4 w-4 text-gain" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-loss" />}
            {isNeutral && <Minus className="h-4 w-4 text-neutral" />}
            <Badge 
              variant="outline" 
              className={cn(
                "font-semibold",
                isPositive && "border-gain text-gain",
                isNegative && "border-loss text-loss",
                isNeutral && "border-neutral text-neutral"
              )}
            >
              {formatPercent(stock.pctChange)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Previous Close</p>
            <p className="text-lg font-semibold">{formatCurrency(stock.previousClose)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Close</p>
            <p className={cn(
              "text-lg font-semibold",
              isPositive && "text-gain",
              isNegative && "text-loss",
              isNeutral && "text-foreground"
            )}>
              {formatCurrency(stock.lastClose)}
            </p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Change</span>
            <span className={cn(
              "font-medium",
              isPositive && "text-gain",
              isNegative && "text-loss",
              isNeutral && "text-neutral"
            )}>
              {formatCurrency(stock.lastClose - stock.previousClose)}
            </span>
          </div>
        </div>
      </CardContent>
      
      {/* Gradient background accent */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 h-1",
          isPositive && "bg-gradient-to-r from-gain/20 to-gain",
          isNegative && "bg-gradient-to-r from-loss/20 to-loss",
          isNeutral && "bg-gradient-to-r from-neutral/20 to-neutral"
        )}
      />
    </Card>
  );
};

export default StockCard;
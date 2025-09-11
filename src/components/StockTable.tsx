import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { StockMovement } from "@/types/stock";
import { cn } from "@/lib/utils";

interface StockTableProps {
  stocks: StockMovement[];
}

type SortField = 'symbol' | 'pctChange' | 'lastClose';
type SortDirection = 'asc' | 'desc';

const StockTable = ({ stocks }: StockTableProps) => {
  const [sortField, setSortField] = useState<SortField>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    const modifier = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'symbol':
        return a.symbol.localeCompare(b.symbol) * modifier;
      case 'pctChange':
        return (a.pctChange - b.pctChange) * modifier;
      case 'lastClose':
        return (a.lastClose - b.lastClose) * modifier;
      default:
        return 0;
    }
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-semibold hover:bg-transparent"
    >
      <div className="flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </Button>
  );

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="font-semibold">
              <SortButton field="symbol">Symbol</SortButton>
            </TableHead>
            <TableHead className="text-right font-semibold">Previous Close</TableHead>
            <TableHead className="text-right font-semibold">
              <SortButton field="lastClose">Last Close</SortButton>
            </TableHead>
            <TableHead className="text-right font-semibold">Change</TableHead>
            <TableHead className="text-center font-semibold">
              <SortButton field="pctChange">% Change</SortButton>
            </TableHead>
            <TableHead className="text-center font-semibold">Direction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStocks.map((stock) => {
            const isPositive = stock.direction === 'up';
            const isNegative = stock.direction === 'down';
            const isNeutral = stock.direction === 'neutral';
            const change = stock.lastClose - stock.previousClose;

            return (
              <TableRow 
                key={stock.id} 
                className="border-border hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-semibold text-foreground">
                  {stock.symbol}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(stock.previousClose)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  isPositive && "text-gain",
                  isNegative && "text-loss",
                  isNeutral && "text-foreground"
                )}>
                  {formatCurrency(stock.lastClose)}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  isPositive && "text-gain",
                  isNegative && "text-loss",
                  isNeutral && "text-neutral"
                )}>
                  {formatCurrency(change)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-semibold",
                      isPositive && "border-gain text-gain bg-gain/10",
                      isNegative && "border-loss text-loss bg-loss/10",
                      isNeutral && "border-neutral text-neutral bg-neutral/10"
                    )}
                  >
                    {formatPercent(stock.pctChange)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    {isPositive && <TrendingUp className="h-4 w-4 text-gain" />}
                    {isNegative && <TrendingDown className="h-4 w-4 text-loss" />}
                    {isNeutral && <Minus className="h-4 w-4 text-neutral" />}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default StockTable;
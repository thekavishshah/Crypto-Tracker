import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface ChartDataPoint {
  time: string;
  price: number;
}

interface StockChartProps {
  symbol: string;
  data: ChartDataPoint[];
  currentPrice: number;
  change: number;
}

const StockChart = ({ symbol, data, currentPrice, change }: StockChartProps) => {
  const isPositive = change >= 0;

  // Generate sample data if none provided
  const chartData = data.length > 0 ? data : Array.from({ length: 20 }, (_, i) => ({
    time: `${9 + Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}`,
    price: currentPrice + (Math.random() - 0.5) * 20,
  }));

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {symbol} Price Chart
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
            <div className={`text-sm ${isPositive ? 'text-gain' : 'text-loss'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={isPositive ? 'hsl(var(--gain))' : 'hsl(var(--loss))'} 
                strokeWidth={2}
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: isPositive ? 'hsl(var(--gain))' : 'hsl(var(--loss))'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockChart;
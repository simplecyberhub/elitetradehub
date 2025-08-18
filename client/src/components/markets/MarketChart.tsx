import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for demonstration
const generateMockData = () => {
  const data = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const basePrice = 150 + Math.random() * 50;
    data.push({
      id: `price-${i}`,
      date: date.toISOString().split('T')[0],
      price: Math.round(basePrice * 100) / 100,
    });
  }

  return data;
};

interface MarketChartProps {
  assetId?: number;
  symbol?: string;
}

export default function MarketChart({ assetId, symbol = "AAPL" }: MarketChartProps) {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: [`/api/assets/${assetId || 1}/chart`],
    queryFn: () => {
      // For now, return mock data since we don't have real chart data endpoint
      return Promise.resolve(generateMockData());
    },
    enabled: true,
  });

  if (isLoading) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-64 bg-neutral-700" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-neutral-400">
            Failed to load chart data
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-neutral-400">
            No chart data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-800 border-neutral-700">
      <CardHeader>
        <CardTitle>{symbol} Price Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  color: '#F9FAFB'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3B82F6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
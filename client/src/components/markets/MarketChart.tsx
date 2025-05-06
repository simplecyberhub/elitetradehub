import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MarketChartProps {
  asset: any;
  timeframe: string;
}

const MarketChart: React.FC<MarketChartProps> = ({ asset, timeframe }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Generate chart data based on the asset and timeframe
  useEffect(() => {
    if (!asset) {
      setChartData([]);
      return;
    }
    
    // Generate synthetic chart data for visualization
    // In a real application, this would come from an API
    const generateChartData = (basePrice: number, periods: number, isUp: boolean, volatility: number) => {
      const data = [];
      const price = parseFloat(basePrice.toString());
      const trend = isUp ? 1 : -1;
      
      let currentPrice = price;
      
      for (let i = 0; i < periods; i++) {
        const randomChange = (Math.random() - 0.5) * volatility * price;
        const trendChange = trend * (i / periods) * (price * 0.05);
        
        currentPrice = currentPrice + randomChange + trendChange;
        currentPrice = Math.max(currentPrice, price * 0.5); // Ensure price doesn't go too low
        
        // Generate timestamp based on timeframe
        const date = new Date();
        switch (timeframe) {
          case "1D":
            date.setHours(9 + Math.floor(i * 7 / periods));
            date.setMinutes((i * 7 % periods) * 60 / periods);
            break;
          case "1W":
            date.setDate(date.getDate() - (6 - Math.floor(i * 7 / periods)));
            break;
          case "1M":
            date.setDate(date.getDate() - (30 - Math.floor(i * 30 / periods)));
            break;
          case "1Y":
            date.setMonth(date.getMonth() - (12 - Math.floor(i * 12 / periods)));
            break;
          default:
            date.setHours(9 + Math.floor(i * 7 / periods));
            break;
        }
        
        data.push({
          timestamp: date.toISOString(),
          price: currentPrice,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }
      
      return data;
    };
    
    // Determine if chart should show upward or downward trend based on 24h change
    const isUp = parseFloat(asset.change24h) >= 0;
    // Determine volatility based on asset type (crypto is more volatile)
    const volatility = asset.type === 'crypto' ? 0.08 : 0.04;
    
    // Number of data points based on timeframe
    const dataPoints = {
      "1D": 24,
      "1W": 7,
      "1M": 30,
      "1Y": 52
    };
    
    setChartData(generateChartData(
      parseFloat(asset.price),
      dataPoints[timeframe as keyof typeof dataPoints] || 24,
      isUp,
      volatility
    ));
  }, [asset, timeframe]);
  
  // Format x-axis labels based on timeframe
  const formatXAxis = (timestamp: string) => {
    const date = new Date(timestamp);
    
    switch (timeframe) {
      case "1D":
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case "1W":
        return date.toLocaleDateString([], { weekday: 'short' });
      case "1M":
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
      case "1Y":
        return date.toLocaleDateString([], { month: 'short' });
      default:
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  // Format tooltip labels
  const formatTooltipValue = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: asset?.type === 'crypto' ? 6 : 2
    });
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-800 border border-neutral-700 p-2 rounded shadow-md">
          <p className="text-sm text-white">{formatXAxis(label)}</p>
          <p className="text-sm text-primary">{`Price: ${formatTooltipValue(payload[0].value)}`}</p>
        </div>
      );
    }
    
    return null;
  };
  
  // Determine if chart should show green (up) or red (down) based on 24h change
  const chartColor = asset && parseFloat(asset.change24h) >= 0 ? "hsl(var(--chart-1))" : "hsl(var(--destructive))";
  const gradientColor = asset && parseFloat(asset.change24h) >= 0 ? "hsl(var(--chart-1))" : "hsl(var(--destructive))";
  
  if (!asset || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neutral-400">Loading chart data...</div>
      </div>
    );
  }
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={formatXAxis} 
          minTickGap={30}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis 
          hide={true}
          domain={['auto', 'auto']}
        />
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--muted))" 
          vertical={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="price" 
          stroke={chartColor} 
          fillOpacity={0.2}
          fill="url(#colorPrice)" 
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MarketChart;

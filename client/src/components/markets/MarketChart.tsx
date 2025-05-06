import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface MarketChartProps {
  asset: any;
  timeframe: string;
}

const MarketChart: React.FC<MarketChartProps> = ({ asset, timeframe }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Helper to generate realistic price data based on current price and timeframe
  const generateChartData = () => {
    const data: any[] = [];
    const currentPrice = parseFloat(asset.price);
    const volatility = asset.type === "crypto" ? 0.03 : asset.type === "forex" ? 0.005 : 0.015;
    let points: number;
    let interval: string;
    
    // Set points and interval based on timeframe
    switch (timeframe) {
      case "1D":
        points = 24;
        interval = "h";
        break;
      case "1W":
        points = 7;
        interval = "d";
        break;
      case "1M":
        points = 30;
        interval = "d";
        break;
      case "1Y":
        points = 12;
        interval = "m";
        break;
      default:
        points = 24;
        interval = "h";
    }
    
    // Generate random walk price data
    let price = currentPrice * (1 - Math.random() * volatility * points / 2);
    
    // Determine trend direction (slightly biased towards matching 24h change)
    const trend = parseFloat(asset.change24h) >= 0 ? 0.55 : 0.45;
    
    for (let i = 0; i < points; i++) {
      // Random price movement with trend bias
      const movement = Math.random() < trend ? 1 : -1;
      const change = price * volatility * movement * Math.random();
      price = price + change;
      
      // Ensure price doesn't go negative
      if (price <= 0) price = currentPrice * 0.001;
      
      // Format time label based on interval
      let timeLabel;
      const now = new Date();
      
      if (interval === "h") {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - (points - i));
        timeLabel = hour.toLocaleTimeString([], { hour: '2-digit' });
      } else if (interval === "d") {
        const day = new Date(now);
        day.setDate(day.getDate() - (points - i));
        timeLabel = day.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else if (interval === "m") {
        const month = new Date(now);
        month.setMonth(month.getMonth() - (points - i));
        timeLabel = month.toLocaleDateString([], { month: 'short' });
      }
      
      data.push({
        time: timeLabel,
        price: price.toFixed(2),
      });
    }
    
    return data;
  };
  
  // Update chart data when asset or timeframe changes
  useEffect(() => {
    setChartData(generateChartData());
  }, [asset.id, asset.price, timeframe]);
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 p-2 border border-neutral-700 rounded text-xs">
          <p className="text-white">{`${label}: $${parseFloat(payload[0].value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: asset.type === 'crypto' ? 6 : 2 })}`}</p>
        </div>
      );
    }
    return null;
  };
  
  // Get color based on price trend
  const getChartColor = () => {
    if (chartData.length < 2) return "#10b981"; // Default to green
    
    const firstPrice = parseFloat(chartData[0].price);
    const lastPrice = parseFloat(chartData[chartData.length - 1].price);
    
    return lastPrice >= firstPrice ? "#10b981" : "#ef4444";
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
        <XAxis 
          dataKey="time" 
          tick={{ fontSize: 10, fill: "#999" }}
          axisLine={{ stroke: "#444" }}
          tickLine={{ stroke: "#444" }}
        />
        <YAxis 
          domain={['auto', 'auto']}
          tick={{ fontSize: 10, fill: "#999" }}
          axisLine={{ stroke: "#444" }}
          tickLine={{ stroke: "#444" }}
          tickFormatter={(value) => `$${value}`}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={parseFloat(asset.price)}
          stroke="#666"
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke={getChartColor()}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: getChartColor(), strokeWidth: 1, fill: "#111" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MarketChart;
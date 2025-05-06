import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets } from "@/lib/api";
import MarketChart from "@/components/markets/MarketChart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MarketOverview = () => {
  const [timeframe, setTimeframe] = useState("1D");
  const [selectedAsset, setSelectedAsset] = useState("S&P 500");
  
  const { data: assets, isLoading } = useQuery({
    queryKey: ["/api/assets"],
  });

  // Find the selected asset from the assets list
  const asset = !isLoading && assets 
    ? assets.find((a: any) => a.name === selectedAsset) || assets[0] 
    : null;

  const timeframes = ["1D", "1W", "1M", "1Y"];

  // Format number with commas
  const formatNumber = (num: number | string) => {
    return parseFloat(num.toString()).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Market Overview</h2>
        <div className="flex items-center gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf}
              className={`${
                timeframe === tf
                  ? "bg-neutral-700 text-white"
                  : "text-neutral-400 hover:bg-neutral-700"
              } px-3 py-1 rounded text-sm`}
              onClick={() => setTimeframe(tf)}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="px-2">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-medium">{asset?.name || "Loading..."}</h3>
            <div className="flex items-center">
              <span className="mono text-lg font-semibold">
                {asset ? formatNumber(asset.price) : "..."}
              </span>
              <span className={`${parseFloat(asset?.change24h) >= 0 ? "text-success" : "text-destructive"} text-sm ml-2 flex items-center`}>
                {parseFloat(asset?.change24h) >= 0 ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                {" "}
                {asset ? Math.abs(parseFloat(asset.change24h)) : "0"}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-[180px] bg-neutral-700 border-none h-8">
                <SelectValue placeholder="Select asset" />
              </SelectTrigger>
              <SelectContent>
                {!isLoading && assets
                  ? assets.map((asset: any) => (
                      <SelectItem key={asset.id} value={asset.name}>
                        {asset.name}
                      </SelectItem>
                    ))
                  : <SelectItem value="loading">Loading...</SelectItem>
                }
              </SelectContent>
            </Select>
            <button className="text-neutral-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Chart Component */}
        <div className="h-64 relative">
          <MarketChart asset={asset} timeframe={timeframe} />
          
          {/* Time indicators */}
          <div className="flex justify-between text-xs text-neutral-400 mt-2">
            <span>09:30</span>
            <span>11:30</span>
            <span>13:30</span>
            <span>15:30</span>
            <span>16:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;

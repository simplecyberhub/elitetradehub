import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchUserTrades } from "@/lib/api";
import { Link } from "wouter";
import { AppleIcon, AmazonIcon, NetflixIcon, TeslaIcon, BitcoinIcon, CurrencyIcon } from "@/components/ui/icons";

const RecentTrades = () => {
  const { user } = useAuth();
  
  const { data: trades, isLoading } = useQuery({
    queryKey: [`/api/user/${user?.id}/trades`],
    enabled: !!user?.id
  });

  // Helper function to get icon based on symbol
  const getAssetIcon = (symbol: string) => {
    const iconSize = "w-5 h-5";
    
    if (symbol.includes("AAPL")) return <AppleIcon className={iconSize} />;
    if (symbol.includes("AMZN")) return <AmazonIcon className={iconSize} />;
    if (symbol.includes("NFLX")) return <NetflixIcon className={iconSize} />;
    if (symbol.includes("TSLA")) return <TeslaIcon className={iconSize} />;
    if (symbol.includes("BTC")) return <BitcoinIcon className={iconSize} />;
    if (symbol.includes("ETH")) return <BitcoinIcon className={iconSize} />;
    if (symbol.includes("EUR") || symbol.includes("USD") || symbol.includes("GBP") || symbol.includes("JPY")) {
      return <CurrencyIcon className={iconSize} />;
    }
    
    return <svg xmlns="http://www.w3.org/2000/svg" className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10H3M16 2v8M8 2v8M12 14v4M12 22v-4M7 14h10v4a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4v-4Z" />
    </svg>;
  };

  // Calculate profit/loss
  const calculatePL = (trade: any) => {
    if (!trade || !trade.asset) return 0;
    
    const amount = parseFloat(trade.amount);
    const entryPrice = parseFloat(trade.price);
    const currentPrice = parseFloat(trade.asset.price);
    
    if (trade.type === "buy") {
      return amount * (currentPrice - entryPrice);
    } else {
      return amount * (entryPrice - currentPrice);
    }
  };

  // Format number with commas
  const formatNumber = (num: number | string) => {
    return parseFloat(num.toString()).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get the most recent trades (max 4)
  const recentTrades = trades?.slice(0, 4) || [];

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Trades</h2>
        <Link href="/transactions">
          <a className="text-primary text-sm hover:underline">View All</a>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : recentTrades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-neutral-400 border-b border-neutral-700">
                <th className="text-left pb-2 font-medium">Asset</th>
                <th className="text-left pb-2 font-medium">Type</th>
                <th className="text-right pb-2 font-medium">Amount</th>
                <th className="text-right pb-2 font-medium">Entry Price</th>
                <th className="text-right pb-2 font-medium">Current Price</th>
                <th className="text-right pb-2 font-medium">P/L</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade: any) => {
                const pl = calculatePL(trade);
                
                return (
                  <tr key={trade.id} className="border-b border-neutral-700 hover:bg-neutral-700">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white">
                          {getAssetIcon(trade.asset.symbol)}
                        </span>
                        <span>{trade.asset.symbol}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`${trade.type === "buy" ? "text-success bg-success" : "text-destructive bg-destructive"} bg-opacity-10 px-2 py-0.5 rounded text-xs`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 text-right mono">
                      {trade.asset.type === "crypto" 
                        ? `${formatNumber(trade.amount)} ${trade.asset.symbol.split('/')[0]}` 
                        : `${formatNumber(trade.amount)} ${trade.asset.type === "stock" ? "Shares" : "Lots"}`}
                    </td>
                    <td className="py-3 text-right mono">${formatNumber(trade.price)}</td>
                    <td className="py-3 text-right mono">${formatNumber(trade.asset.price)}</td>
                    <td className={`py-3 text-right mono ${pl >= 0 ? "text-success" : "text-destructive"}`}>
                      {pl >= 0 ? "+" : ""}{formatNumber(pl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-400">
          <p>No trades yet</p>
          <p className="text-sm mt-2">Start trading to see your transactions here</p>
        </div>
      )}
    </div>
  );
};

export default RecentTrades;

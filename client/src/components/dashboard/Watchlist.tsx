import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchWatchlist, addToWatchlist, removeFromWatchlist } from "@/lib/api";
import { AppleIcon, AmazonIcon, NetflixIcon, TeslaIcon, BitcoinIcon, CurrencyIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const Watchlist = () => {
  const { user } = useAuth();
  
  const { data: watchlistItems, isLoading } = useQuery({
    queryKey: [`/api/user/${user?.id}/watchlist`],
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
        <h2 className="text-lg font-semibold">Watchlist</h2>
        <Link href="/markets">
          <Button variant="link" className="h-8 p-0 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : watchlistItems && watchlistItems.length > 0 ? (
          watchlistItems.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-2 hover:bg-neutral-700 rounded-md transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-white text-xl">
                  {getAssetIcon(item.asset.symbol)}
                </span>
                <div>
                  <h4 className="font-medium">{item.asset.symbol}</h4>
                  <p className="text-xs text-neutral-400">{item.asset.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="mono font-semibold">${formatNumber(item.asset.price)}</p>
                <p className={`text-xs ${parseFloat(item.asset.change24h) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {parseFloat(item.asset.change24h) >= 0 ? '+' : ''}{item.asset.change24h}%
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-neutral-400">
            <p>Your watchlist is empty</p>
            <p className="text-sm mt-2">Add assets from the markets page</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;

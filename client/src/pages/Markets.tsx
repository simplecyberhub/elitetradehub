import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { fetchAssets, addToWatchlist } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import MarketTable from "@/components/markets/MarketTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketChart from "@/components/markets/MarketChart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Markets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [timeframe, setTimeframe] = useState("1D");
  
  const { data: assets, isLoading } = useQuery({
    queryKey: ["/api/assets"],
  });
  
  const handleAddToWatchlist = async (assetId: number) => {
    if (!user) return;
    
    try {
      await addToWatchlist(user.id, assetId);
      toast({
        title: "Added to watchlist",
        description: "Asset has been added to your watchlist",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add asset to watchlist",
      });
    }
  };
  
  // Filter assets by type
  const stockAssets = assets?.filter((asset: any) => asset.type === "stock") || [];
  const cryptoAssets = assets?.filter((asset: any) => asset.type === "crypto") || [];
  const forexAssets = assets?.filter((asset: any) => asset.type === "forex") || [];
  
  return (
    <>
      <Helmet>
        <title>Markets | EliteStock Trading Platform</title>
        <meta name="description" content="Explore stock, cryptocurrency, and forex markets. View real-time prices, trends, and charts on EliteStock Trading Platform." />
      </Helmet>
      
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Markets</h1>
          <p className="text-neutral-400">Explore stocks, cryptocurrencies, and forex markets</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-neutral-800 rounded-lg p-4 mb-6">
              {selectedAsset ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedAsset.name} ({selectedAsset.symbol})</h2>
                      <div className="flex items-center mt-1">
                        <span className="mono text-lg font-semibold mr-2">${parseFloat(selectedAsset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: selectedAsset.type === 'crypto' ? 6 : 2 })}</span>
                        <span className={`${parseFloat(selectedAsset.change24h) >= 0 ? "text-success" : "text-destructive"} text-sm flex items-center`}>
                          {parseFloat(selectedAsset.change24h) >= 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                          )}
                          {Math.abs(parseFloat(selectedAsset.change24h))}%
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleAddToWatchlist(selectedAsset.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Add to Watchlist
                      </Button>
                      <Button size="sm" asChild>
                        <a href={`/order/${selectedAsset.id}`}>Trade Now</a>
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-3 flex gap-2">
                      {["1D", "1W", "1M", "1Y"].map((tf) => (
                        <Button 
                          key={tf}
                          variant={timeframe === tf ? "default" : "outline"} 
                          size="sm"
                          onClick={() => setTimeframe(tf)}
                        >
                          {tf}
                        </Button>
                      ))}
                    </div>
                    <div className="h-64">
                      <MarketChart asset={selectedAsset} timeframe={timeframe} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-neutral-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p>Select an asset to view its chart</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-neutral-800 rounded-lg p-4 h-fit">
            <h2 className="text-lg font-semibold mb-4">Market Information</h2>
            
            {selectedAsset ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-neutral-400 mb-1">Asset Information</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-neutral-400">Symbol</p>
                      <p className="font-medium">{selectedAsset.symbol}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Type</p>
                      <p className="font-medium capitalize">{selectedAsset.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Price</p>
                      <p className="font-medium mono">${parseFloat(selectedAsset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: selectedAsset.type === 'crypto' ? 6 : 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">24h Change</p>
                      <p className={`font-medium ${parseFloat(selectedAsset.change24h) >= 0 ? "text-success" : "text-destructive"}`}>
                        {parseFloat(selectedAsset.change24h) >= 0 ? "+" : ""}{selectedAsset.change24h}%
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm text-neutral-400 mb-1">Market Data</h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-xs text-neutral-400">24h Volume</p>
                      <p className="font-medium">${parseFloat(selectedAsset.volume24h || "0").toLocaleString('en-US')}</p>
                    </div>
                    {selectedAsset.type !== 'forex' && (
                      <div>
                        <p className="text-xs text-neutral-400">Market Cap</p>
                        <p className="font-medium">${parseFloat(selectedAsset.marketCap || "0").toLocaleString('en-US')}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button asChild className="w-full">
                    <a href={`/order/${selectedAsset.id}`}>Trade Now</a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-400">
                <p>Select an asset to view details</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-neutral-800 rounded-lg p-4">
          <Tabs defaultValue="stocks">
            <TabsList className="w-full border-b border-neutral-700 mb-4 pb-0 bg-transparent">
              <TabsTrigger value="stocks" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Stocks
              </TabsTrigger>
              <TabsTrigger value="crypto" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Cryptocurrencies
              </TabsTrigger>
              <TabsTrigger value="forex" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                Forex
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="stocks">
              <MarketTable 
                assets={stockAssets} 
                isLoading={isLoading} 
                onSelect={setSelectedAsset}
                selectedAsset={selectedAsset}
              />
            </TabsContent>
            
            <TabsContent value="crypto">
              <MarketTable 
                assets={cryptoAssets} 
                isLoading={isLoading} 
                onSelect={setSelectedAsset}
                selectedAsset={selectedAsset}
              />
            </TabsContent>
            
            <TabsContent value="forex">
              <MarketTable 
                assets={forexAssets} 
                isLoading={isLoading} 
                onSelect={setSelectedAsset}
                selectedAsset={selectedAsset}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Markets;

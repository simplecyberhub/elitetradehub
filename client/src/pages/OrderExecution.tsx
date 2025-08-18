import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useRoute } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useAsset } from "@/hooks/use-markets";
import OrderForm from "@/components/order/OrderForm";
import MarketChart from "@/components/markets/MarketChart";
import { AppleIcon, AmazonIcon, NetflixIcon, TeslaIcon, BitcoinIcon, CurrencyIcon } from "@/components/ui/icons";

const OrderExecution = () => {
  const { user } = useAuth();
  const [, params] = useRoute("/order/:id");
  const assetId = params?.id ? parseInt(params.id) : null;
  const [timeframe, setTimeframe] = useState("1D");

  const { 
    data: asset,
    isLoading,
    error
  } = useAsset(assetId);

  // Helper function to get icon based on symbol
  const getAssetIcon = (symbol: string) => {
    const iconSize = "w-8 h-8";

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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">Error</h2>
        <p className="text-neutral-400">Unable to load asset information. Please try again later.</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Trade {asset.name} | EliteStock Trading Platform</title>
        <meta name="description" content={`Execute trades for ${asset.name} (${asset.symbol}) on EliteStock Trading Platform. View real-time price and place orders.`} />
      </Helmet>

      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-neutral-700 flex items-center justify-center">
              {getAssetIcon(asset.symbol)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{asset.name}</h1>
              <div className="flex items-center">
                <span className="text-neutral-400 mr-2">{asset.symbol}</span>
                <span className={`${parseFloat(asset.change24h) >= 0 ? "text-success" : "text-destructive"} text-sm flex items-center`}>
                  {parseFloat(asset.change24h) >= 0 ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  )}
                  {Math.abs(parseFloat(asset.change24h))}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold mono">${parseFloat(asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: asset.type === 'crypto' ? 6 : 2 })}</div>
            <div className="text-sm text-neutral-400">Current Price</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-neutral-800 rounded-lg p-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {["1D", "1W", "1M", "1Y"].map((tf) => (
                <button 
                  key={tf}
                  className={`px-3 py-1 rounded-md text-sm ${
                    timeframe === tf 
                      ? "bg-primary text-white" 
                      : "bg-neutral-700 text-neutral-300 hover:bg-primary/20"
                  }`}
                  onClick={() => setTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="h-80">
              <MarketChart assetId={asset?.id} symbol={asset?.symbol} />
            </div>
          </div>

          <div className="bg-neutral-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Place Order</h2>
            <OrderForm asset={asset} />
          </div>
        </div>

        <div className="bg-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Asset Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Symbol</span>
                  <span>{asset.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Type</span>
                  <span className="capitalize">{asset.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Price</span>
                  <span>${parseFloat(asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: asset.type === 'crypto' ? 6 : 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">24h Change</span>
                  <span className={parseFloat(asset.change24h) >= 0 ? "text-success" : "text-destructive"}>
                    {parseFloat(asset.change24h) >= 0 ? "+" : ""}{asset.change24h}%
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Market Data</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">24h Volume</span>
                  <span>${parseFloat(asset.volume24h || "0").toLocaleString('en-US')}</span>
                </div>
                {asset.type !== 'forex' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Market Cap</span>
                      <span>${parseFloat(asset.marketCap || "0").toLocaleString('en-US')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Circulating Supply</span>
                      <span>{parseFloat(asset.circulatingSupply || "0").toLocaleString('en-US')} {asset.type === 'crypto' ? asset.symbol.split('/')[0] : ""}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Trading Info</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Spread</span>
                  <span>{(parseFloat(asset.price) * 0.001).toFixed(asset.type === 'crypto' ? 6 : 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Leverage</span>
                  <span>Up to {asset.type === 'crypto' ? '10x' : asset.type === 'forex' ? '500x' : '100x'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Trading Hours</span>
                  <span>{asset.type === 'crypto' ? '24/7' : asset.type === 'forex' ? 'Mon-Fri 24h' : 'Mon-Fri 9:30-16:00'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderExecution;
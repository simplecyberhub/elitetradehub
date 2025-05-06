import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AppleIcon, AmazonIcon, NetflixIcon, TeslaIcon, BitcoinIcon, CurrencyIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketTableProps {
  assets: any[];
  isLoading: boolean;
  onSelect: (asset: any) => void;
  selectedAsset: any | null;
}

const MarketTable: React.FC<MarketTableProps> = ({ 
  assets, 
  isLoading, 
  onSelect,
  selectedAsset
}) => {
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
  const formatNumber = (num: number | string, decimals = 2) => {
    return parseFloat(num.toString()).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5).fill(0).map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-16" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-9 w-full" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">24h Change</TableHead>
            <TableHead className="text-right">24h Volume</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.length > 0 ? (
            assets.map((asset) => (
              <TableRow 
                key={asset.id} 
                className={`cursor-pointer ${selectedAsset?.id === asset.id ? 'bg-neutral-700' : ''}`}
                onClick={() => onSelect(asset)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-neutral-700 flex items-center justify-center">
                      {getAssetIcon(asset.symbol)}
                    </div>
                    <span className="font-medium">{asset.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-neutral-400">{asset.symbol}</span>
                </TableCell>
                <TableCell className="text-right mono">
                  ${formatNumber(asset.price, asset.type === 'crypto' ? 6 : 2)}
                </TableCell>
                <TableCell className={`text-right ${parseFloat(asset.change24h) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  <div className="flex items-center justify-end">
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
                  </div>
                </TableCell>
                <TableCell className="text-right text-neutral-400">
                  {asset.volume24h ? `$${formatNumber(asset.volume24h, 0)}` : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" onClick={(e) => {
                    e.stopPropagation();
                  }}>
                    <a href={`/order/${asset.id}`}>Trade</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6 text-neutral-400">
                No assets found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MarketTable;

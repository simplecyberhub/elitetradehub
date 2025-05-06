import { useQuery } from "@tanstack/react-query";
import { fetchAssets, fetchAssetById } from "@/lib/api";

/**
 * Hook to fetch all market assets or assets of a specific type
 */
export function useMarkets(type?: string) {
  return useQuery({
    queryKey: type ? [`/api/assets?type=${type}`] : ["/api/assets"],
    queryFn: () => fetchAssets(type),
  });
}

/**
 * Hook to fetch a specific asset by ID
 */
export function useAsset(id: number | string | null) {
  return useQuery({
    queryKey: [`/api/assets/${id}`],
    queryFn: () => fetchAssetById(Number(id)),
    enabled: !!id, // Only run the query if an ID is provided
  });
}

/**
 * Hook to get assets grouped by type
 */
export function useMarketsGrouped() {
  const { data: allAssets, isLoading, error } = useMarkets();
  
  // Group assets by type
  const groupedAssets = {
    stocks: allAssets?.filter((asset: any) => asset.type === "stock") || [],
    crypto: allAssets?.filter((asset: any) => asset.type === "crypto") || [],
    forex: allAssets?.filter((asset: any) => asset.type === "forex") || [],
  };
  
  return {
    groupedAssets,
    isLoading,
    error
  };
}

/**
 * Hook to get top performing assets (highest 24h change)
 */
export function useTopPerformers(limit = 5) {
  const { data: allAssets, isLoading, error } = useMarkets();
  
  const topPerformers = allAssets
    ? [...allAssets]
        .sort((a, b) => parseFloat(b.change24h) - parseFloat(a.change24h))
        .slice(0, limit)
    : [];
  
  return {
    topPerformers,
    isLoading,
    error
  };
}

/**
 * Hook to get worst performing assets (lowest 24h change)
 */
export function useWorstPerformers(limit = 5) {
  const { data: allAssets, isLoading, error } = useMarkets();
  
  const worstPerformers = allAssets
    ? [...allAssets]
        .sort((a, b) => parseFloat(a.change24h) - parseFloat(b.change24h))
        .slice(0, limit)
    : [];
  
  return {
    worstPerformers,
    isLoading,
    error
  };
}

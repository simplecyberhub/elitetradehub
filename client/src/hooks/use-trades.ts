import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchUserTrades, createTrade } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to fetch a user's trades
 */
export function useUserTrades() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [`/api/user/${user?.id}/trades`],
    queryFn: () => fetchUserTrades(Number(user?.id)),
    enabled: !!user?.id,
  });
}

/**
 * Hook for active trades - trades with status "executed"
 */
export function useActiveTrades() {
  const { data: trades, isLoading, error } = useUserTrades();
  
  const activeTrades = trades
    ? trades.filter((trade: any) => trade.status === "executed")
    : [];
  
  return {
    activeTrades,
    isLoading,
    error,
  };
}

/**
 * Hook for executed trades summary - profit/loss calculation
 */
export function useTradesSummary() {
  const { activeTrades, isLoading, error } = useActiveTrades();
  
  // Calculate total profit/loss
  let totalProfit = 0;
  let totalInvested = 0;
  
  if (activeTrades && activeTrades.length > 0) {
    activeTrades.forEach((trade: any) => {
      const amount = parseFloat(trade.amount);
      const entryPrice = parseFloat(trade.price);
      const currentPrice = parseFloat(trade.asset.price);
      
      // For buy orders, profit = (current price - entry price) * amount
      // For sell orders, profit = (entry price - current price) * amount
      const profit = trade.type === "buy"
        ? (currentPrice - entryPrice) * amount
        : (entryPrice - currentPrice) * amount;
      
      totalProfit += profit;
      totalInvested += entryPrice * amount;
    });
  }
  
  // Calculate total trades
  const totalTrades = activeTrades?.length || 0;
  
  // Calculate profitable vs. unprofitable trades
  const profitableTrades = activeTrades?.filter((trade: any) => {
    const amount = parseFloat(trade.amount);
    const entryPrice = parseFloat(trade.price);
    const currentPrice = parseFloat(trade.asset.price);
    
    return trade.type === "buy"
      ? currentPrice > entryPrice
      : entryPrice > currentPrice;
  }).length || 0;
  
  const unprofitableTrades = totalTrades - profitableTrades;
  
  // Calculate win rate
  const winRate = totalTrades > 0
    ? (profitableTrades / totalTrades) * 100
    : 0;
  
  return {
    totalProfit,
    totalInvested,
    totalTrades,
    profitableTrades,
    unprofitableTrades,
    winRate,
    isLoading,
    error,
  };
}

/**
 * Hook for creating a new trade with toast notifications
 */
export function useCreateTrade() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: (data: any) => createTrade({
      ...data,
      userId: user?.id,
    }),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/trades`] });
      // Invalidate user to update balance
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      
      toast({
        title: "Trade executed successfully",
        description: "Your trade has been executed successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Trade execution failed",
        description: error instanceof Error ? error.message : "Failed to execute trade",
      });
    },
  });
  
  return mutation;
}

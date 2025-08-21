import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchTraders, fetchUserCopyTrading, startCopyTrading, stopCopyTrading } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const CopyTrading = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: traders, isLoading: isLoadingTraders } = useQuery({
    queryKey: ["/api/traders"],
    enabled: !!user?.id
  });
  
  const { data: copyRelationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: [`/api/user/${user?.id}/copy-trading`],
    enabled: !!user?.id
  });
  
  const startCopyMutation = useMutation({
    mutationFn: ({ followerId, traderId }: { followerId: number, traderId: number }) => 
      startCopyTrading(followerId, traderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/copy-trading`] });
      toast({
        title: "Started copying trader",
        description: "You will now copy this trader's future trades",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start copy trading",
      });
    }
  });
  
  const stopCopyMutation = useMutation({
    mutationFn: ({ id, followerId }: { id: number, followerId: number }) => 
      stopCopyTrading(id, followerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/copy-trading`] });
      toast({
        title: "Stopped copying trader",
        description: "You will no longer copy this trader's trades",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to stop copy trading",
      });
    }
  });
  
  // Helper function to check if user is following a trader
  const isFollowing = (traderId: number) => {
    if (!copyRelationships) return false;
    return copyRelationships.some((relationship: any) => 
      relationship.trader.id === traderId && relationship.status === "active"
    );
  };
  
  // Helper function to get relationship ID
  const getRelationshipId = (traderId: number) => {
    if (!copyRelationships) return null;
    const relationship = copyRelationships.find((r: any) => r.trader.id === traderId);
    return relationship ? relationship.id : null;
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };
  
  // Handle copy button click
  const handleCopyClick = (traderId: number) => {
    if (!user) return;
    
    if (isFollowing(traderId)) {
      const relationshipId = getRelationshipId(traderId);
      if (relationshipId) {
        stopCopyMutation.mutate({ id: relationshipId, followerId: user.id });
      }
    } else {
      startCopyMutation.mutate({ followerId: user.id, traderId });
    }
  };

  // Show top 3 traders
  const topTraders = (traders || []).slice(0, 3);
  
  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Copy Trading</h2>
        <Link href="/copy-trading" className="text-primary text-sm hover:underline">
          Find Traders
        </Link>
      </div>

      {isLoadingTraders || isLoadingRelationships ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="space-y-4">
          {topTraders.map((trader: any) => (
            <div key={trader.id} className="border border-neutral-700 rounded-lg p-3 hover:border-primary transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Avatar className="h-10 w-10 bg-primary">
                  <AvatarFallback>{getInitials(trader.user.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">{trader.user.fullName}</h4>
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star}
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-3 w-3 ${parseFloat(trader.rating) >= star ? "text-yellow-400 fill-current" : parseFloat(trader.rating) >= star - 0.5 ? "text-yellow-400" : "text-yellow-400 opacity-30"}`}
                          viewBox="0 0 20 20"
                          fill={parseFloat(trader.rating) >= star ? "currentColor" : "none"}
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-neutral-400 ml-1">{trader.rating}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div>
                  <p className="text-xs text-neutral-400">Win Rate</p>
                  <p className="text-sm font-medium">{trader.winRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">30d Profit</p>
                  <p className={`text-sm font-medium ${parseFloat(trader.profit30d) >= 0 ? "text-success" : "text-destructive"}`}>
                    {parseFloat(trader.profit30d) >= 0 ? "+" : ""}{trader.profit30d}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">Followers</p>
                  <p className="text-sm font-medium">{trader.followers >= 1000 ? `${(trader.followers / 1000).toFixed(1)}k` : trader.followers}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <button
                  className="text-xs text-neutral-400 hover:text-white cursor-pointer bg-transparent border-none p-0"
                  onClick={() => window.location.href = `/copy-trading?trader=${trader.id}`}
                >
                  View Profile
                </button>
                <Button
                  size="sm"
                  variant={isFollowing(trader.id) ? "default" : "outline"}
                  className={`text-xs h-6 px-3 py-0 ${isFollowing(trader.id) ? "bg-primary hover:bg-primary/90" : "text-primary border-primary hover:bg-primary/10"}`}
                  onClick={() => handleCopyClick(trader.id)}
                  disabled={startCopyMutation.isPending || stopCopyMutation.isPending}
                >
                  {isFollowing(trader.id) ? "Copying" : "Copy"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CopyTrading;

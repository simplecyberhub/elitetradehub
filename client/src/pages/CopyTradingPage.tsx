import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchTraders, fetchUserCopyTrading, startCopyTrading, stopCopyTrading, updateCopyTrading } from "@/lib/api";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const CopyTradingPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [selectedTrader, setSelectedTrader] = useState<any>(null);
  const [allocationPercentage, setAllocationPercentage] = useState(100);

  // Parse trader ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const traderId = params.get('trader');
    if (traderId) {
      // Set selected trader when data is loaded
      if (traders) {
        const trader = traders.find((t: any) => t.id === parseInt(traderId));
        if (trader) {
          setSelectedTrader(trader);
        }
      }
    }
  }, [location]);

  const { data: traders, isLoading: isLoadingTraders } = useQuery({
    queryKey: ["/api/traders"],
    enabled: !!user?.id
  });

  const { data: copyRelationships, isLoading: isLoadingRelationships } = useQuery({
    queryKey: [`/api/user/${user?.id}/copy-trading`],
    enabled: !!user?.id
  });

  const startCopyMutation = useMutation({
    mutationFn: ({ followerId, traderId, allocation }: { followerId: number, traderId: number, allocation: number }) => 
      startCopyTrading(followerId, traderId, allocation),
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

  const updateCopyMutation = useMutation({
    mutationFn: ({ id, followerId, data }: { id: number, followerId: number, data: any }) => 
      updateCopyTrading(id, followerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/copy-trading`] });
      toast({
        title: "Updated copy settings",
        description: "Your copy trading settings have been updated",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update copy trading settings",
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

  // Get relationship for a trader
  const getRelationship = (traderId: number) => {
    if (!copyRelationships) return null;
    return copyRelationships.find((r: any) => r.trader.id === traderId);
  };

  // Handle copy button click
  const handleCopyClick = (trader: any) => {
    if (!user) return;

    if (isFollowing(trader.id)) {
      const relationship = getRelationship(trader.id);
      if (relationship) {
        stopCopyMutation.mutate({ id: relationship.id, followerId: user.id });
      }
    } else {
      startCopyMutation.mutate({ 
        followerId: user.id, 
        traderId: trader.id,
        allocation: allocationPercentage
      });
    }
  };

  // Handle allocation change
  const handleAllocationChange = (trader: any) => {
    if (!user) return;

    const relationship = getRelationship(trader.id);
    if (relationship) {
      updateCopyMutation.mutate({ 
        id: relationship.id, 
        followerId: user.id,
        data: { allocationPercentage: allocationPercentage }
      });
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  // Generate sample performance data
  const generatePerformanceData = () => {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        profit: Math.random() * 1000 + 500
      });
    }
    return data;
  };

  // When a trader is selected, set allocation to current value
  useEffect(() => {
    if (selectedTrader) {
      const relationship = getRelationship(selectedTrader.id);
      if (relationship) {
        setAllocationPercentage(parseInt(relationship.allocationPercentage));
      } else {
        setAllocationPercentage(100);
      }
    }
  }, [selectedTrader, copyRelationships]);

  return (
    <>
      <Helmet>
        <title>Copy Trading | TFXC Trading Platform</title>
        <meta name="description" content="Copy successful traders and automatically replicate their trading strategies on TFXC Trading Platform." />
      </Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Copy Trading</h1>
          <p className="text-neutral-400">Copy successful traders and automatically replicate their trading strategies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trader List */}
          <div className="bg-neutral-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Top Traders</h2>

            {isLoadingTraders ? (
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="space-y-3">
                {traders?.map((trader: any) => (
                  <div 
                    key={trader.id} 
                    className={`border ${
                      selectedTrader?.id === trader.id 
                        ? "border-primary" 
                        : "border-neutral-700"
                    } rounded-lg p-3 hover:border-primary transition-colors cursor-pointer`}
                    onClick={() => setSelectedTrader(trader)}
                  >
                    <div className="flex items-center gap-3">
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
                    <div className="grid grid-cols-3 gap-2 text-center mt-2">
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
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant={isFollowing(trader.id) ? "default" : "outline"}
                        className={`text-xs w-full ${isFollowing(trader.id) ? "bg-primary hover:bg-primary/90" : "text-primary border-primary hover:bg-primary/10"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyClick(trader);
                        }}
                        disabled={startCopyMutation.isPending || stopCopyMutation.isPending}
                      >
                        {isFollowing(trader.id) ? "Following" : "Copy Trader"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trader Details */}
          <div className="lg:col-span-2">
            {selectedTrader ? (
              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 bg-primary">
                      <AvatarFallback className="text-lg">{getInitials(selectedTrader.user.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedTrader.user.fullName}</h2>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg 
                              key={star}
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`h-4 w-4 ${parseFloat(selectedTrader.rating) >= star ? "text-yellow-400 fill-current" : parseFloat(selectedTrader.rating) >= star - 0.5 ? "text-yellow-400" : "text-yellow-400 opacity-30"}`}
                              viewBox="0 0 20 20"
                              fill={parseFloat(selectedTrader.rating) >= star ? "currentColor" : "none"}
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-neutral-400 ml-1">{selectedTrader.rating} ({selectedTrader.followers} followers)</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant={isFollowing(selectedTrader.id) ? "default" : "outline"}
                    className={`${isFollowing(selectedTrader.id) ? "bg-primary hover:bg-primary/90" : "text-primary border-primary hover:bg-primary/10"}`}
                    onClick={() => handleCopyClick(selectedTrader)}
                    disabled={startCopyMutation.isPending || stopCopyMutation.isPending}
                  >
                    {isFollowing(selectedTrader.id) ? "Stop Copying" : "Start Copying"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Win Rate</h3>
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-success flex items-center justify-center text-xl font-bold">
                        {selectedTrader.winRate}%
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-neutral-400">Successful trades compared to total trades</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">30-Day Profit</h3>
                    <div className="flex items-center">
                      <div className={`w-16 h-16 rounded-full border-4 ${parseFloat(selectedTrader.profit30d) >= 0 ? "border-success" : "border-destructive"} flex items-center justify-center text-xl font-bold ${parseFloat(selectedTrader.profit30d) >= 0 ? "text-success" : "text-destructive"}`}>
                        {parseFloat(selectedTrader.profit30d) >= 0 ? "+" : ""}{selectedTrader.profit30d}%
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-neutral-400">Performance over the last 30 days</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-neutral-900 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-2">Risk Level</h3>
                    <div className="flex items-center">
                      <div className="w-16 h-16 rounded-full border-4 border-yellow-500 flex items-center justify-center text-xl font-bold text-yellow-500">
                        Med
                      </div>
                      <div className="ml-4">
                        <p className="text-sm text-neutral-400">Moderate risk level based on trading history</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">About Trader</h3>
                  <p className="text-neutral-300">{selectedTrader.bio || "No bio provided."}</p>
                </div>

                {isFollowing(selectedTrader.id) && (
                  <div className="bg-neutral-900 rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold mb-3">Copy Settings</h3>
                    <div className="mb-4">
                      <p className="text-sm text-neutral-400 mb-2">Allocation Percentage</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Slider
                            value={[allocationPercentage]}
                            onValueChange={(value) => setAllocationPercentage(value[0])}
                            min={10}
                            max={100}
                            step={5}
                          />
                        </div>
                        <div className="w-16">
                          <Input 
                            type="number" 
                            value={allocationPercentage} 
                            onChange={e => setAllocationPercentage(parseInt(e.target.value) || 0)}
                            min={10}
                            max={100}
                            className="text-center"
                          />
                        </div>
                        <div className="w-4">%</div>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        This is the percentage of your balance that will be allocated to copy this trader's trades.
                      </p>
                    </div>

                    <Button 
                      onClick={() => handleAllocationChange(selectedTrader)}
                      disabled={updateCopyMutation.isPending}
                    >
                      Save Settings
                    </Button>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Performance</h3>
                  <div className="bg-neutral-900 rounded-lg p-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generatePerformanceData()}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1F2937', 
                              border: '1px solid #374151',
                              borderRadius: '6px'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="profit" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-800 rounded-lg p-6 flex flex-col items-center justify-center h-full min-h-[400px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Select a Trader</h3>
                <p className="text-neutral-400 text-center max-w-md">
                  Choose a trader from the list to view their profile and performance details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CopyTradingPage;
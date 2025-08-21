import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "wouter";
import { fetchInvestmentPlans, createInvestment, fetchUserInvestments } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const InvestmentPlansPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["/api/investment-plans"],
  });

  // Parse plan ID from URL if present
  useEffect(() => {
    if (!location || !plans || !Array.isArray(plans)) return;

    const queryString = location.split('?')[1];
    if (!queryString) return;

    const params = new URLSearchParams(queryString);
    const planId = params.get('plan');

    if (planId) {
      const plan = plans.find((p: any) => p.id === parseInt(planId));
      if (plan) {
        setSelectedPlan(plan);
        setInvestmentAmount(plan.minAmount);
        setIsDialogOpen(true);
      }
    }
  }, [location, plans]);

  const { data: userInvestments, isLoading: isLoadingInvestments } = useQuery({
    queryKey: [`/api/user/${user?.id}/investments`],
    enabled: !!user?.id
  });

  const investMutation = useMutation({
    mutationFn: (data: any) => createInvestment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/investments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      toast({
        title: "Investment created",
        description: "Your investment has been successfully created",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create investment. Please check your balance and try again.",
      });
    }
  });

  // Format number with commas
  const formatNumber = (num: number | string) => {
    return parseFloat(num.toString()).toLocaleString('en-US');
  };

  // Handle invest button click
  const handleInvestClick = (plan: any) => {
    if (!user) return;

    setSelectedPlan(plan);
    setInvestmentAmount(plan.minAmount);
    setIsDialogOpen(true);
  };

  // Handle investment submission
  const handleInvestSubmit = () => {
    if (!user || !selectedPlan) return;

    const amount = parseFloat(investmentAmount);
    const minAmount = parseFloat(selectedPlan.minAmount);
    const maxAmount = selectedPlan.maxAmount ? parseFloat(selectedPlan.maxAmount) : Infinity;

    // Validate amount
    if (isNaN(amount) || amount < minAmount) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: `Minimum investment amount is $${formatNumber(minAmount)}`,
      });
      return;
    }

    if (maxAmount !== 0 && amount > maxAmount) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: `Maximum investment amount is $${formatNumber(maxAmount)}`,
      });
      return;
    }

    // Validate user balance
    const balance = parseFloat(user.balance);
    if (amount > balance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You don't have enough balance for this investment",
      });
      return;
    }

    // Calculate start and end dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedPlan.lockPeriodDays);

    // Create investment
    investMutation.mutate({
      userId: user.id,
      planId: selectedPlan.id,
      amount: amount.toString(),
      status: "active",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  };

  return (
    <>
      <Helmet>
        <title>Investment Plans | EliteStock Trading Platform</title>
        <meta name="description" content="Invest in our curated investment plans with competitive returns. Choose from Starter, Premium, and Elite plans on EliteStock Trading Platform." />
      </Helmet>

      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Investment Plans</h1>
          <p className="text-neutral-400">Invest in our curated plans with competitive returns</p>
        </div>

        {/* Investment Plans */}
        <div className="bg-neutral-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6">Available Plans</h2>

          {isLoadingPlans ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans?.map((plan: any, index: number) => {
                const isPremium = plan.name === "Premium";

                return (
                  <div
                    key={plan.id}
                    className={`border ${
                      isPremium
                        ? "border-primary"
                        : "border-neutral-700"
                    } rounded-lg p-6 hover:border-primary transition-colors ${
                      isPremium ? "hover:shadow-md hover:shadow-primary/10" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                        {index === 0 ? "Popular" : index === 1 ? "Recommended" : "VIP"}
                      </span>
                    </div>
                    <p className="text-3xl font-bold mono mb-1">
                      ${formatNumber(plan.minAmount)}
                      {plan.maxAmount && plan.maxAmount !== "0"
                        ? `-$${formatNumber(plan.maxAmount)}`
                        : "+"}
                    </p>
                    <p className="text-sm text-neutral-400 mb-4">Minimum investment</p>

                    <div className="mb-6">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Monthly ROI</span>
                        <span className="text-sm font-semibold text-success">{plan.roiPercentage}%</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full" 
                          style={{ width: `${Math.min(parseFloat(plan.roiPercentage) * 5, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-center text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${isPremium ? "bg-primary hover:bg-primary/90" : ""}`}
                      onClick={() => handleInvestClick(plan)}
                    >
                      Invest Now
                    </Button>

                    <p className="text-xs text-neutral-400 text-center mt-4">
                      {plan.lockPeriodDays}-day lock period applies
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User's Active Investments */}
        <div className="bg-neutral-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Your Investments</h2>

          {isLoadingInvestments ? (
            <div className="flex justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : userInvestments && userInvestments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-neutral-700">
                    <th className="pb-2 font-medium">Plan</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">ROI</th>
                    <th className="pb-2 font-medium">Start Date</th>
                    <th className="pb-2 font-medium">End Date</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {userInvestments.map((investment: any) => {
                    const startDate = new Date(investment.startDate);
                    const endDate = new Date(investment.endDate);
                    const isActive = investment.status === "active";

                    return (
                      <tr key={investment.id} className="border-b border-neutral-700">
                        <td className="py-4">{investment.plan.name}</td>
                        <td className="py-4 mono">${formatNumber(investment.amount)}</td>
                        <td className="py-4 text-success">{investment.plan.roiPercentage}%</td>
                        <td className="py-4">{startDate.toLocaleDateString()}</td>
                        <td className="py-4">{endDate.toLocaleDateString()}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            isActive 
                              ? "bg-success/20 text-success" 
                              : "bg-neutral-600/20 text-neutral-400"
                          }`}>
                            {investment.status.charAt(0).toUpperCase() + investment.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">No active investments</h3>
              <p>You don't have any active investments. Choose a plan above to start investing.</p>
            </div>
          )}
        </div>

        {/* Investment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invest in {selectedPlan?.name}</DialogTitle>
              <DialogDescription>
                Enter the amount you want to invest
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="mb-4">
                <p className="text-sm font-medium mb-1">Investment Amount</p>
                <Input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  min={selectedPlan?.minAmount}
                  max={selectedPlan?.maxAmount !== "0" ? selectedPlan?.maxAmount : undefined}
                  className="text-lg mono"
                  placeholder="Enter amount"
                />
                <p className="text-xs text-neutral-400 mt-1">
                  Min: ${formatNumber(selectedPlan?.minAmount || 0)}
                  {selectedPlan?.maxAmount !== "0" && ` | Max: $${formatNumber(selectedPlan?.maxAmount || 0)}`}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Plan</span>
                  <span className="font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>ROI</span>
                  <span className="font-medium text-success">{selectedPlan?.roiPercentage}% Monthly</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lock Period</span>
                  <span className="font-medium">{selectedPlan?.lockPeriodDays} Days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Your Balance</span>
                  <span className="font-medium">${formatNumber(user?.balance || 0)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleInvestSubmit}
                disabled={investMutation.isPending}
              >
                {investMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Confirm Investment"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default InvestmentPlansPage;
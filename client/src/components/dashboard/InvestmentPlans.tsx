import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchInvestmentPlans } from "@/lib/api";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const InvestmentPlans = () => {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/investment-plans"],
  });

  // Format number with commas
  const formatNumber = (num: number | string) => {
    return parseFloat(num.toString()).toLocaleString('en-US');
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Investment Plans</h2>
        <Link href="/investments">
          <a className="text-primary text-sm hover:underline">View All Plans</a>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((plan: any, index: number) => {
            const isPremium = plan.name === "Premium";
            
            return (
              <div
                key={plan.id}
                className={`border ${
                  isPremium
                    ? "border-primary"
                    : "border-neutral-700"
                } rounded-lg p-4 hover:border-primary transition-colors ${
                  isPremium ? "hover:shadow-md hover:shadow-primary/10" : ""
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">{plan.name}</h3>
                  <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded">
                    {index === 0 ? "Popular" : index === 1 ? "Recommended" : "VIP"}
                  </span>
                </div>
                <p className="text-2xl font-bold mono mb-1">
                  ${formatNumber(plan.minAmount)}
                  {plan.maxAmount && plan.maxAmount !== "0"
                    ? `-$${formatNumber(plan.maxAmount)}`
                    : "+"}
                </p>
                <p className="text-sm text-neutral-400 mb-3">Minimum investment</p>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/investments?plan=${plan.id}`}>
                  <Button className={`w-full ${isPremium ? "bg-primary hover:bg-primary/90" : ""}`}>
                    Invest Now
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InvestmentPlans;

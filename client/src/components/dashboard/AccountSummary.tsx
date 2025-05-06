import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTrades } from "@/lib/api";
import {
  DollarIcon,
  TrendingUpIcon,
  WalletIcon,
  UsersIcon
} from "@/components/ui/icons";

const AccountSummary = () => {
  const { user } = useAuth();
  
  const { data: trades } = useQuery({
    queryKey: [`/api/user/${user?.id}/trades`],
    enabled: !!user
  });
  
  const activeTrades = trades?.filter((trade: any) => trade.status === "executed") || [];
  
  // Calculate total profit from trades
  const totalProfit = activeTrades.reduce((total: number, trade: any) => {
    if (trade.type === "buy") {
      const currentPrice = parseFloat(trade.asset.price);
      const purchasePrice = parseFloat(trade.price);
      const amount = parseFloat(trade.amount);
      return total + ((currentPrice - purchasePrice) * amount);
    } else {
      const currentPrice = parseFloat(trade.asset.price);
      const sellPrice = parseFloat(trade.price);
      const amount = parseFloat(trade.amount);
      return total + ((sellPrice - currentPrice) * amount);
    }
  }, 0);

  // Format numbers with commas
  const formatNumber = (num: number | string) => {
    return parseFloat(num.toString()).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-neutral-300 text-sm">Total Balance</p>
            <h3 className="text-2xl font-bold mono">${formatNumber(user?.balance || 0)}</h3>
          </div>
          <span className="text-white text-xl">
            <DollarIcon className="w-6 h-6" />
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-success flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +5.4%
          </span>
          <span className="text-xs text-neutral-300 ml-2">from last month</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-neutral-300 text-sm">Total Profit</p>
            <h3 className={`text-2xl font-bold mono ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${formatNumber(totalProfit || 0)}
            </h3>
          </div>
          <span className="text-primary text-xl">
            <TrendingUpIcon className="w-6 h-6" />
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-success flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +12.8%
          </span>
          <span className="text-xs text-neutral-300 ml-2">from last week</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-neutral-300 text-sm">Active Trades</p>
            <h3 className="text-2xl font-bold mono">{activeTrades.length}</h3>
          </div>
          <span className="text-primary text-xl">
            <WalletIcon className="w-6 h-6" />
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-danger flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            -2
          </span>
          <span className="text-xs text-neutral-300 ml-2">from yesterday</span>
        </div>
      </div>

      <div className="bg-neutral-800 rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-neutral-300 text-sm">Copy Trading</p>
            <h3 className="text-2xl font-bold mono">3 Traders</h3>
          </div>
          <span className="text-primary text-xl">
            <UsersIcon className="w-6 h-6" />
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-success flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            +8.2%
          </span>
          <span className="text-xs text-neutral-300 ml-2">performance</span>
        </div>
      </div>
    </div>
  );
};

export default AccountSummary;

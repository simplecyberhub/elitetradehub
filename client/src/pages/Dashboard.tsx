import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import AccountSummary from "@/components/dashboard/AccountSummary";
import MarketOverview from "@/components/dashboard/MarketOverview";
import Watchlist from "@/components/dashboard/Watchlist";
import RecentTrades from "@/components/dashboard/RecentTrades";
import CopyTrading from "@/components/dashboard/CopyTrading";
import InvestmentPlans from "@/components/dashboard/InvestmentPlans";
import DepositMethods from "@/components/dashboard/DepositMethods";
import QuickLinks from "@/components/dashboard/QuickLinks";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Dashboard | TFXC Trading Platform</title>
        <meta name="description" content="View your trading portfolio, market overview, recent trades, and investment opportunities on TFXC Trading Platform." />
      </Helmet>
      
      <div>
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-neutral-400">Welcome back, {user?.fullName.split(' ')[0]}! Here's an overview of your portfolio.</p>
        </div>

        {/* Account Summary */}
        <AccountSummary />

        {/* Market Overview & Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <MarketOverview />
          </div>
          <div>
            <Watchlist />
          </div>
        </div>

        {/* Recent Trades & Copy Trading */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <CopyTrading />
          </div>
        </div>

        {/* Investment Plans & Deposit Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <InvestmentPlans />
          </div>
          <div>
            <DepositMethods />
          </div>
        </div>

        {/* Quick Links */}
        <QuickLinks />
      </div>
    </>
  );
};

export default Dashboard;

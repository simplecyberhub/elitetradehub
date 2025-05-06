import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTransactions } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const Transactions = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/api/user/${user?.id}/transactions`],
    enabled: !!user?.id,
  });
  
  // Filter transactions by type
  const filteredTransactions = transactions
    ? transactions.filter((transaction: any) => {
        if (filter === "all") return true;
        return transaction.type.toLowerCase() === filter.toLowerCase();
      })
    : [];
  
  // Search functionality
  const searchedTransactions = filteredTransactions.filter((transaction: any) => {
    if (!searchTerm) return true;
    
    const searchValue = searchTerm.toLowerCase();
    return (
      transaction.type.toLowerCase().includes(searchValue) ||
      transaction.amount.toString().includes(searchValue) ||
      transaction.status.toLowerCase().includes(searchValue) ||
      (transaction.method && transaction.method.toLowerCase().includes(searchValue))
    );
  });
  
  // Group transactions by date for display
  const groupTransactionsByDate = (transactions: any[]) => {
    const groups: Record<string, any[]> = {};
    
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
    });
    
    return groups;
  };
  
  const groupedTransactions = groupTransactionsByDate(searchedTransactions);
  
  // Helper to format transaction amount
  const formatAmount = (transaction: any) => {
    const amount = parseFloat(transaction.amount);
    const isNegative = transaction.type === "withdrawal" || transaction.type === "trade" && transaction.subType === "buy";
    
    return (
      <span className={isNegative ? "text-destructive" : "text-success"}>
        {isNegative ? "-" : "+"}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
    );
  };
  
  // Helper to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-success/20 text-success";
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "failed":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-neutral-600/20 text-neutral-400";
    }
  };
  
  // Helper to get icon for transaction type
  const getTransactionIcon = (type: string) => {
    if (type === "deposit") {
      return (
        <div className="h-9 w-9 rounded-full bg-success/20 text-success flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      );
    } else if (type === "withdrawal") {
      return (
        <div className="h-9 w-9 rounded-full bg-destructive/20 text-destructive flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </div>
      );
    } else if (type === "trade") {
      return (
        <div className="h-9 w-9 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </div>
      );
    } else if (type === "investment") {
      return (
        <div className="h-9 w-9 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      );
    }
    
    return (
      <div className="h-9 w-9 rounded-full bg-neutral-700 text-white flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-neutral-400">View all your transaction activities</p>
        </div>
        
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>View your transaction history</CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <>
      <Helmet>
        <title>Transaction History | EliteStock Trading Platform</title>
        <meta name="description" content="View your complete transaction history including deposits, withdrawals, and trades on EliteStock Trading Platform." />
      </Helmet>
      
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-neutral-400">View all your transaction activities</p>
        </div>
        
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader className="pb-0">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>View your transaction history</CardDescription>
              </div>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-neutral-700 border-neutral-600"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="all" onValueChange={setFilter}>
              <TabsList className="mb-4 bg-neutral-900">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposit">Deposits</TabsTrigger>
                <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
                <TabsTrigger value="trade">Trades</TabsTrigger>
                <TabsTrigger value="investment">Investments</TabsTrigger>
              </TabsList>
              
              <TabsContent value={filter}>
                {searchedTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-neutral-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">No transactions found</h3>
                    <p className="text-neutral-400">
                      {searchTerm
                        ? "Try adjusting your search query"
                        : `You don't have any ${filter !== "all" ? filter : ""} transactions yet`}
                    </p>
                  </div>
                ) : (
                  <div>
                    {Object.entries(groupedTransactions).map(([date, transactions]) => (
                      <div key={date} className="mb-6">
                        <h3 className="text-sm font-medium text-neutral-400 mb-2">{date}</h3>
                        <div className="space-y-3">
                          {transactions.map((transaction: any) => (
                            <div
                              key={transaction.id}
                              className="flex items-center gap-4 bg-neutral-900 p-3 rounded-lg"
                            >
                              {getTransactionIcon(transaction.type)}
                              <div className="flex-grow">
                                <div className="flex justify-between">
                                  <h4 className="font-medium capitalize">
                                    {transaction.type === "trade"
                                      ? `${transaction.subType === "buy" ? "Buy" : "Sell"} ${transaction.assetSymbol || "Asset"}`
                                      : `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`}
                                  </h4>
                                  {formatAmount(transaction)}
                                </div>
                                <div className="flex justify-between">
                                  <div className="text-sm text-neutral-400">
                                    {transaction.method && (
                                      <span className="capitalize">{transaction.method.replace("_", " ")}</span>
                                    )}
                                    {transaction.assetSymbol && transaction.type === "trade" && (
                                      <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded ml-2">
                                        {transaction.assetSymbol}
                                      </span>
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(transaction.status)}`}>
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Transactions;
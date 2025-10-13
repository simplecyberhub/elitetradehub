import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import DepositForm from "@/components/forms/DepositForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WalletIcon, BitcoinIcon, CurrencyIcon } from "@/components/ui/icons";

const Deposit = () => {
  const { user } = useAuth();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("crypto");
  
  // Payment method icons with labels
  const paymentMethods = [
    {/*
      id: "card",
      label: "Credit/Debit Card",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>,
      description: "Instant processing with 1.5% fee"
    },
    {
      id: "bank",
      label: "Bank Transfer",
      icon: <WalletIcon className="h-6 w-6" />,
      description: "1-3 business days with no fee"
    */},
    {
      id: "crypto",
      label: "Cryptocurrency",
      icon: <BitcoinIcon className="h-6 w-6" />,
      description: "Deposit Bitcoin, Ethereum, and other cryptocurrencies"
    },
    {
      id: "paypal",
      label: "PayPal",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>,
      description: "Instant processing with 2.5% fee"
    }
  ];
  
  // Parse method ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const methodId = params.get('method');
    if (methodId) {
      switch (methodId) {
        case "1":
          setActiveTab("card");
          break;
        case "2":
          setActiveTab("bank");
          break;
        case "3":
          setActiveTab("crypto");
          break;
        case "4":
          setActiveTab("paypal");
          break;
        default:
          break;
      }
    }
  }, [location]);
  
  return (
    <>
      <Helmet>
        <title>Deposit Funds | TFXC Trading Platform</title>
        <meta name="description" content="Deposit funds to your TFXC trading account using cryptocurrency, or PayPal." />
      </Helmet>
      
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Deposit Funds</h1>
          <p className="text-neutral-400">Add funds to your account to start trading</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="bg-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
            
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className={`border ${
                    activeTab === method.id 
                      ? "border-primary" 
                      : "border-neutral-700"
                  } rounded-lg p-4 hover:border-primary transition-colors cursor-pointer`}
                  onClick={() => setActiveTab(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-white">
                      {method.icon}
                    </div>
                    <div>
                      <h3 className="font-medium">{method.label}</h3>
                      <p className="text-xs text-neutral-400">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-neutral-900 rounded-lg">
              <h3 className="font-medium mb-2">Deposit Information</h3>
              <ul className="space-y-2 text-sm text-neutral-300">
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Funds will be available immediately after approval for cryptocurrency deposits.</span>
                </li>
                
                <li className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>Your account needs to be verified before withdrawals can be processed.</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Deposit Form */}
          <div className="lg:col-span-2 bg-neutral-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Deposit Details</h2>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="card">
                <DepositForm method="credit_card" />
              </TabsContent>
              
              <TabsContent value="bank">
                <DepositForm method="bank_transfer" />
              </TabsContent>
              
              <TabsContent value="crypto">
                <DepositForm method="crypto" />
              </TabsContent>
              
              <TabsContent value="paypal">
                <DepositForm method="paypal" />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default Deposit;

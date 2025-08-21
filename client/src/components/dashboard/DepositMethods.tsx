import React from "react";
import { Link } from "wouter";
import { WalletIcon, CurrencyIcon, BitcoinIcon } from "@/components/ui/icons";

const DepositMethods = () => {
  const depositMethods = [
    {
      id: 1,
      name: "Credit/Debit Card",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>,
      timing: "Instant",
      fee: "1.5%",
      min: 10,
      max: 10000
    },
    {
      id: 2,
      name: "Bank Transfer",
      icon: <WalletIcon className="h-6 w-6" />,
      timing: "1-3 days",
      fee: "$0",
      min: 500,
      max: 100000
    },
    {
      id: 3,
      name: "Cryptocurrency",
      icon: <BitcoinIcon className="h-6 w-6" />,
      timing: "Instant",
      fee: "0%",
      min: 50,
      max: null
    },
    {
      id: 4,
      name: "PayPal",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>,
      timing: "Instant",
      fee: "2.5%",
      min: 10,
      max: 5000
    }
  ];

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Deposit Methods</h2>
        <Link href="/deposit" className="text-primary text-sm hover:underline">
          Deposit Now
        </Link>
      </div>

      <div className="space-y-3">
        {depositMethods.map((method) => (
          <div key={method.id} className="border border-neutral-700 rounded-lg p-3 hover:border-primary transition-colors">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <span className="text-white text-2xl">{method.icon}</span>
                <h4 className="font-medium">{method.name}</h4>
              </div>
              <span className="text-xs text-neutral-400">{method.timing}</span>
            </div>
            <p className="text-xs text-neutral-400 mb-2">
              Fee: {method.fee} | Min: ${method.min} | Max: {method.max ? `$${method.max.toLocaleString()}` : "No limit"}
            </p>
            <Link href={`/deposit?method=${method.id}`}>
              <button className="w-full bg-primary hover:bg-primary/90 py-1.5 rounded-md text-xs transition-colors">
                Select
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepositMethods;

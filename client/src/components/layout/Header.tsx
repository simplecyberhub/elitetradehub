import React from "react";
import { useAuth } from "@/context/AuthContext";
import { BellIcon, SearchIcon } from "@/components/ui/icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";

const Header = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  const userInitials = getInitials(user.fullName);

  return (
    <header className="bg-neutral-800 border-b border-neutral-700 sticky top-0 z-20">
      <div className="flex justify-between items-center py-3 px-4">
        <div className="flex items-center">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search markets..." 
              className="bg-neutral-700 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-72" 
            />
            <SearchIcon className="absolute left-3 top-2.5 text-neutral-400 w-4 h-4" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-neutral-700 rounded-md px-3 py-1.5">
            <span className="text-sm font-medium mr-2">Market Status:</span>
            <span className="flex items-center text-success">
              <span className="h-2 w-2 bg-success rounded-full mr-1.5 animate-pulse"></span>
              Open
            </span>
          </div>
          
          <button className="relative text-neutral-400 hover:text-white">
            <BellIcon className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
          </button>
          
          <Link href="/profile">
            <a className="flex items-center gap-2 cursor-pointer hover:bg-neutral-700 p-1.5 rounded-md">
              <Avatar className="h-8 w-8 bg-primary">
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-xs text-neutral-400">{user.kycStatus === "verified" ? "Verified Trader" : "Pending Verification"}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </a>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  PiggyBank,
  CreditCard,
  ArrowUpRight,
  Shield,
  User,
  Receipt,
  Menu,
  X,
  Settings,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // { name: "Markets", href: "/markets", icon: TrendingUp },
  { name: "Copy Trading", href: "/copy-trading", icon: Users },
  { name: "Investments", href: "/investments", icon: PiggyBank },
  { name: "Deposit", href: "/deposit", icon: CreditCard },
  { name: "Withdraw", href: "/withdraw", icon: ArrowUpRight },
  { name: "KYC", href: "/kyc", icon: Shield },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Transactions", href: "/transactions", icon: Receipt },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  
  // Admin navigation items
  const adminNavigation = [
    { name: "Admin Dashboard", href: "/admin", icon: Settings },
    { name: "Transaction Review", href: "/admin/transactions", icon: FileCheck },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-neutral-800 border-neutral-700"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-neutral-900 border-r border-neutral-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-xl font-bold text-white">TFXC</h1>
          </div>

          <nav className="flex-1 px-4 pb-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link href={item.href} className="flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-neutral-800">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
              
              {/* Admin Navigation Section */}
              {user?.role === 'admin' && (
                <>
                  <li className="pt-4">
                    <div className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Administration
                    </div>
                  </li>
                  {adminNavigation.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <li key={item.name}>
                        <Link href={item.href} className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors hover:bg-neutral-800",
                          isActive ? "bg-primary text-primary-foreground" : "text-neutral-300"
                        )}>
                          <item.icon className="mr-3 h-5 w-5" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </>
              )}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

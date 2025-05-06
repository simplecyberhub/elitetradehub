import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import {
  DashboardIcon,
  StockIcon,
  CopyTradingIcon,
  WalletIcon,
  CurrencyIcon,
  IdentityIcon,
  ProfileIcon,
  TransactionIcon,
  InvestmentPlanIcon
} from "@/components/ui/icons";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Update sidebar state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const menuItems = [
    {
      title: "Main Menu",
      items: [
        { 
          path: "/", 
          label: "Dashboard", 
          icon: <DashboardIcon className="w-5 h-5" />
        },
        { 
          path: "/markets", 
          label: "Markets", 
          icon: <StockIcon className="w-5 h-5" />
        },
        { 
          path: "/copy-trading", 
          label: "Copy Trading", 
          icon: <CopyTradingIcon className="w-5 h-5" />
        },
        { 
          path: "/investments", 
          label: "Investment Plans", 
          icon: <InvestmentPlanIcon className="w-5 h-5" />
        },
        { 
          path: "/deposit", 
          label: "Deposit", 
          icon: <WalletIcon className="w-5 h-5" />
        },
        { 
          path: "/withdraw", 
          label: "Withdraw", 
          icon: <CurrencyIcon className="w-5 h-5" />
        },
        { 
          path: "/transactions", 
          label: "Transactions", 
          icon: <TransactionIcon className="w-5 h-5" />
        },
      ]
    },
    {
      title: "Account",
      items: [
        { 
          path: "/profile", 
          label: "Profile", 
          icon: <ProfileIcon className="w-5 h-5" />
        },
        { 
          path: "/kyc", 
          label: "KYC Verification", 
          icon: <IdentityIcon className="w-5 h-5" />
        },
      ]
    }
  ];

  return (
    <aside
      className={`bg-neutral-900 border-r border-neutral-700 w-full lg:w-64 lg:fixed lg:h-screen overflow-y-auto transition-all duration-300 z-30 ${
        isMobile && !isOpen ? "fixed -left-full" : isMobile && isOpen ? "fixed inset-0" : ""
      }`}
    >
      <div className="p-4 flex justify-between items-center lg:block">
        <div className="flex items-center gap-2">
          <span className="text-primary text-2xl">
            <StockIcon className="w-6 h-6" />
          </span>
          <h1 className="text-xl font-bold text-white">EliteStock</h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-white"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <nav className={`${isMobile && !isOpen ? "hidden" : "block"}`}>
        {menuItems.map((section, idx) => (
          <div key={idx}>
            <div className="px-4 py-2">
              <p className="text-xs uppercase text-neutral-400">{section.title}</p>
            </div>
            <ul>
              {section.items.map((item, index) => (
                <li key={index}>
                  <Link href={item.path}>
                    <a
                      className={`flex items-center gap-3 px-4 py-3 ${
                        location === item.path
                          ? "text-white bg-primary/30 border-l-4 border-primary"
                          : "text-neutral-400 hover:bg-primary/20 transition-colors"
                      }`}
                      onClick={() => isMobile && setIsOpen(false)}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {user && (
          <div className="px-4 py-2 mt-4">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-left text-neutral-400 hover:bg-primary/20 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;

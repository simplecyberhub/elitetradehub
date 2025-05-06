import React from "react";
import { Link } from "wouter";
import { IdentityIcon, ProfileIcon, WalletIcon, DollarIcon } from "@/components/ui/icons";

const QuickLinks = () => {
  const quickLinks = [
    {
      title: "KYC Verification",
      description: "Complete your verification",
      icon: <IdentityIcon className="h-5 w-5" />,
      color: "bg-primary text-primary-foreground",
      href: "/kyc"
    },
    {
      title: "Profile Settings",
      description: "Update your information",
      icon: <ProfileIcon className="h-5 w-5" />,
      color: "bg-secondary text-secondary-foreground",
      href: "/profile"
    },
    {
      title: "Withdraw Funds",
      description: "Request a withdrawal",
      icon: <WalletIcon className="h-5 w-5" />,
      color: "bg-success text-white",
      href: "/withdraw"
    },
    {
      title: "Support Center",
      description: "Get help with your account",
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>,
      color: "bg-yellow-500 text-white",
      href: "#"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {quickLinks.map((link, index) => (
        <Link key={index} href={link.href}>
          <a className="bg-neutral-800 p-4 rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-3">
            <span className={`h-10 w-10 ${link.color} bg-opacity-20 rounded-full flex items-center justify-center`}>
              {link.icon}
            </span>
            <div>
              <h3 className="font-medium">{link.title}</h3>
              <p className="text-xs text-neutral-400">{link.description}</p>
            </div>
          </a>
        </Link>
      ))}
    </div>
  );
};

export default QuickLinks;

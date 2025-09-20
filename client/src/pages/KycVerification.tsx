import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import KycForm from "@/components/forms/KycForm";

const KycVerification = () => {
  const { user } = useAuth();
  
  return (
    <>
      <Helmet>
        <title>KYC Verification | TFXC Trading Platform</title>
        <meta name="description" content="Complete your identity verification to unlock all features of the TFXC Trading Platform." />
      </Helmet>
      
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">KYC Verification</h1>
          <p className="text-neutral-400">Complete your identity verification to unlock all features</p>
        </div>
        
        <div className="bg-neutral-800 rounded-lg p-6">
          <KycForm />
        </div>
      </div>
    </>
  );
};

export default KycVerification;
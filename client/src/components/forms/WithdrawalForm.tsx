import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createWithdrawal } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define withdrawal form schema - we'll add method-specific validation in the component
const withdrawalFormSchema = z.object({
  amount: z.union([
    z.string().transform((val) => parseFloat(val)),
    z.number()
  ]).pipe(
    z.number()
      .positive("Amount must be positive")
      .min(10, "Minimum withdrawal amount is $10")
  ),
  // Bank transfer fields
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  swiftCode: z.string().optional(),
  // Crypto fields
  walletAddress: z.string().optional(),
  networkType: z.string().optional(),
  // PayPal fields
  email: z.string().email().optional().or(z.literal("")),
  // Additional withdrawal details
  withdrawalNotes: z.string().optional(),
});

type WithdrawalFormValues = z.infer<typeof withdrawalFormSchema>;

interface WithdrawalFormProps {
  method: "bank_transfer" | "crypto" | "paypal";
}

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ method }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  
  const userBalance = user ? parseFloat(user.balance) : 0;
  
  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalFormSchema),
    defaultValues: {
      amount: 100,
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      accountName: "",
      swiftCode: "",
      walletAddress: "",
      networkType: "",
      email: "",
      withdrawalNotes: "",
    },
  });

  const withdrawalMutation = useMutation({
    mutationFn: (data: {
      userId: number;
      amount: number;
      method: string;
      withdrawalAddress?: string;
      withdrawalDetails?: string;
      withdrawalNotes?: string;
    }) => createWithdrawal(
      data.userId,
      data.amount,
      data.method,
      data.withdrawalAddress,
      data.withdrawalDetails,
      data.withdrawalNotes
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      setIsSuccess(true);
      toast({
        title: "Withdrawal request submitted",
        description: `Your withdrawal request for $${form.getValues().amount} has been submitted and is being processed.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Withdrawal failed",
        description: "There was an error processing your withdrawal. Please try again.",
      });
    },
  });

  const validateMethodSpecificFields = (values: WithdrawalFormValues) => {
    const errors: { [key: string]: string } = {};
    
    if (method === "bank_transfer") {
      if (!values.bankName?.trim()) errors.bankName = "Bank name is required";
      if (!values.accountName?.trim()) errors.accountName = "Account holder name is required";
      if (!values.accountNumber?.trim()) errors.accountNumber = "Account number is required";
      if (!values.routingNumber?.trim()) errors.routingNumber = "Routing number is required";
    } else if (method === "crypto") {
      if (!values.walletAddress?.trim()) errors.walletAddress = "Wallet address is required";
      if (!values.networkType?.trim()) errors.networkType = "Network type is required";
    } else if (method === "paypal") {
      if (!values.email?.trim()) errors.email = "PayPal email is required";
    }
    
    return errors;
  };

  const onSubmit = (values: WithdrawalFormValues) => {
    if (!user) return;
    
    // Validate method-specific fields
    const methodErrors = validateMethodSpecificFields(values);
    if (Object.keys(methodErrors).length > 0) {
      // Set form errors
      Object.entries(methodErrors).forEach(([field, message]) => {
        form.setError(field as keyof WithdrawalFormValues, { message });
      });
      return;
    }
    
    // Check if user has enough balance
    if (values.amount > userBalance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal."
      });
      return;
    }
    
    // Prepare withdrawal destination info based on method
    let withdrawalAddress = "";
    let withdrawalDetails = "";
    
    if (method === "bank_transfer") {
      withdrawalAddress = `${values.bankName} - ${values.accountNumber}`;
      withdrawalDetails = JSON.stringify({
        bankName: values.bankName,
        accountName: values.accountName,
        accountNumber: values.accountNumber,
        routingNumber: values.routingNumber,
        swiftCode: values.swiftCode,
      });
    } else if (method === "crypto") {
      withdrawalAddress = values.walletAddress || "";
      withdrawalDetails = JSON.stringify({
        walletAddress: values.walletAddress,
        networkType: values.networkType || "ERC-20",
      });
    } else if (method === "paypal") {
      withdrawalAddress = values.email || "";
      withdrawalDetails = JSON.stringify({
        email: values.email,
      });
    }
    
    withdrawalMutation.mutate({
      userId: user.id,
      amount: values.amount,
      method,
      withdrawalAddress,
      withdrawalDetails,
      withdrawalNotes: values.withdrawalNotes,
    });
  };

  // Check if KYC is verified
  const isKycVerified = user?.kycStatus === "verified";

  if (isSuccess) {
    return (
      <Card className="bg-neutral-900 border-success/30">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="h-16 w-16 rounded-full bg-success/20 text-success flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Withdrawal Request Submitted</h3>
            <p className="text-neutral-400 mb-4">
              Your withdrawal request of ${form.getValues().amount} via {method.replace("_", " ")} has been submitted successfully.
            </p>
            <p className="text-neutral-400 mb-6">
              Withdrawals typically take 1-3 business days to process.
            </p>
            <Button onClick={() => setIsSuccess(false)}>Make Another Withdrawal</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isKycVerified) {
    return (
      <Alert variant="destructive" className="mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <AlertTitle>Verification Required</AlertTitle>
        <AlertDescription>
          <p className="mb-4">You need to complete KYC verification before you can withdraw funds.</p>
          <Button asChild variant="outline">
            <a href="/kyc">Complete KYC Verification</a>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdrawal Amount</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-neutral-400">$</span>
                  <Input
                    type="number"
                    placeholder="100"
                    className="pl-8"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Available balance: ${userBalance.toFixed(2)}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {method === "bank_transfer" && (
          <>
            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Bank of America"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Holder Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Smith"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your bank account number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Routing Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your bank routing number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="swiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT Code (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="For international transfers"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Required for international wire transfers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {method === "crypto" && (
          <>
            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Wallet Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Wallet address for receiving funds"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please double-check your wallet address. Transactions cannot be reversed.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="networkType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Network Type</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white ring-offset-neutral-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="">Select network</option>
                      <option value="ERC-20">ERC-20 (Ethereum)</option>
                      <option value="BTC">Bitcoin Network</option>
                      <option value="TRC-20">TRC-20 (Tron)</option>
                      <option value="BSC">BNB Smart Chain</option>
                      <option value="POLYGON">Polygon</option>
                    </select>
                  </FormControl>
                  <FormDescription>
                    Choose the correct network for your wallet
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {method === "paypal" && (
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>PayPal Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="your-email@example.com"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Your PayPal account must be verified to receive funds.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Withdrawal Notes Section - Common to all methods */}
        <FormField
          control={form.control}
          name="withdrawalNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Any special instructions or notes for your withdrawal..."
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Include any special instructions, reference numbers, or additional information
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="bg-neutral-900 rounded-lg p-4">
          <h3 className="font-medium mb-3">Withdrawal Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-400">Amount</span>
              <span>${form.watch("amount") || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Fee</span>
              <span>
                {method === "bank_transfer"
                  ? `$${((form.watch("amount") || 0) > 1000 ? 0 : 5).toFixed(2)}`
                  : method === "paypal"
                  ? `$${((form.watch("amount") || 0) * 0.01).toFixed(2)} (1%)`
                  : method === "crypto"
                  ? `$${((form.watch("amount") || 0) * 0.005).toFixed(2)} (0.5%)`
                  : "$0.00"}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>You'll receive</span>
              <span>
                ${method === "bank_transfer"
                  ? ((form.watch("amount") || 0) - ((form.watch("amount") || 0) > 1000 ? 0 : 5)).toFixed(2)
                  : method === "paypal"
                  ? ((form.watch("amount") || 0) * 0.99).toFixed(2)
                  : method === "crypto"
                  ? ((form.watch("amount") || 0) * 0.995).toFixed(2)
                  : (form.watch("amount") || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <Alert>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <AlertTitle>Processing Time</AlertTitle>
          <AlertDescription>
            Withdrawals typically take 1-3 business days to process. You will receive a confirmation email once the withdrawal is complete.
          </AlertDescription>
        </Alert>

        <Button 
          type="submit" 
          className="w-full"
          disabled={withdrawalMutation.isPending}
        >
          {withdrawalMutation.isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Request Withdrawal`
          )}
        </Button>
      </form>
    </Form>
  );
};

export default WithdrawalForm;

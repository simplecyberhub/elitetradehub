import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createDeposit } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define deposit form schema
const depositFormSchema = z.object({
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number()
      .positive("Amount must be positive")
      .min(10, "Minimum deposit amount is $10")
  ),
  cardNumber: z.string().optional(),
  cardName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
  accountNumber: z.string().optional(),
  routingNumber: z.string().optional(),
  bankName: z.string().optional(),
  walletAddress: z.string().optional(),
  email: z.string().email().optional(),
});

type DepositFormValues = z.infer<typeof depositFormSchema>;

interface DepositFormProps {
  method: "credit_card" | "bank_transfer" | "crypto" | "paypal";
}

const DepositForm: React.FC<DepositFormProps> = ({ method }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 100,
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
      accountNumber: "",
      routingNumber: "",
      bankName: "",
      walletAddress: "",
      email: "",
    },
  });

  const depositMutation = useMutation({
    mutationFn: (data: { userId: number; amount: number; method: string }) =>
      createDeposit(data.userId, data.amount, data.method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      setIsSuccess(true);
      toast({
        title: "Deposit successful",
        description: `$${form.getValues().amount} has been added to your account.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Deposit failed",
        description: "There was an error processing your deposit. Please try again.",
      });
    },
  });

  const onSubmit = (values: DepositFormValues) => {
    if (!user) return;

    depositMutation.mutate({
      userId: user.id,
      amount: values.amount,
      method,
    });
  };

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
            <h3 className="text-xl font-semibold mb-2">Deposit Successful</h3>
            <p className="text-neutral-400 mb-4">
              Your deposit of ${form.getValues().amount} via {method.replace("_", " ")} has been processed successfully.
            </p>
            <Button onClick={() => setIsSuccess(false)}>Make Another Deposit</Button>
          </div>
        </CardContent>
      </Card>
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
              <FormLabel>Deposit Amount</FormLabel>
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
                {method === "credit_card" && "Credit card deposits have a 1.5% fee."}
                {method === "bank_transfer" && "Bank transfers have no fee."}
                {method === "crypto" && "Crypto deposits have no fee."}
                {method === "paypal" && "PayPal deposits have a 2.5% fee."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {method === "credit_card" && (
          <>
            <FormField
              control={form.control}
              name="cardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cardName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardholder Name</FormLabel>
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

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MM/YY"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cvv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CVV</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="123"
                          maxLength={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

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
          </>
        )}

        {method === "crypto" && (
          <div>
            <Tabs defaultValue="btc">
              <TabsList className="w-full bg-neutral-900">
                <TabsTrigger value="btc">Bitcoin</TabsTrigger>
                <TabsTrigger value="eth">Ethereum</TabsTrigger>
                <TabsTrigger value="usdt">USDT</TabsTrigger>
              </TabsList>
              <TabsContent value="btc" className="py-4">
                <div className="bg-neutral-900 rounded-lg p-4 mb-4">
                  <p className="text-sm text-neutral-400 mb-2">Send Bitcoin to the following address:</p>
                  <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-md mb-4">
                    <code className="text-sm font-mono">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh");
                      toast({ title: "Address copied to clipboard" });
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </Button>
                  </div>
                  <div className="flex justify-center mb-2">
                    <div className="bg-white p-2 rounded-md">
                      <svg width="150" height="150" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="150" height="150" fill="white"/>
                        <path d="M10 10H20V20H10V10ZM20 10H30V20H20V10ZM30 10H40V20H30V10ZM40 10H50V20H40V10ZM50 10H60V20H50V10ZM60 10H70V20H60V10ZM70 10H80V20H70V10ZM90 10H100V20H90V10ZM120 10H130V20H120V10ZM130 10H140V20H130V10ZM10 20H20V30H10V20ZM60 20H70V30H60V20ZM70 20H80V30H70V20ZM100 20H110V30H100V20ZM120 20H130V30H120V20ZM10 30H20V40H10V30ZM30 30H40V40H30V30ZM40 30H50V40H40V30ZM50 30H60V40H50V30ZM70 30H80V40H70V30ZM90 30H100V40H90V30ZM110 30H120V40H110V30ZM130 30H140V40H130V30ZM10 40H20V50H10V40ZM30 40H40V50H30V40ZM40 40H50V50H40V40ZM50 40H60V50H50V40ZM80 40H90V50H80V40ZM110 40H120V50H110V40ZM130 40H140V50H130V40ZM10 50H20V60H10V50ZM30 50H40V60H30V50ZM40 50H50V60H40V50ZM50 50H60V60H50V50ZM70 50H80V60H70V50ZM80 50H90V60H80V50ZM100 50H110V60H100V50ZM130 50H140V60H130V50ZM10 60H20V70H10V60ZM60 60H70V70H60V60ZM80 60H90V70H80V60ZM100 60H110V70H100V60ZM110 60H120V70H110V60ZM130 60H140V70H130V60ZM10 70H20V80H10V70ZM20 70H30V80H20V70ZM30 70H40V80H30V70ZM40 70H50V80H40V70ZM50 70H60V80H50V70ZM60 70H70V80H60V70ZM70 70H80V80H70V70ZM90 70H100V80H90V70ZM110 70H120V80H110V70ZM130 70H140V80H130V70ZM90 80H100V90H90V80ZM40 90H50V100H40V90ZM60 90H70V100H60V90ZM70 90H80V100H70V90ZM80 90H90V100H80V90ZM90 90H100V100H90V90ZM110 90H120V100H110V90ZM120 90H130V100H120V90ZM20 100H30V110H20V100ZM30 100H40V110H30V100ZM50 100H60V110H50V100ZM80 100H90V110H80V100ZM100 100H110V110H100V100ZM130 100H140V110H130V100ZM20 110H30V120H20V110ZM50 110H60V120H50V110ZM70 110H80V120H70V110ZM80 110H90V120H80V110ZM100 110H110V120H100V110ZM120 110H130V120H120V110ZM10 120H20V130H10V120ZM20 120H30V130H20V120ZM40 120H50V130H40V120ZM60 120H70V130H60V120ZM90 120H100V130H90V120ZM110 120H120V130H110V120ZM120 120H130V130H120V120ZM10 130H20V140H10V130ZM30 130H40V140H30V130ZM40 130H50V140H40V130ZM70 130H80V140H70V130ZM90 130H100V140H90V130ZM100 130H110V140H100V130ZM120 130H130V140H120V130ZM130 130H140V140H130V130Z" fill="black"/>
                      </svg>
                    </div>
                  </div>
                  <p className="text-xs text-center text-neutral-400">
                    Scan QR code or copy address to send BTC
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your BTC Transaction ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Transaction ID for faster confirmation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="eth" className="py-4">
                <div className="bg-neutral-900 rounded-lg p-4 mb-4">
                  <p className="text-sm text-neutral-400 mb-2">Send Ethereum to the following address:</p>
                  <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-md mb-4">
                    <code className="text-sm font-mono">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</code>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
                      toast({ title: "Address copied to clipboard" });
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your ETH Transaction ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Transaction ID for faster confirmation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="usdt" className="py-4">
                <div className="bg-neutral-900 rounded-lg p-4 mb-4">
                  <p className="text-sm text-neutral-400 mb-2">Send USDT (ERC-20) to the following address:</p>
                  <div className="flex items-center justify-between bg-neutral-800 p-3 rounded-md mb-4">
                    <code className="text-sm font-mono">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</code>
                    <Button variant="outline" size="sm" onClick={() => {
                      navigator.clipboard.writeText("0x742d35Cc6634C0532925a3b844Bc454e4438f44e");
                      toast({ title: "Address copied to clipboard" });
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="walletAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your USDT Transaction ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Transaction ID for faster confirmation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
          </div>
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
                  You will be redirected to PayPal to complete the payment.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="bg-neutral-900 rounded-lg p-4">
          <h3 className="font-medium mb-3">Deposit Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-400">Amount</span>
              <span>${parseFloat(form.watch("amount")?.toString() || "0").toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Fee</span>
              <span>
                {method === "credit_card"
                  ? `$${((parseFloat(form.watch("amount")?.toString() || "0")) * 0.015).toFixed(2)} (1.5%)`
                  : method === "paypal"
                  ? `$${((parseFloat(form.watch("amount")?.toString() || "0")) * 0.025).toFixed(2)} (2.5%)`
                  : "$0.00"}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>
                ${method === "credit_card"
                  ? ((parseFloat(form.watch("amount")?.toString() || "0")) * 1.015).toFixed(2)
                  : method === "paypal"
                  ? ((parseFloat(form.watch("amount")?.toString() || "0")) * 1.025).toFixed(2)
                  : (parseFloat(form.watch("amount")?.toString() || "0")).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={depositMutation.isPending}
        >
          {depositMutation.isPending ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Deposit ${method === "credit_card" ? "with Credit Card" : 
            method === "bank_transfer" ? "with Bank Transfer" : 
            method === "crypto" ? "with Crypto" : "with PayPal"}`
          )}
        </Button>
      </form>
    </Form>
  );
};

export default DepositForm;
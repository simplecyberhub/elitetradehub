import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTrade } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";

// Define order form schema
const orderFormSchema = z.object({
  type: z.enum(["buy", "sell"]),
  amount: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number()
      .positive("Amount must be positive")
      .min(0.0001, "Minimum amount is 0.0001")
  ),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number()
      .positive("Price must be positive")
  ),
});

type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  asset: any;
}

const OrderForm: React.FC<OrderFormProps> = ({ asset }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [total, setTotal] = useState(0);
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      type: "buy",
      amount: 0,
      price: asset ? parseFloat(asset.price) : 0,
    },
  });
  
  // Update the form price when the asset changes
  useEffect(() => {
    if (asset) {
      form.setValue("price", parseFloat(asset.price));
    }
  }, [asset, form]);
  
  // Calculate total when amount or price changes
  useEffect(() => {
    const amount = form.watch("amount") || 0;
    const price = form.watch("price") || 0;
    setTotal(amount * price);
  }, [form.watch("amount"), form.watch("price")]);

  const tradeMutation = useMutation({
    mutationFn: (data: any) => createTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}/trades`] });
      // Invalidate user balance
      queryClient.invalidateQueries({ queryKey: [`/api/user/${user?.id}`] });
      setIsSuccess(true);
      toast({
        title: `${orderType.toUpperCase()} order executed`,
        description: `Your ${orderType} order has been successfully executed.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Order failed",
        description: "There was an error executing your order. Please try again.",
      });
    },
  });

  const onSubmit = (values: OrderFormValues) => {
    if (!user || !asset) return;
    
    // Check if user has enough balance for buy orders
    if (values.type === "buy") {
      const totalCost = values.amount * values.price;
      if (totalCost > parseFloat(user.balance)) {
        toast({
          variant: "destructive",
          title: "Insufficient balance",
          description: "You don't have enough balance to place this order.",
        });
        return;
      }
    }
    
    tradeMutation.mutate({
      userId: user.id,
      assetId: asset.id,
      type: values.type,
      amount: values.amount.toString(),
      price: values.price.toString(),
      status: "pending"
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
            <h3 className="text-xl font-semibold mb-2">Order Executed Successfully</h3>
            <p className="text-neutral-400 mb-6">
              Your {orderType} order for {form.getValues().amount} {asset.symbol} at ${form.getValues().price} has been executed.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsSuccess(false)}>
                Place Another Order
              </Button>
              <Button onClick={() => setLocation("/")}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={orderType} onValueChange={(value) => {
        setOrderType(value as "buy" | "sell");
        form.setValue("type", value as "buy" | "sell");
      }}>
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="buy" className="data-[state=active]:bg-success data-[state=active]:text-white">Buy</TabsTrigger>
          <TabsTrigger value="sell" className="data-[state=active]:bg-destructive data-[state=active]:text-white">Sell</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <TabsContent value="buy" className="space-y-4">
              <div className="bg-success/5 rounded-lg p-4 text-sm">
                <p>You are about to place a BUY order for {asset?.symbol}</p>
                <p className="mt-1 text-success">Available Balance: ${parseFloat(user?.balance || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Buy</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0"
                          {...field}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                          <span className="text-sm text-neutral-400">{asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "shares"}</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the amount of {asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "shares"} you want to buy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per {asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "Share"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-neutral-400">$</span>
                        <Input
                          type="number"
                          step="0.0001"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Current market price: ${parseFloat(asset?.price || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="sell" className="space-y-4">
              <div className="bg-destructive/5 rounded-lg p-4 text-sm">
                <p>You are about to place a SELL order for {asset?.symbol}</p>
                {/* In a real app, you would show the user's current holdings of this asset */}
                <p className="mt-1 text-neutral-400">Note: This is a demo. In a real application, you would only be able to sell assets you own.</p>
              </div>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Sell</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0"
                          {...field}
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center">
                          <span className="text-sm text-neutral-400">{asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "shares"}</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the amount of {asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "shares"} you want to sell
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price per {asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "Share"}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-neutral-400">$</span>
                        <Input
                          type="number"
                          step="0.0001"
                          className="pl-8"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Current market price: ${parseFloat(asset?.price || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <div className="bg-neutral-900 rounded-lg p-4">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Order Type</span>
                  <span className={orderType === "buy" ? "text-success" : "text-destructive"}>
                    {orderType.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Asset</span>
                  <span>{asset?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Amount</span>
                  <span>{form.watch("amount") || 0} {asset?.type === "crypto" ? asset?.symbol.split('/')[0] : "shares"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Price</span>
                  <span>${form.watch("price") || 0}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className={`w-full ${orderType === "buy" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}`}
              disabled={tradeMutation.isPending}
            >
              {tradeMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                `${orderType === "buy" ? "Buy" : "Sell"} ${asset?.symbol}`
              )}
            </Button>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default OrderForm;

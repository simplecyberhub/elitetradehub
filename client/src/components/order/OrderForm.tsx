import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface OrderFormProps {
  asset: any;
}

const OrderForm: React.FC<OrderFormProps> = ({ asset }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orderType, setOrderType] = useState("market");
  
  // Form schema for validation
  const formSchema = z.object({
    amount: z.string()
      .min(1, "Amount is required")
      .refine((val) => !isNaN(parseFloat(val)), {
        message: "Amount must be a number",
      })
      .refine((val) => parseFloat(val) > 0, {
        message: "Amount must be greater than 0",
      })
      .refine((val) => parseFloat(val) <= parseFloat(user?.balance || "0"), {
        message: "Insufficient balance",
      }),
    direction: z.enum(["buy", "sell"]),
    orderType: z.enum(["market", "limit"]),
    limitPrice: z.string().optional(),
  })
  // Add conditional validation for limit orders
  .refine((data) => {
    if (data.orderType === "limit" && (!data.limitPrice || isNaN(parseFloat(data.limitPrice || "")))) {
      return false;
    }
    return true;
  }, {
    message: "Limit price is required for limit orders",
    path: ["limitPrice"],
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      direction: "buy",
      orderType: "market",
      limitPrice: "",
    },
  });
  
  // Trade execution mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const payload = {
        userId: user?.id,
        assetId: asset.id,
        assetSymbol: asset.symbol,
        amount: values.amount,
        price: values.orderType === "market" ? asset.price : values.limitPrice,
        type: values.orderType,
        direction: values.direction,
        status: values.orderType === "market" ? "completed" : "pending",
      };
      
      return await apiRequest("POST", "/api/trades", payload);
    },
    onSuccess: () => {
      toast({
        title: "Order executed",
        description: "Your order has been successfully placed.",
      });
      
      form.reset({
        amount: "",
        direction: "buy",
        orderType: "market",
        limitPrice: "",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to place order",
        description: "Please try again later or contact support if the issue persists.",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values);
  };
  
  // Calculate potential profit/loss
  const calculatePotentialReturn = () => {
    const amount = parseFloat(form.getValues("amount") || "0");
    const direction = form.getValues("direction");
    const price = parseFloat(asset.price);
    
    if (amount <= 0 || isNaN(amount)) return "$0.00";
    
    const estimatedChange = direction === "buy" 
      ? (amount * 0.05) // Estimated 5% profit for buy
      : (amount * 0.03); // Estimated 3% profit for sell
    
    return `$${estimatedChange.toFixed(2)}`;
  };
  
  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={field.value === "buy" ? "default" : "outline"}
                      className={field.value === "buy" ? "bg-success hover:bg-success/90" : ""}
                      onClick={() => form.setValue("direction", "buy")}
                    >
                      Buy
                    </Button>
                    <Button
                      type="button"
                      variant={field.value === "sell" ? "default" : "outline"}
                      className={field.value === "sell" ? "bg-destructive hover:bg-destructive/90" : ""}
                      onClick={() => form.setValue("direction", "sell")}
                    >
                      Sell
                    </Button>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Type</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setOrderType(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-neutral-800 border-neutral-700">
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-neutral-800 border-neutral-700">
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === "market" 
                      ? "Execute immediately at current market price"
                      : "Execute only when the price reaches your specified limit"}
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {orderType === "limit" && (
              <FormField
                control={form.control}
                name="limitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                        <Input
                          placeholder="0.00"
                          className="bg-neutral-800 border-neutral-700 pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to invest</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">$</span>
                      <Input
                        placeholder="0.00"
                        className="bg-neutral-800 border-neutral-700 pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Available balance: ${parseFloat(user?.balance || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="py-2 border-t border-neutral-700 space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Current {asset.symbol} Price</span>
                <span>${parseFloat(asset.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: asset.type === 'crypto' ? 6 : 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Fee</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Potential Return (est.)</span>
                <span className="text-success">{calculatePotentialReturn()}</span>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className={`w-full ${
                form.getValues("direction") === "buy" 
                  ? "bg-success hover:bg-success/90" 
                  : "bg-destructive hover:bg-destructive/90"
              }`}
              disabled={isPending}
            >
              {isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `${form.getValues("direction") === "buy" ? "Buy" : "Sell"} ${asset.symbol}`
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default OrderForm;
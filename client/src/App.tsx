import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Markets from "@/pages/Markets";
import CopyTradingPage from "@/pages/CopyTradingPage";
import InvestmentPlansPage from "@/pages/InvestmentPlansPage";
import Deposit from "@/pages/Deposit";
import Withdraw from "@/pages/Withdraw";
import KycVerification from "@/pages/KycVerification";
import OrderExecution from "@/pages/OrderExecution";
import Profile from "@/pages/Profile";
import Transactions from "@/pages/Transactions";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth, AuthProvider } from "./context/AuthContext";
import { lazy } from 'react';

function Router() {
  const { user } = useAuth();

  if (!user) {
    // Simple login form while the user is not authenticated
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <Header />
        <div className="p-4 lg:p-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/markets" component={Markets} />
            <Route path="/copy-trading" component={CopyTradingPage} />
            <Route path="/investments" component={InvestmentPlansPage} />
            <Route path="/deposit" component={Deposit} />
            <Route path="/withdraw" component={Withdraw} />
            <Route path="/profile" component={Profile} />
            <Route path="/kyc-verification" component={KycVerification} />
            <Route path="/admin" component={lazy(() => import("./pages/AdminDashboard"))} />
            <Route component={NotFound} />
          </Switch>
        </div>
        <Footer />
      </main>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    login(username, password);
  };

  return (
    <div className="bg-neutral-800 p-8 rounded-lg shadow-lg w-full max-w-md">
      <div className="flex items-center justify-center mb-6">
        <span className="text-primary text-3xl mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
            <polyline points="16 7 22 7 22 13"></polyline>
          </svg>
        </span>
        <h1 className="text-2xl font-bold text-white">EliteStock</h1>
      </div>
      <h2 className="text-xl font-semibold mb-6 text-center">Log in to your account</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            defaultValue="demo"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            className="w-full p-2 bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            defaultValue="password"
            required
          />
        </div>
        <button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90 py-2 rounded-md text-white font-medium"
        >
          Log In
        </button>
      </form>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>Use demo/password to log in</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
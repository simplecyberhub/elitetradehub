
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
import { lazy, Suspense } from 'react';

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

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
        <p>Use demo/password to log in or admin/admin123 for admin access</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-900">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
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
            <Route path="/transactions" component={Transactions} />
            <Route path="/admin">
              {() => {
                if (user?.role === 'admin') {
                  return (
                    <Suspense fallback={
                      <div className="flex justify-center py-12">
                        <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    }>
                      <AdminDashboard />
                    </Suspense>
                  );
                } else {
                  return <Dashboard />;
                }
              }}
            </Route>
            <Route component={NotFound} />
          </Switch>
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

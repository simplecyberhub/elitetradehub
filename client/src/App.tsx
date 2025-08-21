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
import { lazy, Suspense, useState } from 'react';

const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

function LoginForm() {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (isRegistering) {
      const email = formData.get("email") as string;
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;
      register(username, password, email, firstName, lastName);
    } else {
      login(username, password);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-800 rounded-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">📈 EliteStock</h2>
        <p className="text-neutral-400">
          {isRegistering ? "Create your account" : "Log in to your account"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-neutral-200 mb-1">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your username"
          />
        </div>

        {isRegistering && (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-neutral-200 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="First name"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-neutral-200 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-neutral-200 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-md text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors font-medium"
        >
          {isRegistering ? "Register" : "Log In"}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          {isRegistering
            ? "Already have an account? Log in"
            : "Don't have an account? Register"}
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-neutral-400">
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
            <Route path="/kyc" component={KycVerification} />
            <Route path="/order/:id" component={OrderExecution} />
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
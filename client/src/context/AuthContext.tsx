import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  balance: string;
  kycStatus: string;
  role: string;
  avatar?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check authentication status on initial load
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("GET", "/api/auth/me");
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      // User is not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const userData = await response.json();

      // Session is now handled by server-side cookies
      setUser(userData);

      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}!`,
      });
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: "Invalid username or password. Please try again.",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      // Still clear user state even if server logout fails
      setUser(null);
    }
  };

  const register = async (username: string, password: string, email: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          email,
          fullName: `${firstName} ${lastName}`,
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        toast({
          title: "Registration successful",
          description: "Welcome to EliteStock!",
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Registration failed",
          description: errorData.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration failed:", error);
      toast({
        title: "Registration failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;

    try {
      const response = await apiRequest("PATCH", `/api/user/${user.id}`, userData);
      const updatedUserData = await response.json();

      // Update user in state only (session handles persistence)
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
      });
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
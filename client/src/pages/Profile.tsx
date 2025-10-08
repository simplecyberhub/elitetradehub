import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/context/AuthContext";
import ProfileForm from "@/components/forms/ProfileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Profile = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // User preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsAlerts: false,
    priceAlerts: true,
    tradingActivity: true,
    darkMode: true,
    displayCurrency: 'USD'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);
  
  // Save preference changes
  const handlePreferenceChange = (key: string, value: boolean | string) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    
    // Apply dark mode immediately
    if (key === 'darkMode') {
      document.documentElement.classList.toggle('dark', value as boolean);
    }
    
    toast({
      title: "Preference Updated",
      description: `${key.replace(/([A-Z])/g, ' $1').trim()} has been updated successfully.`
    });
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match"
      });
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordDialog(false);
      } else {
        const error = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to change password"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password"
      });
    }
  };
  
  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout",
      });
    }
  };
  
  return (
    <>
      <Helmet>
        <title>My Profile | EliteStock Trading Platform</title>
        <meta name="description" content="Manage your profile settings and account information on EliteStock Trading Platform." />
      </Helmet>
      
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          <p className="text-neutral-400">Manage your account settings and information</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Summary Card */}
          <div className="bg-neutral-800 rounded-lg p-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-xl">
                  {user ? getInitials(user.fullName) : "U"}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{user?.fullName}</h2>
              <p className="text-neutral-400">{user?.email}</p>
              
              <div className="mt-4 w-full">
                <div className="flex justify-between py-2 border-b border-neutral-700">
                  <span className="text-neutral-400">Account Balance</span>
                  <span className="font-semibold">${parseFloat(user?.balance || "0").toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-700">
                  <span className="text-neutral-400">Account ID</span>
                  <span className="font-mono text-sm">{user?.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-neutral-700">
                  <span className="text-neutral-400">KYC Status</span>
                  <span className={`${
                    user?.kycStatus === "verified" 
                      ? "text-success" 
                      : user?.kycStatus === "pending" 
                        ? "text-yellow-500" 
                        : "text-destructive"
                  }`}>
                    {user?.kycStatus === "verified" 
                      ? "Verified" 
                      : user?.kycStatus === "pending" 
                        ? "Pending" 
                        : "Unverified"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-400">Member Since</span>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-700 rounded-lg p-4">
              <h3 className="font-medium mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href="/deposit" 
                  className="bg-primary text-white rounded-md py-2 text-center text-sm hover:bg-primary/90 transition-colors"
                >
                  Deposit Funds
                </a>
                <a 
                  href="/withdraw" 
                  className="bg-neutral-900 text-white rounded-md py-2 text-center text-sm hover:bg-neutral-800 transition-colors"
                >
                  Withdraw Funds
                </a>
                <a 
                  href="/transactions" 
                  className="bg-neutral-900 text-white rounded-md py-2 text-center text-sm hover:bg-neutral-800 transition-colors"
                >
                  Transactions
                </a>
                {user?.kycStatus !== "verified" && (
                  <a 
                    href="/kyc" 
                    className="bg-neutral-900 text-white rounded-md py-2 text-center text-sm hover:bg-neutral-800 transition-colors"
                  >
                    Verify Identity
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Profile Settings */}
          <div className="lg:col-span-2 bg-neutral-800 rounded-lg p-6">
            <Tabs defaultValue="account">
              <TabsList className="mb-6">
                <TabsTrigger value="account">Account Settings</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <ProfileForm />
              </TabsContent>
              
              <TabsContent value="preferences">
                <Card className="border-neutral-700 bg-neutral-900">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-neutral-400">Receive updates and alerts via email</p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.emailNotifications}
                              onChange={(e) => handlePreferenceChange('emailNotifications', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">SMS Alerts</h4>
                          <p className="text-sm text-neutral-400">Receive important alerts via SMS</p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.smsAlerts}
                              onChange={(e) => handlePreferenceChange('smsAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Price Alerts</h4>
                          <p className="text-sm text-neutral-400">Notifications for significant price changes</p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.priceAlerts}
                              onChange={(e) => handlePreferenceChange('priceAlerts', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Trading Activity</h4>
                          <p className="text-sm text-neutral-400">Alerts for completed trades and orders</p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.tradingActivity}
                              onChange={(e) => handlePreferenceChange('tradingActivity', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-neutral-700 bg-neutral-900 mt-6">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Display Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Dark Mode</h4>
                          <p className="text-sm text-neutral-400">Use dark theme for all screens</p>
                        </div>
                        <div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={preferences.darkMode}
                              onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Display Currency</h4>
                          <p className="text-sm text-neutral-400">Currency used for displaying prices</p>
                        </div>
                        <div>
                          <select 
                            className="bg-neutral-800 border border-neutral-700 text-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
                            value={preferences.displayCurrency}
                            onChange={(e) => handlePreferenceChange('displayCurrency', e.target.value)}
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="JPY">JPY</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="security">
                <Card className="border-neutral-700 bg-neutral-900">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Two-Factor Authentication</h4>
                        <p className="text-sm text-neutral-400 mb-3">Add an extra layer of security to your account.</p>
                        <button className="bg-primary text-white rounded-md px-4 py-2 text-sm hover:bg-primary/90 transition-colors">
                          Enable 2FA
                        </button>
                      </div>
                      
                      <div className="border-t border-neutral-700 pt-4">
                        <h4 className="font-medium mb-2">Login Activity</h4>
                        <p className="text-sm text-neutral-400 mb-3">Monitor and control your active sessions.</p>
                        <div className="bg-neutral-800 rounded-md p-3 mb-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Current Session</p>
                              <p className="text-xs text-neutral-400">Web Browser - {navigator.userAgent.split(') ')[0]})</p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-success/20 text-success">
                              Active
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="text-destructive text-sm hover:underline">
                            Log Out All Other Devices
                          </button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleLogout}
                          >
                            Logout
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border-t border-neutral-700 pt-4">
                        <h4 className="font-medium mb-2">Change Password</h4>
                        <p className="text-sm text-neutral-400 mb-3">Update your password regularly to keep your account secure.</p>
                        {!showPasswordDialog ? (
                          <button 
                            onClick={() => setShowPasswordDialog(true)}
                            className="bg-neutral-700 text-white rounded-md px-4 py-2 text-sm hover:bg-neutral-600 transition-colors"
                          >
                            Change Password
                          </button>
                        ) : (
                          <div className="space-y-3 mt-3">
                            <div>
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input
                                id="currentPassword"
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div>
                              <Label htmlFor="confirmPassword">Confirm New Password</Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                className="bg-neutral-800 border-neutral-700"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handlePasswordChange} size="sm">
                                Update Password
                              </Button>
                              <Button 
                                onClick={() => {
                                  setShowPasswordDialog(false);
                                  setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                }}
                                variant="outline" 
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
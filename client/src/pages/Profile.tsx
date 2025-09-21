import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Shield, Bell, Eye, EyeOff, Smartphone, LogOut, Calendar, MapPin, Monitor } from "lucide-react";

interface UserPreferences {
  emailNotifications: boolean;
  smsAlerts: boolean;
  priceAlerts: boolean;
  tradingActivity: boolean;
  darkMode: boolean;
  displayCurrency: string;
}

interface ActiveSession {
  id: string;
  deviceInfo: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'app' | 'sms' | 'email';
  loginNotifications: boolean;
  sessionTimeout: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [profileData, setProfileData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    city: user?.city || "",
    country: user?.country || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    twoFactorMethod: 'app',
    loginNotifications: true,
    sessionTimeout: 60,
  });

  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsAlerts: false,
    priceAlerts: true,
    tradingActivity: true,
    darkMode: false,
    displayCurrency: 'USD'
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState({
    profile: false,
    password: false,
    preferences: false,
    security: false,
    sessions: false,
  });

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([
    {
      id: 'current',
      deviceInfo: 'Chrome on Windows',
      location: 'New York, US',
      lastActive: 'Current session',
      current: true,
    },
  ]);

  const [show2FASetup, setShow2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');


  // Load user preferences on mount
  useEffect(() => {
    if (user?.id) {
      loadUserPreferences();
      loadSecuritySettings();
      loadActiveSessions();
    }
  }, [user?.id]);

  // Apply dark mode preference to document
  useEffect(() => {
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences.darkMode]);

  const loadUserPreferences = async () => {
    try {
      const response = await apiRequest("GET", `/api/user/${user?.id}/preferences`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(prevPrefs => ({ ...prevPrefs, ...data }));
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const loadSecuritySettings = async () => {
    try {
      const response = await apiRequest("GET", `/api/user/${user?.id}/security`);
      if (response.ok) {
        const data = await response.json();
        setSecuritySettings(data);
      }
    } catch (error) {
      console.error("Failed to load security settings:", error);
    }
  };

  const loadActiveSessions = async () => {
    try {
      const response = await apiRequest("GET", `/api/user/${user?.id}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setActiveSessions(data);
      }
    } catch (error) {
      console.error("Failed to load active sessions:", error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(prev => ({ ...prev, profile: true }));

    try {
      const response = await apiRequest("PATCH", `/api/user/${user.id}`, profileData);

      if (response.ok) {
        const updatedUser = await response.json();
        await updateUser(updatedUser); // Assuming updateUser is from useAuth context

        toast({
          title: "Profile Updated",
          description: "Your profile information has been updated successfully.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match"
      });
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all password fields"
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await apiRequest("POST", `/api/user/${user?.id}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Password changed successfully"
        });
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || "Failed to change password"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change password"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const setup2FA = async () => {
    try {
      const response = await apiRequest("POST", `/api/user/${user?.id}/2fa/setup`);

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCode);
        setSecret(data.secret);
        setShow2FASetup(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to setup 2FA"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to setup 2FA"
      });
    }
  };

  const verify2FA = async () => {
    try {
      const response = await apiRequest("POST", `/api/user/${user?.id}/2fa/verify`, {
        code: verificationCode
      });

      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: true }));
        setShow2FASetup(false);
        setVerificationCode('');
        toast({
          title: "Success",
          description: "Two-factor authentication enabled successfully"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid verification code"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify 2FA code"
      });
    }
  };

  const disable2FA = async () => {
    try {
      const response = await apiRequest("POST", `/api/user/${user?.id}/2fa/disable`);

      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: false }));
        toast({
          title: "Success",
          description: "Two-factor authentication disabled"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to disable 2FA"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to disable 2FA"
      });
    }
  };

  const logoutAllSessions = async () => {
    try {
      const response = await apiRequest("DELETE", `/api/user/${user?.id}/sessions`);

      if (response.ok) {
        toast({
          title: "Success",
          description: "All other sessions have been logged out"
        });
        // Redirect to login since current session is also destroyed
        window.location.href = '/';
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to logout sessions"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to logout sessions"
      });
    }
  };

  const updateSecuritySettings = async (updates: Partial<typeof securitySettings>) => {
    try {
      const response = await apiRequest("PATCH", `/api/user/${user?.id}/security`, updates);

      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, ...updates }));
        toast({
          title: "Success",
          description: "Security settings updated"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update security settings"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update security settings"
      });
    }
  };

  const handlePreferencesUpdate = async (newPreferences: Partial<UserPreferences>) => {
    if (!user?.id) return;

    const updatedPreferences = { ...preferences, ...newPreferences };
    setPreferences(updatedPreferences);

    setLoading(prev => ({ ...prev, preferences: true }));

    try {
      const response = await apiRequest("PATCH", `/api/user/${user.id}/preferences`, updatedPreferences);

      if (response.ok) {
        toast({
          title: "Preferences Updated",
          description: "Your preferences have been saved successfully.",
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Preferences update error:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update preferences",
      });
      // Revert changes on error
      setPreferences(preferences);
    } finally {
      setLoading(prev => ({ ...prev, preferences: false }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const logoutSession = async (sessionId: string) => {
    try {
      setLoading(prev => ({ ...prev, sessions: true }));

      if (sessionId === 'current') {
        // Logout current session
        await logout();
        return;
      }

      const response = await apiRequest("DELETE", `/api/user/${user?.id}/sessions/${sessionId}`);
      if (response.ok) {
        setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
        toast({
          title: "Session Terminated",
          description: "The session has been successfully logged out.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: "Failed to logout session. Please try again.",
      });
    } finally {
      setLoading(prev => ({ ...prev, sessions: false }));
    }
  };


  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>Please log in to view your profile.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center space-x-2">
        <User className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profileData.country}
                      onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="Enter your country"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={loading.profile}>
                  {loading.profile ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Password Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? "Changing Password..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Two-Factor Authentication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable 2FA</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={securitySettings.twoFactorEnabled ? 'default' : 'secondary'}>
                    {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {securitySettings.twoFactorEnabled ? (
                    <Button variant="destructive" size="sm" onClick={disable2FA} disabled={loading.security}>
                      Disable
                    </Button>
                  ) : (
                    <Button size="sm" onClick={setup2FA} disabled={loading.security}>
                      Enable
                    </Button>
                  )}
                </div>
              </div>

              {show2FASetup && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div className="text-center">
                    <img src={qrCodeUrl} alt="QR Code" className="mx-auto mb-4 w-48 h-48" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan this QR code with your authenticator app
                    </p>
                    <p className="text-xs font-mono bg-muted p-2 rounded max-w-full overflow-x-auto">
                      {secret}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="verificationCode">Enter verification code</Label>
                    <Input
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={verify2FA} disabled={loading.security || verificationCode.length !== 6}>
                      Verify & Enable
                    </Button>
                    <Button variant="outline" onClick={() => setShow2FASetup(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Login Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone logs into your account
                  </p>
                </div>
                <Switch
                  checked={securitySettings.loginNotifications}
                  onCheckedChange={(checked) => updateSecuritySettings({ loginNotifications: checked })}
                  disabled={loading.security}
                />
              </div>

              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <Select
                  value={securitySettings.sessionTimeout.toString()}
                  onValueChange={(value) => updateSecuritySettings({ sessionTimeout: parseInt(value) })}
                  disabled={loading.security}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5" />
                  <span>Active Sessions</span>
                </div>
                <Button variant="destructive" size="sm" onClick={logoutAllSessions} disabled={loading.sessions}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4" />
                          <span>{session.deviceInfo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span>{session.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{session.lastActive}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.current ? 'default' : 'secondary'}>
                          {session.current ? 'Current' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => logoutSession(session.id)}
                          disabled={loading.sessions}
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          {session.current ? 'Logout' : 'Terminate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle between light and dark theme
                    </p>
                  </div>
                  <Switch
                    checked={preferences.darkMode}
                    onCheckedChange={(checked) => handlePreferencesUpdate({ darkMode: checked })}
                    disabled={loading.preferences}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Display Currency</Label>
                  <Select
                    value={preferences.displayCurrency}
                    onValueChange={(value) => handlePreferencesUpdate({ displayCurrency: value })}
                    disabled={loading.preferences}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </h3>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferencesUpdate({ emailNotifications: checked })}
                    disabled={loading.preferences}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts via SMS
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsAlerts}
                    onCheckedChange={(checked) => handlePreferencesUpdate({ smsAlerts: checked })}
                    disabled={loading.preferences}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Price Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified of price changes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.priceAlerts}
                    onCheckedChange={(checked) => handlePreferencesUpdate({ priceAlerts: checked })}
                    disabled={loading.preferences}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Trading Activity</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for trading activities
                    </p>
                  </div>
                  <Switch
                    checked={preferences.tradingActivity}
                    onCheckedChange={(checked) => handlePreferencesUpdate({ tradingActivity: checked })}
                    disabled={loading.preferences}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={setShow2FASetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app and enter the verification code.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                  <p className="text-sm text-muted-foreground">Loading QR Code...</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FASetup(false)}>
              Cancel
            </Button>
            <Button
              onClick={verify2FA}
              disabled={loading.security || verificationCode.length !== 6}
            >
              {loading.security ? "Verifying..." : "Verify & Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
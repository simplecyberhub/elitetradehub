import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, TrendingUp, DollarSign, CheckCircle, XCircle, Settings, RefreshCw, Plus, Edit, Trash2, Download, Upload, AlertTriangle, PlayCircle, Mail, Eye, FileImage } from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalTrades: number;
  totalInvestments: number;
  pendingKyc: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  balance: string;
  kycStatus: string;
  role: string;
  createdAt: string;
  suspended?: boolean;
}

interface KycDocument {
  id: number;
  userId: number;
  documentType: string;
  documentNumber: string;
  verificationStatus: string;
  rejectionReason?: string;
  submittedAt: string;
  user: User;
}

interface Trade {
  id: number;
  userId: number;
  assetId: number;
  type: string;
  amount: string;
  price: string;
  status: string;
  createdAt: string;
  user: User;
  asset: any;
}

interface Transaction {
  id: number;
  userId: number;
  type: string;
  amount: string;
  status: string;
  paymentMethod?: string;
  paymentProof?: string;
  adminNotes?: string;
  createdAt: string;
  user: User;
}

interface Asset {
  id: number;
  symbol: string;
  name: string;
  type: string;
  currentPrice: string;
  isActive: boolean;
  price?: string;
}

interface InvestmentPlan {
  id: number;
  name: string;
  description: string;
  minAmount: string;
  maxAmount: string;
  expectedReturn: string;
  duration: string;
  isActive: boolean;
  roiPercentage?: string;
  lockPeriodDays?: string;
  status?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceUpdate, setBalanceUpdate] = useState({ userId: 0, amount: '', type: 'add' });
  const [userDetailsDialog, setUserDetailsDialog] = useState(false);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [searchUser, setSearchUser] = useState('');
  const [newAsset, setNewAsset] = useState<Asset>({ id: 0, symbol: '', name: '', type: 'crypto', currentPrice: '', isActive: true });
  const [editAssetData, setEditAssetData] = useState<Asset>({ id: 0, symbol: '', name: '', type: 'crypto', currentPrice: '', isActive: true });
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionAction, setTransactionAction] = useState({ action: '', notes: '' });
  const [newInvestmentPlan, setNewInvestmentPlan] = useState<InvestmentPlan>({
    id: 0, name: '', description: '', minAmount: '', maxAmount: '', expectedReturn: '', duration: '', isActive: true
  });
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [editPlanData, setEditPlanData] = useState<InvestmentPlan>({
    id: 0, name: '', description: '', minAmount: '', maxAmount: '', expectedReturn: '', duration: '', isActive: true,
    roiPercentage: '', lockPeriodDays: ''
  });
  const [showNewAssetDialog, setShowNewAssetDialog] = useState(false);
  const [showNewInvestmentPlanDialog, setShowNewInvestmentPlanDialog] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);
  const [kycDocuments, setKycDocuments] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>({});
  const [selectedKycDocument, setSelectedKycDocument] = useState<any>(null);
  const [kycViewDialog, setKycViewDialog] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>({
    trading: {
      trading_min_amount: '10.00',
      trading_max_amount: '10000.00',
      trading_fee_percentage: '0.1'
    },
    email: {
      smtp_host: 'smtp.gmail.com',
      smtp_port: '587',
      from_email: 'noreply@elitestock.com'
    },
    platform: {
      platform_name: 'EliteStock Trading',
      company_name: 'EliteStock Inc.',
      support_email: 'support@elitestock.com',
      company_address: '',
      platform_logo_url: ''
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(false);


  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">Access denied. Admin privileges required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      // Helper function to safely fetch data
      const safeFetch = async (url: string, setter: (data: any) => void, fallback: any = []) => {
        try {
          const response = await apiRequest("GET", url, undefined, {
            'X-User-Id': user.id.toString(),
            'X-User-Role': user.role
          });

          if (response.ok) {
            const data = await response.json();
            setter(data);
          } else {
            console.warn(`Failed to fetch ${url}: ${response.status}`);
            setter(fallback);
          }
        } catch (error) {
          console.error(`Error fetching ${url}:`, error);
          setter(fallback);
        }
      };

      // Fetch all data in parallel
      await Promise.all([
        safeFetch("/api/admin/stats", setStats, { totalUsers: 0, totalTrades: 0, totalInvestments: 0, pendingKyc: 0 }),
        safeFetch("/api/admin/users", setUsers, []),
        safeFetch("/api/admin/kyc-documents", setKycDocuments, []),
        safeFetch("/api/admin/trades", setTrades, []),
        safeFetch("/api/admin/transactions", setTransactions, []),
        safeFetch("/api/admin/assets", setAssets, []),
        safeFetch("/api/admin/investment-plans", setInvestmentPlans, []),
        safeFetch("/api/admin/investments", setInvestments, []),
        safeFetch("/api/admin/settings", (data) => {
          setSettings(data);
          setSystemSettings(data);
        }, {}),
      ]);

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load some admin data"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, { role: newRole }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

      toast({
        title: "Success",
        description: "User role updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role"
      });
    }
  };

  const updateKycStatus = async (docId: number, status: string, rejectionReason?: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/kyc-documents/${docId}`, {
        verificationStatus: status,
        rejectionReason
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      setKycDocuments(kycDocuments.map(doc =>
        doc.id === docId
          ? { ...doc, verificationStatus: status, rejectionReason }
          : doc
      ));

      toast({
        title: "Success",
        description: `KYC document ${status}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update KYC status"
      });
    }
  };

  const viewKycDocument = (document: any) => {
    setSelectedKycDocument(document);
    setKycViewDialog(true);
  };

  const getMethodDisplay = (method: string) => {
    const methodMap: Record<string, string> = {
      'credit_card': 'Credit Card',
      'bank_transfer': 'Bank Transfer',
      'crypto': 'Cryptocurrency',
      'platform': 'Platform Balance',
      'balance': 'Account Balance'
    };
    return methodMap[method] || method || 'Not Specified';
  };

  const updateUserBalance = async (userId: number, amount: string, type: string) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, {
        balanceAdjustment: { amount: parseFloat(amount), type }
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();

      toast({
        title: "Success",
        description: `User balance ${type === 'add' ? 'increased' : 'decreased'} by $${amount}`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user balance"
      });
    }
  };

  const reviewTransaction = async (transactionId: number, action: string, notes: string) => {
    try {
      await apiRequest("POST", `/api/admin/transactions/${transactionId}/review`, {
        action,
        adminNotes: notes
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();

      toast({
        title: "Success",
        description: `Transaction ${action}d successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to review transaction"
      });
    }
  };

  const suspendUser = async (userId: number, suspend: boolean) => {
    try {
      await apiRequest("PATCH", `/api/admin/users/${userId}`, {
        suspended: suspend
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      setUsers(users.map(u => u.id === userId ? { ...u, suspended: suspend } : u));

      toast({
        title: "Success",
        description: `User ${suspend ? 'suspended' : 'unsuspended'} successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user status"
      });
    }
  };

  const viewUserDetails = (user: User) => {
    setSelectedUser(user);
    setUserDetailsDialog(true);
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    const filteredUsers = getFilteredUsers();
    const allSelected = filteredUsers.every(u => selectedUsers.includes(u.id));
    if (allSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const performBulkAction = async () => {
    try {
      await apiRequest("POST", `/api/admin/users/bulk-action`, {
        userIds: selectedUsers,
        action: bulkAction
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();
      setSelectedUsers([]);
      setBulkActionDialog(false);
      setBulkAction('');

      toast({
        title: "Success",
        description: `Bulk action performed on ${selectedUsers.length} users`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to perform bulk action"
      });
    }
  };

  const getFilteredUsers = () => {
    return users.filter(u => {
      const matchesFilter = userFilter === 'all' || 
        (userFilter === 'active' && !u.suspended) ||
        (userFilter === 'suspended' && u.suspended) ||
        (userFilter === 'unverified' && u.kycStatus === 'unverified') ||
        (userFilter === 'verified' && u.kycStatus === 'verified');
      
      const matchesSearch = !searchUser || 
        u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchUser.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  };

  const resetUserPassword = async (userId: number) => {
    try {
      const newPassword = prompt("Enter new password for user:");
      if (!newPassword) return;

      await apiRequest("PATCH", `/api/admin/users/${userId}`, {
        password: newPassword
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      toast({
        title: "Success",
        description: "User password reset successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset password"
      });
    }
  };

  const exportData = async (type: string) => {
    try {
      const response = await apiRequest("GET", `/api/admin/export/${type}`, undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${type} data exported successfully`
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export data"
      });
    }
  };

  const addAsset = async () => {
    try {
      await apiRequest("POST", "/api/admin/assets", newAsset, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();
      setNewAsset({ id: 0, symbol: '', name: '', type: 'crypto', currentPrice: '', isActive: true });
      setShowNewAssetDialog(false);

      toast({
        title: "Success",
        description: "Asset added successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add asset"
      });
    }
  };

  const updateAsset = async () => {
    try {
      await apiRequest("PATCH", `/api/admin/assets/${editAssetData.id}`, editAssetData, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();
      setEditingAsset(null);

      toast({
        title: "Success",
        description: "Asset updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update asset"
      });
    }
  };

  const deleteAsset = async (assetId: number) => {
    try {
      await apiRequest("DELETE", `/api/admin/assets/${assetId}`, undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();

      toast({
        title: "Success",
        description: "Asset deleted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete asset"
      });
    }
  };

  const startEditAsset = (asset: Asset) => {
    setEditAssetData(asset);
    setEditingAsset(asset);
  };

  const addInvestmentPlan = async () => {
    try {
      await apiRequest("POST", "/api/admin/investment-plans", newInvestmentPlan, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();
      setNewInvestmentPlan({ id: 0, name: '', description: '', minAmount: '', maxAmount: '', expectedReturn: '', duration: '', isActive: true });
      setShowNewInvestmentPlanDialog(false);

      toast({
        title: "Success",
        description: "Investment plan added successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add investment plan"
      });
    }
  };

  const updateInvestmentPlan = async () => {
    try {
      await apiRequest("PATCH", `/api/admin/investment-plans/${editPlanData.id}`, {
        name: editPlanData.name,
        description: editPlanData.description,
        minAmount: editPlanData.minAmount,
        maxAmount: editPlanData.maxAmount,
        roiPercentage: editPlanData.roiPercentage,
        lockPeriodDays: editPlanData.lockPeriodDays,
        status: editPlanData.status,
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();
      setEditingPlan(null);

      toast({
        title: "Success",
        description: "Investment plan updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update investment plan"
      });
    }
  };

  const deleteInvestmentPlan = async (planId: number) => {
    try {
      await apiRequest("DELETE", `/api/admin/investment-plans/${planId}`, undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      await fetchAdminData();

      toast({
        title: "Success",
        description: "Investment plan deleted successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete investment plan"
      });
    }
  };

  const startEditPlan = (plan: InvestmentPlan) => {
    setEditPlanData({
      ...plan,
      roiPercentage: plan.roiPercentage || plan.expectedReturn, // Use roiPercentage if available, otherwise expectedReturn
      lockPeriodDays: plan.lockPeriodDays || plan.duration,     // Use lockPeriodDays if available, otherwise duration
      status: plan.status || (plan.isActive ? 'active' : 'inactive'), // Use status if available, otherwise derive from isActive
    });
    setEditingPlan(plan);
  };

  const saveSettings = async () => {
    try {
      setSettingsLoading(true);

      const response = await apiRequest("POST", "/api/admin/settings", systemSettings, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully"
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings"
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const resetSettingsToDefault = () => {
    setSystemSettings({
      trading: {
        trading_min_amount: '10.00',
        trading_max_amount: '10000.00',
        trading_fee_percentage: '0.1'
      },
      email: {
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        from_email: 'noreply@elitestock.com'
      }
    });

    toast({
      title: "Settings Reset",
      description: "Settings have been reset to default values"
    });
  };

  const fetchSettings = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/settings", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.warn(`Failed to fetch settings: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchKycDocuments = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/kyc", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      if (response.ok) {
        const data = await response.json();
        setKycDocuments(data);
      } else {
        console.warn(`Failed to fetch KYC documents: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch KYC documents:', error);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/system-stats", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      if (response.ok) {
        const data = await response.json();
        setSystemStats(data);
      } else {
        console.warn(`Failed to fetch system stats: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to fetch system stats:', error);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await apiRequest("PUT", `/api/admin/settings/${key}`, { value }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      fetchSettings();
      toast({ title: "Setting updated successfully" });
    } catch (error) {
      toast({ title: "Failed to update setting", variant: "destructive" });
    }
  };

  const processMaturedInvestments = async () => {
    try {
      await apiRequest("POST", `/api/admin/process-investments`, undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      fetchAdminData(); // Re-fetch all data to reflect changes
      toast({ title: "Processed matured investments successfully" });
    } catch (error) {
      toast({ title: "Failed to process investments", variant: "destructive" });
    }
  };

  const sendBulkEmail = async () => {
    try {
      await apiRequest("POST", `/api/admin/bulk-email`, {
        subject: "Platform Update",
        message: "Important update from EliteStock Trading Platform"
      }, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      toast({ title: "Bulk email sent successfully" });
    } catch (error) {
      toast({ title: "Failed to send bulk email", variant: "destructive" });
    }
  };

  const backupDatabase = async () => {
    try {
      await apiRequest("POST", `/api/admin/backup`, undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      toast({ title: "Database backup initiated" });
    } catch (error) {
      toast({ title: "Failed to initiate backup", variant: "destructive" });
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvestments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingKyc}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-sm text-muted-foreground">Server Status</h3>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Online</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-sm text-muted-foreground">Database Status</h3>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Connected</span>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium text-sm text-muted-foreground">Email Service</h3>
                    <div className="flex items-center mt-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span className="text-sm">Limited</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">New user registration</p>
                      <p className="text-sm text-muted-foreground">User ID: {users.length > 0 ? users[users.length - 1]?.id : 'N/A'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">Market data updated</p>
                      <p className="text-sm text-muted-foreground">All assets synchronized</p>
                    </div>
                    <span className="text-xs text-muted-foreground">5 min ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaction Management</CardTitle>
              <div className="space-x-2">
                <Button onClick={() => exportData('transactions')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={fetchAdminData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>{transaction.user?.fullName || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'destructive'}>
                          {transaction.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>${transaction.amount}</TableCell>
                      <TableCell>{transaction.paymentMethod || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {transaction.status === 'pending' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedTransaction(transaction)}>
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Review Transaction #{transaction.id}</DialogTitle>
                                <DialogDescription>
                                  Complete transaction details and review options
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Transaction Summary */}
                                <div className="bg-muted p-4 rounded-lg">
                                  <h3 className="font-medium mb-2">Transaction Summary</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p><strong>Type:</strong> {transaction.type.toUpperCase()}</p>
                                      <p><strong>Amount:</strong> ${transaction.amount}</p>
                                      <p><strong>Status:</strong> {transaction.status}</p>
                                    </div>
                                    <div>
                                      <p><strong>Method:</strong> {transaction.paymentMethod || 'N/A'}</p>
                                      <p><strong>Date:</strong> {new Date(transaction.createdAt).toLocaleString()}</p>
                                      <p><strong>Transaction ID:</strong> {transaction.id}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* User Details */}
                                <div>
                                  <h3 className="font-medium mb-2">User Information</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p><strong>User ID:</strong> {transaction.user?.id}</p>
                                      <p><strong>Name:</strong> {transaction.user?.fullName || transaction.user?.username}</p>
                                    </div>
                                    <div>
                                      <p><strong>Email:</strong> {transaction.user?.email}</p>
                                      <p><strong>Username:</strong> {transaction.user?.username}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Details */}
                                {(transaction.paymentProof || transaction.paymentNotes || transaction.withdrawalAddress) && (
                                  <div>
                                    <h3 className="font-medium mb-2">Payment Details</h3>
                                    <div className="space-y-2">
                                      {transaction.paymentProof && (
                                        <div>
                                          <p><strong>Payment Proof:</strong></p>
                                          <a 
                                            href={transaction.paymentProof}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-2"
                                          >
                                            <FileImage className="h-4 w-4" />
                                            View Payment Proof
                                          </a>
                                        </div>
                                      )}
                                      {transaction.paymentNotes && (
                                        <p><strong>Payment Notes:</strong> {transaction.paymentNotes}</p>
                                      )}
                                      {transaction.withdrawalAddress && (
                                        <p><strong>Withdrawal Address:</strong> {transaction.withdrawalAddress}</p>
                                      )}
                                      {transaction.withdrawalDetails && (
                                        <div>
                                          <p><strong>Withdrawal Details:</strong></p>
                                          <pre className="text-sm bg-muted p-2 rounded mt-1 overflow-x-auto">
                                            {typeof transaction.withdrawalDetails === 'string' 
                                              ? transaction.withdrawalDetails 
                                              : JSON.stringify(transaction.withdrawalDetails, null, 2)}
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Admin Review Section */}
                                <div className="border-t pt-4">
                                  <h3 className="font-medium mb-4">Admin Review</h3>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="action">Action</Label>
                                      <Select value={transactionAction.action} onValueChange={(value) =>
                                        setTransactionAction(prev => ({ ...prev, action: value }))
                                      }>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="approve">Approve Transaction</SelectItem>
                                          <SelectItem value="reject">Reject Transaction</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="notes">Admin Notes</Label>
                                      <Input
                                        value={transactionAction.notes}
                                        onChange={(e) => setTransactionAction(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Enter review notes (required for rejection)..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <DialogFooter className="flex gap-2">
                                <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => reviewTransaction(transaction.id, transactionAction.action, transactionAction.notes)}
                                  disabled={!transactionAction.action || (transactionAction.action === 'reject' && !transactionAction.notes)}
                                  variant={transactionAction.action === 'approve' ? 'default' : 'destructive'}
                                >
                                  {transactionAction.action === 'approve' ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Approve Transaction
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject Transaction
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Search users..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="w-64"
                />
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="verified">KYC Verified</SelectItem>
                    <SelectItem value="unverified">KYC Unverified</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUsers.length > 0 && (
                  <Button onClick={() => setBulkActionDialog(true)} variant="outline">
                    Bulk Actions ({selectedUsers.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <input
                        type="checkbox"
                        checked={getFilteredUsers().length > 0 && getFilteredUsers().every(u => selectedUsers.includes(u.id))}
                        onChange={selectAllUsers}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>KYC Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredUsers().map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>${user.balance}</TableCell>
                      <TableCell>
                        <Badge variant={user.kycStatus === 'verified' ? 'default' : 'secondary'}>
                          {user.kycStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.suspended ? 'destructive' : 'default'}>
                          {user.suspended ? 'Suspended' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button size="sm" variant="outline" onClick={() => viewUserDetails(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {user.role !== 'admin' && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                    <DollarSign className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Adjust Balance - {user.fullName}</DialogTitle>
                                    <DialogDescription>
                                      Current balance: ${user.balance}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="amount">Amount</Label>
                                      <Input
                                        type="number"
                                        value={balanceUpdate.amount}
                                        onChange={(e) => setBalanceUpdate(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="Enter amount"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="type">Action</Label>
                                      <Select value={balanceUpdate.type} onValueChange={(value) =>
                                        setBalanceUpdate(prev => ({ ...prev, type: value }))
                                      }>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="add">Add to Balance</SelectItem>
                                          <SelectItem value="subtract">Subtract from Balance</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => updateUserBalance(user.id, balanceUpdate.amount, balanceUpdate.type)}
                                      disabled={!balanceUpdate.amount}
                                    >
                                      Update Balance
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user.id, user.role === 'user' ? 'admin' : 'user')}
                                title="Toggle Role"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={user.suspended ? 'default' : 'destructive'}
                                onClick={() => suspendUser(user.id, !user.suspended)}
                                title={user.suspended ? 'Unsuspend' : 'Suspend'}
                              >
                                {user.suspended ? <PlayCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resetUserPassword(user.id)}
                                title="Reset Password"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Investment Management</CardTitle>
              <div className="space-x-2">
                <Button onClick={() => exportData('investments')} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button onClick={fetchAdminData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Maturity Date</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>{investment.id}</TableCell>
                      <TableCell>{investment.user?.fullName || 'Unknown'}</TableCell>
                      <TableCell>{investment.plan?.name || 'Unknown'}</TableCell>
                      <TableCell>${investment.amount}</TableCell>
                      <TableCell>
                        <Badge variant={investment.status === 'active' ? 'default' : 'secondary'}>
                          {investment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{investment.maturityDate ? new Date(investment.maturityDate).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{new Date(investment.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Asset Management</CardTitle>
              <Button onClick={() => setShowNewAssetDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>{asset.id}</TableCell>
                      <TableCell>{asset.symbol}</TableCell>
                      <TableCell>{asset.name}</TableCell>
                      <TableCell>
                        <Badge>{asset.type}</Badge>
                      </TableCell>
                      <TableCell>${asset.price || asset.currentPrice}</TableCell>
                      <TableCell>
                        <Badge variant={asset.isActive ? 'default' : 'secondary'}>
                          {asset.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditAsset(asset)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteAsset(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Asset Dialog */}
          <Dialog open={showNewAssetDialog} onOpenChange={setShowNewAssetDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Asset</DialogTitle>
                <DialogDescription>
                  Create a new trading asset for the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, symbol: e.target.value }))}
                    placeholder="e.g., BTC/USD"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bitcoin"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={newAsset.type} onValueChange={(value) => setNewAsset(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currentPrice">Current Price</Label>
                  <Input
                    id="currentPrice"
                    type="number"
                    step="0.000001"
                    value={newAsset.currentPrice}
                    onChange={(e) => setNewAsset(prev => ({ ...prev, currentPrice: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewAssetDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={addAsset}>Add Asset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Asset Dialog */}
          <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Asset</DialogTitle>
                <DialogDescription>
                  Update the asset information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-symbol">Symbol</Label>
                  <Input
                    id="edit-symbol"
                    value={editAssetData.symbol}
                    onChange={(e) => setEditAssetData(prev => ({ ...prev, symbol: e.target.value }))}
                    placeholder="e.g., BTC/USD"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editAssetData.name}
                    onChange={(e) => setEditAssetData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Bitcoin"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Type</Label>
                  <Select value={editAssetData.type} onValueChange={(value) => setEditAssetData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="forex">Forex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-price">Current Price</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.000001"
                    value={editAssetData.currentPrice || editAssetData.price}
                    onChange={(e) => setEditAssetData(prev => ({ ...prev, currentPrice: e.target.value, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingAsset(null)}>
                  Cancel
                </Button>
                <Button onClick={updateAsset}>Update Asset</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Investment Plans Management</CardTitle>
              <Button onClick={() => setShowNewInvestmentPlanDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Plan
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Min Amount</TableHead>
                    <TableHead>Max Amount</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {investmentPlans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.id}</TableCell>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>${plan.minAmount}</TableCell>
                      <TableCell>{plan.maxAmount ? `$${plan.maxAmount}` : 'No limit'}</TableCell>
                      <TableCell>{plan.roiPercentage || plan.expectedReturn}%</TableCell>
                      <TableCell>{plan.lockPeriodDays ? `${plan.lockPeriodDays} days` : plan.duration}</TableCell>
                      <TableCell>
                        <Badge variant={(plan.status === 'active' || plan.isActive) ? 'default' : 'secondary'}>
                          {(plan.status === 'active' || plan.isActive) ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteInvestmentPlan(plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add Investment Plan Dialog */}
          <Dialog open={showNewInvestmentPlanDialog} onOpenChange={setShowNewInvestmentPlanDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Investment Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Plan Name"
                  value={newInvestmentPlan.name}
                  onChange={(e) => setNewInvestmentPlan(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Description"
                  value={newInvestmentPlan.description}
                  onChange={(e) => setNewInvestmentPlan(prev => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  placeholder="Min Amount"
                  type="number"
                  value={newInvestmentPlan.minAmount}
                  onChange={(e) => setNewInvestmentPlan(prev => ({ ...prev, minAmount: e.target.value }))}
                />
                <Input
                  placeholder="Max Amount"
                  type="number"
                  value={newInvestmentPlan.maxAmount}
                  onChange={(e) => setNewInvestmentPlan(prev => ({ ...prev, maxAmount: e.target.value }))}
                />
                <Input
                  placeholder="Expected Return (%)"
                  type="number"
                  value={newInvestmentPlan.expectedReturn}
                  onChange={(e) => setNewInvestmentPlan(prev => ({ ...prev, expectedReturn: e.target.value }))}
                />
                <Input
                  placeholder="Duration (e.g., 30 days, 1 month)"
                  value={newInvestmentPlan.duration}
                  onChange={(e) => setNewInvestmentPlan(prev => ({ ...prev, duration: e.target.value }))}
                />
                <Select value={newInvestmentPlan.isActive ? 'active' : 'inactive'} onValueChange={(value) => setNewInvestmentPlan(prev => ({ ...prev, isActive: value === 'active' }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={addInvestmentPlan}>Add Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Investment Plan Dialog */}
          <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Investment Plan</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Plan Name"
                  value={editPlanData.name}
                  onChange={(e) => setEditPlanData(prev => ({ ...prev, name: e.target.value }))}
                />
                <Input
                  placeholder="Description"
                  value={editPlanData.description}
                  onChange={(e) => setEditPlanData(prev => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  placeholder="Min Amount"
                  type="number"
                  value={editPlanData.minAmount}
                  onChange={(e) => setEditPlanData(prev => ({ ...prev, minAmount: e.target.value }))}
                />
                <Input
                  placeholder="Max Amount"
                  type="number"
                  value={editPlanData.maxAmount}
                  onChange={(e) => setEditPlanData(prev => ({ ...prev, maxAmount: e.target.value }))}
                />
                <Input
                  placeholder="Expected Return (%)"
                  type="number"
                  value={editPlanData.roiPercentage}
                  onChange={(e) => setEditPlanData(prev => ({ ...prev, roiPercentage: e.target.value }))}
                />
                <Input
                  placeholder="Duration (days)"
                  type="number"
                  value={editPlanData.lockPeriodDays}
                  onChange={(e) => setEditPlanData(prev => ({ ...prev, lockPeriodDays: e.target.value }))}
                />
                <Select value={editPlanData.status} onValueChange={(value) => setEditPlanData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingPlan(null)}>
                  Cancel
                </Button>
                <Button onClick={updateInvestmentPlan}>Update Plan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="kyc" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">KYC Management</h2>
            <div className="space-x-2">
              <Button onClick={fetchKycDocuments} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>KYC Documents</CardTitle>
              <CardDescription>Review and manage user verification documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycDocuments.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.userId}</TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>
                        <Badge variant={doc.verificationStatus === 'verified' ? 'default' :
                          doc.verificationStatus === 'rejected' ? 'destructive' : 'secondary'}>
                          {doc.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(doc.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="space-x-2">
                          <Button size="sm" variant="outline" onClick={() => viewKycDocument(doc)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="default" onClick={() => updateKycStatus(doc.id, 'verified')}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateKycStatus(doc.id, 'rejected')}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Platform Settings</h2>
            <div className="space-x-2">
              <Button onClick={saveSettings} disabled={settingsLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Save All Changes
              </Button>
              <Button onClick={resetSettingsToDefault} variant="outline">
                Reset Defaults
              </Button>
              <Button onClick={fetchSettings} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Tabs defaultValue="trading" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="copytrading">Copy Trading</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="trading" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Trading Limits</CardTitle>
                    <CardDescription>Configure trading parameters and limits</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Trading Amount</label>
                      <Input
                        value={systemSettings.trading?.trading_min_amount || '10.00'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, trading_min_amount: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Trading Amount</label>
                      <Input
                        value={systemSettings.trading?.trading_max_amount || '10000.00'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, trading_max_amount: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Trading Fee Percentage</label>
                      <Input
                        value={systemSettings.trading?.trading_fee_percentage || '0.1'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, trading_fee_percentage: e.target.value }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Settings</CardTitle>
                    <CardDescription>Configure market data and trading hours</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Market Data Update Interval (minutes)</label>
                      <Input
                        value={systemSettings.trading?.market_update_interval || '5'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, market_update_interval: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Auto-Execute Trades</label>
                      <Select
                        value={systemSettings.trading?.auto_execute || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, auto_execute: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Slippage Tolerance (%)</label>
                      <Input
                        value={systemSettings.trading?.slippage_tolerance || '0.5'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          trading: { ...prev.trading, slippage_tolerance: e.target.value }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>SMTP Configuration</CardTitle>
                    <CardDescription>Configure email server settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">SMTP Host</label>
                      <Input
                        value={systemSettings.email?.smtp_host || 'smtp.gmail.com'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, smtp_host: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">SMTP Port</label>
                      <Input
                        value={systemSettings.email?.smtp_port || '587'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, smtp_port: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From Email</label>
                      <Input
                        value={systemSettings.email?.from_email || 'noreply@elitestock.com'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, from_email: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From Name</label>
                      <Input
                        value={systemSettings.email?.from_name || 'EliteStock Trading'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, from_name: e.target.value }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Configure automated email settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Welcome Email</label>
                      <Select
                        value={systemSettings.email?.welcome_enabled || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, welcome_enabled: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Transaction Notifications</label>
                      <Select
                        value={systemSettings.email?.transaction_enabled || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, transaction_enabled: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">KYC Status Updates</label>
                      <Select
                        value={systemSettings.email?.kyc_enabled || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          email: { ...prev.email, kyc_enabled: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Email Templates</CardTitle>
                    <CardDescription>Customize email notification templates</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Tabs defaultValue="platform" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="platform">Platform</TabsTrigger>
                        <TabsTrigger value="welcome">Welcome</TabsTrigger>
                        <TabsTrigger value="transaction">Transaction</TabsTrigger>
                        <TabsTrigger value="kyc">KYC</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="platform" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Platform Name</label>
                          <Input
                            value={systemSettings.platform?.platform_name || 'EliteStock Trading'}
                            onChange={(e) => setSystemSettings((prev: any) => ({
                              ...prev,
                              platform: { ...prev.platform, platform_name: e.target.value }
                            }))}
                            className="bg-white dark:bg-neutral-800 border-primary focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Company Name</label>
                          <Input
                            value={systemSettings.platform?.company_name || 'EliteStock Inc.'}
                            onChange={(e) => setSystemSettings((prev: any) => ({
                              ...prev,
                              platform: { ...prev.platform, company_name: e.target.value }
                            }))}
                            className="bg-white dark:bg-neutral-800 border-primary focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Support Email</label>
                          <Input
                            value={systemSettings.platform?.support_email || 'support@elitestock.com'}
                            onChange={(e) => setSystemSettings((prev: any) => ({
                              ...prev,
                              platform: { ...prev.platform, support_email: e.target.value }
                            }))}
                            className="bg-white dark:bg-neutral-800 border-primary focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Company Address</label>
                          <textarea
                            className="w-full h-20 p-3 border border-primary rounded-md bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary"
                            value={systemSettings.platform?.company_address || ''}
                            onChange={(e) => setSystemSettings((prev: any) => ({
                              ...prev,
                              platform: { ...prev.platform, company_address: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Platform Logo URL</label>
                          <Input
                            value={systemSettings.platform?.platform_logo_url || ''}
                            onChange={(e) => setSystemSettings((prev: any) => ({
                              ...prev,
                              platform: { ...prev.platform, platform_logo_url: e.target.value }
                            }))}
                            placeholder="https://example.com/logo.png"
                            className="bg-white dark:bg-neutral-800 border-primary focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="welcome" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Welcome Email Subject</label>
                          <Input
                            value={systemSettings.templates?.welcome_subject || 'Welcome to EliteStock Trading!'}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              templates: { ...prev.templates, welcome_subject: e.target.value }
                            }))}
                            className="bg-white dark:bg-neutral-800 border-primary focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-primary">Welcome Email Content</label>
                          <textarea
                            className="w-full h-32 p-3 border border-primary rounded-md bg-white dark:bg-neutral-800 focus:ring-2 focus:ring-primary text-foreground"
                            value={systemSettings.templates?.welcome_content || 'Welcome to EliteStock Trading Platform! Your account has been created successfully.'}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              templates: { ...prev.templates, welcome_content: e.target.value }
                            }))}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="transaction" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Transaction Email Subject</label>
                          <Input
                            value={systemSettings.templates?.transaction_subject || 'Transaction Update - EliteStock'}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              templates: { ...prev.templates, transaction_subject: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Transaction Email Content</label>
                          <textarea
                            className="w-full h-32 p-3 border rounded-md"
                            value={systemSettings.templates?.transaction_content || 'Your transaction has been processed. Amount: {{amount}}, Type: {{type}}, Status: {{status}}'}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              templates: { ...prev.templates, transaction_content: e.target.value }
                            }))}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="kyc" className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">KYC Update Subject</label>
                          <Input
                            value={systemSettings.templates?.kyc_subject || 'KYC Verification Update'}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              templates: { ...prev.templates, kyc_subject: e.target.value }
                            }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">KYC Email Content</label>
                          <textarea
                            className="w-full h-32 p-3 border rounded-md"
                            value={systemSettings.templates?.kyc_content || 'Your KYC verification status has been updated to: {{status}}'}
                            onChange={(e) => setSystemSettings(prev => ({
                              ...prev,
                              templates: { ...prev.templates, kyc_content: e.target.value }
                            }))}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="copytrading" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Copy Trading Settings</CardTitle>
                    <CardDescription>Configure copy trading parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Copy Trading Enabled</label>
                      <Select
                        value={systemSettings.copytrading?.enabled || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, enabled: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Copy Amount</label>
                      <Input
                        value={systemSettings.copytrading?.min_copy_amount || '10.00'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, min_copy_amount: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Copy Percentage</label>
                      <Input
                        value={systemSettings.copytrading?.max_copy_percentage || '100'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, max_copy_percentage: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Copy Delay (seconds)</label>
                      <Input
                        value={systemSettings.copytrading?.copy_delay || '0'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, copy_delay: e.target.value }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trader Management</CardTitle>
                    <CardDescription>Configure trader verification and requirements</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Auto-Approve Traders</label>
                      <Select
                        value={systemSettings.copytrading?.auto_approve_traders || 'disabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, auto_approve_traders: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Win Rate Required (%)</label>
                      <Input
                        value={systemSettings.copytrading?.min_win_rate || '60'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, min_win_rate: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Minimum Trades for Verification</label>
                      <Input
                        value={systemSettings.copytrading?.min_trades || '10'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          copytrading: { ...prev.copytrading, min_trades: e.target.value }
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure platform security parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Session Timeout (minutes)</label>
                      <Input
                        value={systemSettings.security?.session_timeout || '60'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, session_timeout: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Max Login Attempts</label>
                      <Input
                        value={systemSettings.security?.max_login_attempts || '5'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, max_login_attempts: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Account Lockout Duration (minutes)</label>
                      <Input
                        value={systemSettings.security?.lockout_duration || '30'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, lockout_duration: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Require KYC for Trading</label>
                      <Select
                        value={systemSettings.security?.require_kyc || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, require_kyc: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>API & Rate Limiting</CardTitle>
                    <CardDescription>Configure API access and rate limiting</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">API Rate Limit (requests/minute)</label>
                      <Input
                        value={systemSettings.security?.api_rate_limit || '100'}
                        onChange={(e) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, api_rate_limit: e.target.value }
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Enable API Access</label>
                      <Select
                        value={systemSettings.security?.api_enabled || 'enabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, api_enabled: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maintenance Mode</label>
                      <Select
                        value={systemSettings.security?.maintenance_mode || 'disabled'}
                        onValueChange={(value) => setSystemSettings(prev => ({
                          ...prev,
                          security: { ...prev.security, maintenance_mode: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enabled">Enabled</SelectItem>
                          <SelectItem value="disabled">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">System Management</h2>
            <div className="space-x-2">
              <Button onClick={processMaturedInvestments} variant="outline">
                <PlayCircle className="w-4 h-4 mr-2" />
                Process Investments
              </Button>
              <Button onClick={fetchSystemStats} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Database</span>
                    <Badge variant="default">Online</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Market Data</span>
                    <Badge variant="default">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Email Service</span>
                    <Badge variant="destructive">Issues</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Plans</span>
                    <span>{investmentPlans.filter(p => p.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Invested</span>
                    <span>${systemStats.totalInvested || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Matured Today</span>
                    <span>{systemStats.maturedToday || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline" onClick={sendBulkEmail}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Bulk Email
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => exportData('users')}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Reports
                  </Button>
                  <Button className="w-full" variant="outline" onClick={backupDatabase}>
                    <Settings className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* KYC Document View Dialog */}
      <Dialog open={kycViewDialog} onOpenChange={setKycViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Document Details</DialogTitle>
            <DialogDescription>
              Review the submitted KYC document information
            </DialogDescription>
          </DialogHeader>
          
          {selectedKycDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">User Information</h4>
                  <p><strong>User ID:</strong> {selectedKycDocument.userId}</p>
                  <p><strong>Full Name:</strong> {selectedKycDocument.user?.fullName || 'N/A'}</p>
                  <p><strong>Email:</strong> {selectedKycDocument.user?.email || 'N/A'}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Document Information</h4>
                  <p><strong>Document Type:</strong> {selectedKycDocument.documentType}</p>
                  <p><strong>Document Number:</strong> {selectedKycDocument.documentNumber}</p>
                  <p><strong>Expiry Date:</strong> {selectedKycDocument.expiryDate || 'N/A'}</p>
                  <p><strong>Submitted:</strong> {new Date(selectedKycDocument.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Uploaded Document</h4>
                {selectedKycDocument.documentUrl && (
                  <div className="mt-2">
                    <a 
                      href={selectedKycDocument.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <FileImage className="h-4 w-4" />
                      View Document
                    </a>
                    <img 
                      src={selectedKycDocument.documentUrl} 
                      alt="KYC Document" 
                      className="mt-2 max-w-full h-auto rounded border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Status</h4>
                <Badge variant={selectedKycDocument.verificationStatus === 'verified' ? 'default' :
                  selectedKycDocument.verificationStatus === 'rejected' ? 'destructive' : 'secondary'}>
                  {selectedKycDocument.verificationStatus}
                </Badge>
                {selectedKycDocument.rejectionReason && (
                  <p className="mt-2 text-sm text-red-600">
                    <strong>Rejection Reason:</strong> {selectedKycDocument.rejectionReason}
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    updateKycStatus(selectedKycDocument.id, 'verified');
                    setKycViewDialog(false);
                  }}
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    const reason = prompt("Enter rejection reason:");
                    if (reason) {
                      updateKycStatus(selectedKycDocument.id, 'rejected', reason);
                      setKycViewDialog(false);
                    }
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={userDetailsDialog} onOpenChange={setUserDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete user information and account details
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Account Information</h4>
                  <p><strong>User ID:</strong> {selectedUser.id}</p>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Full Name:</strong> {selectedUser.fullName}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Account Status</h4>
                  <p><strong>Balance:</strong> ${selectedUser.balance}</p>
                  <p><strong>KYC Status:</strong> {selectedUser.kycStatus}</p>
                  <p><strong>Account Status:</strong> {selectedUser.suspended ? 'Suspended' : 'Active'}</p>
                  <p><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => {
                    viewUserDetails(selectedUser);
                    setUserDetailsDialog(false);
                  }}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk User Actions</DialogTitle>
            <DialogDescription>
              Perform actions on {selectedUsers.length} selected users
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-action">Select Action</Label>
              <Select value={bulkAction} onValueChange={setBulkAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suspend">Suspend Users</SelectItem>
                  <SelectItem value="unsuspend">Unsuspend Users</SelectItem>
                  <SelectItem value="verify_kyc">Verify KYC</SelectItem>
                  <SelectItem value="reset_kyc">Reset KYC Status</SelectItem>
                  <SelectItem value="send_email">Send Email Notification</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={performBulkAction}
              disabled={!bulkAction}
              variant="destructive"
            >
              Execute Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
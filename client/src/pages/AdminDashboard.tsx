import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Users, FileText, TrendingUp, DollarSign, CheckCircle, XCircle, Settings, RefreshCw, Plus, Edit, Trash2, Download, Upload, AlertTriangle } from "lucide-react";

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
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [investmentPlans, setInvestmentPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [balanceUpdate, setBalanceUpdate] = useState({ userId: 0, amount: '', type: 'add' });
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
  
  // Settings state
  const [systemSettings, setSystemSettings] = useState({
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
        safeFetch("/api/admin/settings", setSystemSettings, systemSettings)
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
        expectedReturn: editPlanData.expectedReturn,
        duration: editPlanData.duration,
        isActive: editPlanData.isActive,
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
      roiPercentage: plan.expectedReturn, // Map expectedReturn to roiPercentage
      lockPeriodDays: plan.duration,     // Map duration to lockPeriodDays
      status: plan.isActive ? 'active' : 'inactive', // Map isActive to status
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
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="kyc">KYC</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

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
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Review Transaction #{transaction.id}</DialogTitle>
                                <DialogDescription>
                                  {transaction.type.toUpperCase()} request for ${transaction.amount}
                                </DialogDescription>
                              </DialogHeader>
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
                                      <SelectItem value="approve">Approve</SelectItem>
                                      <SelectItem value="reject">Reject</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label htmlFor="notes">Admin Notes</Label>
                                  <Input
                                    value={transactionAction.notes}
                                    onChange={(e) => setTransactionAction(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Optional notes..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => reviewTransaction(transaction.id, transactionAction.action, transactionAction.notes)}
                                  disabled={!transactionAction.action}
                                >
                                  {transactionAction.action === 'approve' ? 'Approve' : 'Reject'} Transaction
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
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
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
                  {users.map((user) => (
                    <TableRow key={user.id}>
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
                        <div className="space-x-2">
                          {user.role !== 'admin' && (
                            <>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" variant="outline" onClick={() => setSelectedUser(user)}>
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Balance
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
                              >
                                Make {user.role === 'user' ? 'Admin' : 'User'}
                              </Button>
                              <Button
                                size="sm"
                                variant={user.suspended ? 'default' : 'destructive'}
                                onClick={() => suspendUser(user.id, !user.suspended)}
                              >
                                {user.suspended ? 'Unsuspend' : 'Suspend'}
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

        <TabsContent value="kyc">
          <Card>
            <CardHeader>
              <CardTitle>KYC Document Review</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Document Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kycDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.id}</TableCell>
                      <TableCell>{doc.user?.fullName || 'Unknown'}</TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>{doc.documentNumber}</TableCell>
                      <TableCell>
                        <Badge variant={
                          doc.verificationStatus === 'verified' ? 'default' :
                          doc.verificationStatus === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {doc.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(doc.submittedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {doc.verificationStatus === 'pending' && (
                          <div className="space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateKycStatus(doc.id, 'verified')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateKycStatus(doc.id, 'rejected', 'Document not clear')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades">
          <Card>
            <CardHeader>
              <CardTitle>All Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>{trade.id}</TableCell>
                      <TableCell>{trade.user?.fullName || 'Unknown'}</TableCell>
                      <TableCell>{trade.asset?.symbol || 'Unknown'}</TableCell>
                      <TableCell>
                        <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'}>
                          {trade.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{trade.amount}</TableCell>
                      <TableCell>${trade.price}</TableCell>
                      <TableCell>
                        <Badge variant={trade.status === 'executed' ? 'default' : 'secondary'}>
                          {trade.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(trade.createdAt).toLocaleDateString()}</TableCell>
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
                      <TableCell>${asset.currentPrice}</TableCell>
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
                    value={editAssetData.currentPrice}
                    onChange={(e) => setEditAssetData(prev => ({ ...prev, price: e.target.value }))}
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
                      <TableCell>${plan.maxAmount}</TableCell>
                      <TableCell>{plan.expectedReturn}%</TableCell>
                      <TableCell>{plan.duration}</TableCell>
                      <TableCell>
                        <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
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

        <TabsContent value="analytics">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Total Revenue</h3>
                    <p className="text-2xl font-bold text-green-600">$150,000</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Active Traders</h3>
                    <p className="text-2xl font-bold">325</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Success Rate</h3>
                    <p className="text-2xl font-bold text-blue-600">87%</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium">Total Volume</h3>
                    <p className="text-2xl font-bold">$2.5M</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertTitle>Platform Configuration</AlertTitle>
                  <AlertDescription>
                    Manage system-wide settings and configurations.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trading Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Minimum Trade Amount</Label>
                        <Input 
                          type="number" 
                          value={systemSettings.trading.trading_min_amount}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            trading: { ...prev.trading, trading_min_amount: e.target.value }
                          }))}
                          placeholder="10.00" 
                        />
                      </div>
                      <div>
                        <Label>Maximum Trade Amount</Label>
                        <Input 
                          type="number" 
                          value={systemSettings.trading.trading_max_amount}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            trading: { ...prev.trading, trading_max_amount: e.target.value }
                          }))}
                          placeholder="10000.00" 
                        />
                      </div>
                      <div>
                        <Label>Trading Fee (%)</Label>
                        <Input 
                          type="number" 
                          value={systemSettings.trading.trading_fee_percentage}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            trading: { ...prev.trading, trading_fee_percentage: e.target.value }
                          }))}
                          placeholder="0.1" 
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Email Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>SMTP Host</Label>
                        <Input 
                          value={systemSettings.email.smtp_host}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, smtp_host: e.target.value }
                          }))}
                          placeholder="smtp.gmail.com" 
                        />
                      </div>
                      <div>
                        <Label>SMTP Port</Label>
                        <Input 
                          value={systemSettings.email.smtp_port}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, smtp_port: e.target.value }
                          }))}
                          placeholder="587" 
                        />
                      </div>
                      <div>
                        <Label>From Email</Label>
                        <Input 
                          value={systemSettings.email.from_email}
                          onChange={(e) => setSystemSettings(prev => ({
                            ...prev,
                            email: { ...prev.email, from_email: e.target.value }
                          }))}
                          placeholder="noreply@elitestock.com" 
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-x-2">
                  <Button onClick={saveSettings} disabled={settingsLoading}>
                    {settingsLoading ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button variant="outline" onClick={resetSettingsToDefault}>Reset to Default</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
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
  const [newAsset, setNewAsset] = useState({ symbol: '', name: '', type: 'crypto', currentPrice: '' });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionAction, setTransactionAction] = useState({ action: '', notes: '' });

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
      
      // Fetch admin stats
      const statsResponse = await apiRequest("GET", "/api/admin/stats", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch users
      const usersResponse = await apiRequest("GET", "/api/admin/users", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      const usersData = await usersResponse.json();
      setUsers(usersData);

      // Fetch KYC documents
      const kycResponse = await apiRequest("GET", "/api/admin/kyc-documents", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      const kycData = await kycResponse.json();
      setKycDocuments(kycData);

      // Fetch all trades
      const tradesResponse = await apiRequest("GET", "/api/admin/trades", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      const tradesData = await tradesResponse.json();
      setTrades(tradesData);

      // Fetch all transactions
      const transactionsResponse = await apiRequest("GET", "/api/admin/transactions", undefined, {
        'X-User-Id': user.id.toString(),
        'X-User-Role': user.role
      });
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData);

      // Fetch assets
      const assetsResponse = await apiRequest("GET", "/api/assets");
      const assetsData = await assetsResponse.json();
      setAssets(assetsData);

      // Fetch investment plans
      const plansResponse = await apiRequest("GET", "/api/investment-plans");
      const plansData = await plansResponse.json();
      setInvestmentPlans(plansData);

    } catch (error) {
      console.error("Failed to fetch admin data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load admin data"
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
                        <Badge variant={(user as any).suspended ? 'destructive' : 'default'}>
                          {(user as any).suspended ? 'Suspended' : 'Active'}
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
                                variant={(user as any).suspended ? 'default' : 'destructive'}
                                onClick={() => suspendUser(user.id, !(user as any).suspended)}
                              >
                                {(user as any).suspended ? 'Unsuspend' : 'Suspend'}
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Symbol (e.g., BTC/USD)"
                      value={newAsset.symbol}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, symbol: e.target.value }))}
                    />
                    <Input
                      placeholder="Name (e.g., Bitcoin)"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Select value={newAsset.type} onValueChange={(value) => 
                      setNewAsset(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="forex">Forex</SelectItem>
                        <SelectItem value="stocks">Stocks</SelectItem>
                        <SelectItem value="commodities">Commodities</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Current Price"
                      value={newAsset.currentPrice}
                      onChange={(e) => setNewAsset(prev => ({ ...prev, currentPrice: e.target.value }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {/* Add asset logic */}}>
                      Add Asset
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
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
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Investment Plans Management</CardTitle>
              <Button>
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
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
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
                        <Input type="number" placeholder="10.00" />
                      </div>
                      <div>
                        <Label>Maximum Trade Amount</Label>
                        <Input type="number" placeholder="10000.00" />
                      </div>
                      <div>
                        <Label>Trading Fee (%)</Label>
                        <Input type="number" placeholder="0.1" />
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
                        <Input placeholder="smtp.gmail.com" />
                      </div>
                      <div>
                        <Label>SMTP Port</Label>
                        <Input placeholder="587" />
                      </div>
                      <div>
                        <Label>From Email</Label>
                        <Input placeholder="noreply@elitestock.com" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-x-2">
                  <Button>Save Settings</Button>
                  <Button variant="outline">Reset to Default</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
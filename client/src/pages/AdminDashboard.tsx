
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Users, FileText, TrendingUp, DollarSign, CheckCircle, XCircle } from "lucide-react";

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

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [kycDocuments, setKycDocuments] = useState<KycDocument[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

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
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="kyc">KYC Documents</TabsTrigger>
          <TabsTrigger value="trades">All Trades</TabsTrigger>
        </TabsList>
        
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
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRole(user.id, user.role === 'user' ? 'admin' : 'user')}
                          >
                            Make {user.role === 'user' ? 'Admin' : 'User'}
                          </Button>
                        )}
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
      </Tabs>
    </div>
  );
}

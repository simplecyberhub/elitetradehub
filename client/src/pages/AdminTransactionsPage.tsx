import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  CreditCard,
  Building,
  Wallet,
  Eye,
  FileImage,
} from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdrawal';
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  paymentProofUrl?: string;
  paymentNotes?: string;
  withdrawalAddress?: string;
  withdrawalDetails?: string;
  adminNotes?: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    fullName?: string;
  };
}

const AdminTransactionsPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [reviewingTransaction, setReviewingTransaction] = useState<Transaction | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/admin/transactions', selectedStatus],
    queryFn: async () => {
      const response = await fetch(`/api/admin/transactions?status=${selectedStatus}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      return response.json();
    },
    retry: 1,
  });

  // Review transaction mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ 
      transactionId, 
      action, 
      notes 
    }: { 
      transactionId: number; 
      action: 'approve' | 'reject';
      notes?: string;
    }) => {
      const response = await fetch(`/api/admin/transactions/${transactionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action, adminNotes: notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to review transaction');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: `Transaction ${variables.action}d`,
        description: `Transaction has been ${variables.action}d successfully.`,
      });
      
      // Refresh transactions list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transactions'] });
      setIsDialogOpen(false);
      setReviewingTransaction(null);
      setAdminNotes('');
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Review failed',
        description: error instanceof Error ? error.message : 'Failed to review transaction',
      });
    },
  });

  const handleReview = (transaction: Transaction) => {
    setReviewingTransaction(transaction);
    setAdminNotes('');
    setIsDialogOpen(true);
  };

  const handleApproveReject = (action: 'approve' | 'reject') => {
    if (!reviewingTransaction) return;

    reviewMutation.mutate({
      transactionId: reviewingTransaction.id,
      action,
      notes: adminNotes || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building className="h-4 w-4" />;
      case 'crypto':
        return <Wallet className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const parseWithdrawalDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return {};
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transaction Management</h1>
        <Badge variant="outline" className="text-sm">
          {transactions.length} transactions
        </Badge>
      </div>

      <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="">All</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedStatus} className="mt-6">
          <div className="grid gap-4">
            {transactions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-neutral-500">
                  No {selectedStatus} transactions found.
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction) => (
                <Card key={transaction.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {getMethodIcon(transaction.method)}
                            <span className="font-medium capitalize">
                              {transaction.type}
                            </span>
                          </div>
                          {getStatusBadge(transaction.status)}
                          <span className="text-2xl font-bold text-primary">
                            ${parseFloat(transaction.amount).toFixed(2)}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <h4 className="font-medium mb-2">User Details</h4>
                            <p className="text-sm text-neutral-600">
                              <strong>Name:</strong> {transaction.user.fullName || transaction.user.username}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <strong>Email:</strong> {transaction.user.email}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <strong>Method:</strong> {transaction.method.replace('_', ' ')}
                            </p>
                            <p className="text-sm text-neutral-600">
                              <strong>Date:</strong> {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Transaction Details</h4>
                            
                            {transaction.type === 'deposit' && transaction.paymentNotes && (
                              <p className="text-sm text-neutral-600 mb-1">
                                <strong>Payment Notes:</strong> {transaction.paymentNotes}
                              </p>
                            )}
                            
                            {transaction.type === 'withdrawal' && transaction.withdrawalAddress && (
                              <div className="text-sm text-neutral-600 mb-1">
                                <p><strong>Destination:</strong> {transaction.withdrawalAddress}</p>
                                {transaction.withdrawalDetails && (
                                  <div className="mt-2">
                                    {Object.entries(parseWithdrawalDetails(transaction.withdrawalDetails)).map(([key, value]) => (
                                      <p key={key} className="capitalize">
                                        <strong>{key.replace(/([A-Z])/g, ' $1')}:</strong> {String(value)}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {transaction.paymentProofUrl && (
                              <div className="flex items-center gap-2 text-sm text-neutral-600">
                                <FileImage className="h-4 w-4" />
                                <a 
                                  href={transaction.paymentProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View Payment Proof
                                </a>
                              </div>
                            )}

                            {transaction.adminNotes && (
                              <p className="text-sm text-neutral-600 mt-2">
                                <strong>Admin Notes:</strong> {transaction.adminNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {transaction.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => handleReview(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Transaction</DialogTitle>
            <DialogDescription>
              Review and approve or reject this {reviewingTransaction?.type} transaction.
            </DialogDescription>
          </DialogHeader>

          {reviewingTransaction && (
            <div className="space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md">
                <p className="font-medium">
                  {reviewingTransaction.type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${parseFloat(reviewingTransaction.amount).toFixed(2)}
                </p>
                <p className="text-sm text-neutral-600">
                  User: {reviewingTransaction.user.fullName || reviewingTransaction.user.username}
                </p>
                <p className="text-sm text-neutral-600">
                  Method: {reviewingTransaction.method.replace('_', ' ')}
                </p>
              </div>

              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add notes about your decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleApproveReject('approve')}
                  disabled={reviewMutation.isPending}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApproveReject('reject')}
                  disabled={reviewMutation.isPending}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionsPage;
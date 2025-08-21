import { queryClient, apiRequest } from "./queryClient";
import { useAuth } from "@/context/AuthContext";

// Asset functions
export async function fetchAssets(type?: string) {
  const url = type ? `/api/assets?type=${type}` : '/api/assets';
  const response = await fetch(url, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchAssetById(id: number) {
  const response = await fetch(`/api/assets/${id}`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch asset: ${response.statusText}`);
  }
  
  return response.json();
}

// Trade functions
export async function createTrade(data: any) {
  const response = await apiRequest('POST', '/api/trades', data);
  // Invalidate trades cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${data.userId}/trades`] });
  return response.json();
}

export async function fetchUserTrades(userId: number) {
  const response = await fetch(`/api/user/${userId}/trades`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }
  
  return response.json();
}

// Watchlist functions
export async function addToWatchlist(userId: number, assetId: number) {
  const response = await apiRequest('POST', '/api/watchlist', { userId, assetId });
  // Invalidate watchlist cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/watchlist`] });
  return response.json();
}

export async function removeFromWatchlist(id: number, userId: number) {
  const response = await apiRequest('DELETE', `/api/watchlist/${id}`);
  // Invalidate watchlist cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/watchlist`] });
  return response;
}

export async function fetchWatchlist(userId: number) {
  const response = await fetch(`/api/user/${userId}/watchlist`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch watchlist: ${response.statusText}`);
  }
  
  return response.json();
}

// Copy trading functions
export async function fetchTraders() {
  const response = await fetch('/api/traders', { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch traders: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchUserCopyTrading(userId: number) {
  const response = await fetch(`/api/user/${userId}/copy-trading`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch copy trading relationships: ${response.statusText}`);
  }
  
  return response.json();
}

export async function startCopyTrading(followerId: number, traderId: number, allocationPercentage: number = 100) {
  const response = await apiRequest('POST', '/api/copy-trading', {
    followerId,
    traderId,
    allocationPercentage: allocationPercentage.toString(),
    status: 'active'
  });
  
  // Invalidate copy trading cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${followerId}/copy-trading`] });
  
  return response.json();
}

export async function updateCopyTrading(id: number, followerId: number, data: any) {
  const response = await apiRequest('PATCH', `/api/copy-trading/${id}`, data);
  
  // Invalidate copy trading cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${followerId}/copy-trading`] });
  
  return response.json();
}

export async function stopCopyTrading(id: number, followerId: number) {
  const response = await apiRequest('DELETE', `/api/copy-trading/${id}`);
  
  // Invalidate copy trading cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${followerId}/copy-trading`] });
  
  return response;
}

// Investment plan functions
export async function fetchInvestmentPlans() {
  const response = await fetch('/api/investment-plans', { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch investment plans: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createInvestment(data: any) {
  const response = await apiRequest('POST', '/api/investments', data);
  
  // Invalidate investments cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${data.userId}/investments`] });
  // Invalidate user data to update balance
  queryClient.invalidateQueries({ queryKey: [`/api/user/${data.userId}`] });
  
  return response.json();
}

export async function fetchUserInvestments(userId: number) {
  const response = await fetch(`/api/user/${userId}/investments`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch investments: ${response.statusText}`);
  }
  
  return response.json();
}

// Transaction functions
export async function createDeposit(userId: number, amount: number, method: string) {
  console.log("Creating deposit API call:", { userId, amount, method });
  
  const depositData = {
    userId,
    type: 'deposit',
    amount: amount.toString(),
    method,
    status: 'pending',
    transactionRef: `DEP${Date.now()}`
  };
  
  console.log("Deposit data being sent:", depositData);
  
  const response = await apiRequest('POST', '/api/transactions', depositData);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  // Invalidate transactions cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/transactions`] });
  // Invalidate user data to update balance
  queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
  
  const result = await response.json();
  console.log("Deposit API response:", result);
  return result;
}

export async function createWithdrawal(userId: number, amount: number, method: string) {
  const response = await apiRequest('POST', '/api/transactions', {
    userId,
    type: 'withdrawal',
    amount: amount.toString(),
    method,
    status: 'pending',
    transactionRef: `WD${Date.now()}`
  });
  
  // Invalidate transactions cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}/transactions`] });
  // Invalidate user data to update balance
  queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
  
  return response.json();
}

export async function fetchUserTransactions(userId: number) {
  const response = await fetch(`/api/user/${userId}/transactions`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }
  
  return response.json();
}

// KYC functions
export async function submitKycDocument(data: any) {
  const response = await apiRequest('POST', '/api/kyc-documents', data);
  
  // Invalidate KYC documents cache
  queryClient.invalidateQueries({ queryKey: [`/api/user/${data.userId}/kyc-documents`] });
  // Invalidate user data to update KYC status
  queryClient.invalidateQueries({ queryKey: [`/api/user/${data.userId}`] });
  
  return response.json();
}

export async function fetchUserKycDocuments(userId: number) {
  const response = await fetch(`/api/user/${userId}/kyc-documents`, { credentials: 'include' });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch KYC documents: ${response.statusText}`);
  }
  
  return response.json();
}

export async function createDeposit(userId: number, amount: number, method: string) {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId,
      type: 'deposit',
      amount: amount.toString(),
      method,
      status: 'pending'
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create deposit: ${response.statusText}`);
  }

  return response.json();
}

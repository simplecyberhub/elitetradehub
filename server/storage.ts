import {
  users, assets, traders, copyRelationships, trades,
  investmentPlans, investments, transactions, kycDocuments, watchlistItems,
  type User, type InsertUser, type Asset, type InsertAsset,
  type Trader, type InsertTrader, type CopyRelationship, type InsertCopyRelationship,
  type Trade, type InsertTrade, type InvestmentPlan, type InsertInvestmentPlan,
  type Investment, type InsertInvestment, type Transaction, type InsertTransaction,
  type KycDocument, type InsertKycDocument, type WatchlistItem, type InsertWatchlistItem
} from "@shared/schema";
import { DbStorage } from "./db-storage";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateUserBalance(id: number, amount: number, isAdd: boolean): Promise<User | undefined>;

  // Asset operations
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetBySymbol(symbol: string): Promise<Asset | undefined>;
  getAssets(type?: string): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, data: Partial<Asset>): Promise<Asset | undefined>;

  // Trader operations
  getTrader(id: number): Promise<Trader | undefined>;
  getTraderByUserId(userId: number): Promise<Trader | undefined>;
  getTraders(): Promise<Trader[]>;
  createTrader(trader: InsertTrader): Promise<Trader>;
  updateTrader(id: number, data: Partial<Trader>): Promise<Trader | undefined>;

  // Copy relationship operations
  getCopyRelationship(id: number): Promise<CopyRelationship | undefined>;
  getCopyRelationshipsByFollowerId(followerId: number): Promise<CopyRelationship[]>;
  getCopyRelationshipsByTraderId(traderId: number): Promise<CopyRelationship[]>;
  createCopyRelationship(relationship: InsertCopyRelationship): Promise<CopyRelationship>;
  updateCopyRelationship(id: number, data: Partial<CopyRelationship>): Promise<CopyRelationship | undefined>;
  deleteCopyRelationship(id: number): Promise<boolean>;

  // Trade operations
  getTrade(id: number): Promise<Trade | undefined>;
  getTradesByUserId(userId: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, data: Partial<Trade>): Promise<Trade | undefined>;
  executeTrade(id: number): Promise<Trade | undefined>;

  // Investment plan operations
  getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined>;
  getInvestmentPlans(): Promise<InvestmentPlan[]>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;
  updateInvestmentPlan(id: number, data: Partial<InvestmentPlan>): Promise<InvestmentPlan | undefined>;

  // Investment operations
  getInvestment(id: number): Promise<Investment | undefined>;
  getInvestmentsByUserId(userId: number): Promise<Investment[]>;
  createInvestment(investment: InsertInvestment): Promise<Investment>;
  updateInvestment(id: number, data: Partial<Investment>): Promise<Investment | undefined>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined>;
  completeTransaction(id: number): Promise<Transaction | undefined>;

  // KYC document operations
  getKycDocument(id: number): Promise<KycDocument | undefined>;
  getKycDocumentsByUserId(userId: number): Promise<KycDocument[]>;
  createKycDocument(document: InsertKycDocument): Promise<KycDocument>;
  updateKycDocument(id: number, data: Partial<KycDocument>): Promise<KycDocument | undefined>;

  // Watchlist operations
  getWatchlistItem(id: number): Promise<WatchlistItem | undefined>;
  getWatchlistItemsByUserId(userId: number): Promise<WatchlistItem[]>;
  createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem>;
  deleteWatchlistItem(id: number): Promise<boolean>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getAllKycDocuments(): Promise<KycDocument[]>;
  getAllTrades(): Promise<Trade[]>;
}

export class MemStorage implements IStorage {
  private usersTable: Map<number, User>;
  private assetsTable: Map<number, Asset>;
  private tradersTable: Map<number, Trader>;
  private copyRelationshipsTable: Map<number, CopyRelationship>;
  private tradesTable: Map<number, Trade>;
  private investmentPlansTable: Map<number, InvestmentPlan>;
  private investmentsTable: Map<number, Investment>;
  private transactionsTable: Map<number, Transaction>;
  private kycDocumentsTable: Map<number, KycDocument>;
  private watchlistItemsTable: Map<number, WatchlistItem>;

  private currentIds: {
    user: number;
    asset: number;
    trader: number;
    copyRelationship: number;
    trade: number;
    investmentPlan: number;
    investment: number;
    transaction: number;
    kycDocument: number;
    watchlistItem: number;
  };

  constructor() {
    this.usersTable = new Map();
    this.assetsTable = new Map();
    this.tradersTable = new Map();
    this.copyRelationshipsTable = new Map();
    this.tradesTable = new Map();
    this.investmentPlansTable = new Map();
    this.investmentsTable = new Map();
    this.transactionsTable = new Map();
    this.kycDocumentsTable = new Map();
    this.watchlistItemsTable = new Map();

    this.currentIds = {
      user: 1,
      asset: 1,
      trader: 1,
      copyRelationship: 1,
      trade: 1,
      investmentPlan: 1,
      investment: 1,
      transaction: 1,
      kycDocument: 1,
      watchlistItem: 1
    };

    // Seed data
    this.seedData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.usersTable.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersTable.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.usersTable.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const newUser: User = {
      ...user,
      id,
      balance: "0",
      avatar: user.avatar || null,
      kycStatus: "unverified",
      role: "user",
      createdAt: new Date()
    };
    this.usersTable.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...data };
    this.usersTable.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserBalance(id: number, amount: number, isAdd: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const currentBalance = parseFloat(user.balance.toString());
    const newBalance = isAdd ? currentBalance + amount : currentBalance - amount;

    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    const updatedUser = { ...user, balance: newBalance.toString() };
    this.usersTable.set(id, updatedUser);
    return updatedUser;
  }

  // Asset operations
  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assetsTable.get(id);
  }

  async getAssetBySymbol(symbol: string): Promise<Asset | undefined> {
    return Array.from(this.assetsTable.values()).find(
      (asset) => asset.symbol === symbol,
    );
  }

  async getAssets(type?: string): Promise<Asset[]> {
    const assets = Array.from(this.assetsTable.values());
    if (type) {
      return assets.filter((asset) => asset.type === type);
    }
    return assets;
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const id = this.currentIds.asset++;
    const newAsset: Asset = { 
      ...asset, 
      id,
      change24h: asset.change24h || "0",
      volume24h: asset.volume24h || null,
      marketCap: asset.marketCap || null,
      logoUrl: asset.logoUrl || null
    };
    this.assetsTable.set(id, newAsset);
    return newAsset;
  }

  async updateAsset(id: number, data: Partial<Asset>): Promise<Asset | undefined> {
    const asset = await this.getAsset(id);
    if (!asset) return undefined;

    const updatedAsset = { ...asset, ...data };
    this.assetsTable.set(id, updatedAsset);
    return updatedAsset;
  }

  // Trader operations
  async getTrader(id: number): Promise<Trader | undefined> {
    return this.tradersTable.get(id);
  }

  async getTraderByUserId(userId: number): Promise<Trader | undefined> {
    return Array.from(this.tradersTable.values()).find(
      (trader) => trader.userId === userId,
    );
  }

  async getTraders(): Promise<Trader[]> {
    return Array.from(this.tradersTable.values());
  }

  async createTrader(trader: InsertTrader): Promise<Trader> {
    const id = this.currentIds.trader++;
    const newTrader: Trader = {
      ...trader,
      id,
      bio: trader.bio || null,
      winRate: trader.winRate || "0",
      profit30d: trader.profit30d || "0",
      followers: 0,
      rating: "0.0",
      status: "active"
    };
    this.tradersTable.set(id, newTrader);
    return newTrader;
  }

  async updateTrader(id: number, data: Partial<Trader>): Promise<Trader | undefined> {
    const trader = await this.getTrader(id);
    if (!trader) return undefined;

    const updatedTrader = { ...trader, ...data };
    this.tradersTable.set(id, updatedTrader);
    return updatedTrader;
  }

  // Copy relationship operations
  async getCopyRelationship(id: number): Promise<CopyRelationship | undefined> {
    return this.copyRelationshipsTable.get(id);
  }

  async getCopyRelationshipsByFollowerId(followerId: number): Promise<CopyRelationship[]> {
    return Array.from(this.copyRelationshipsTable.values()).filter(
      (relationship) => relationship.followerId === followerId,
    );
  }

  async getCopyRelationshipsByTraderId(traderId: number): Promise<CopyRelationship[]> {
    return Array.from(this.copyRelationshipsTable.values()).filter(
      (relationship) => relationship.traderId === traderId,
    );
  }

  async createCopyRelationship(relationship: InsertCopyRelationship): Promise<CopyRelationship> {
    const id = this.currentIds.copyRelationship++;
    const newRelationship: CopyRelationship = {
      ...relationship,
      id,
      status: relationship.status || "active",
      allocationPercentage: relationship.allocationPercentage || "100",
      createdAt: new Date()
    };
    this.copyRelationshipsTable.set(id, newRelationship);
    
    // Update trader followers count
    const trader = await this.getTrader(relationship.traderId);
    if (trader) {
      await this.updateTrader(trader.id, { followers: trader.followers + 1 });
    }
    
    return newRelationship;
  }

  async updateCopyRelationship(id: number, data: Partial<CopyRelationship>): Promise<CopyRelationship | undefined> {
    const relationship = await this.getCopyRelationship(id);
    if (!relationship) return undefined;

    const updatedRelationship = { ...relationship, ...data };
    this.copyRelationshipsTable.set(id, updatedRelationship);
    return updatedRelationship;
  }

  async deleteCopyRelationship(id: number): Promise<boolean> {
    const relationship = await this.getCopyRelationship(id);
    if (!relationship) return false;

    // Update trader followers count
    const trader = await this.getTrader(relationship.traderId);
    if (trader && trader.followers > 0) {
      await this.updateTrader(trader.id, { followers: trader.followers - 1 });
    }

    return this.copyRelationshipsTable.delete(id);
  }

  // Trade operations
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.tradesTable.get(id);
  }

  async getTradesByUserId(userId: number): Promise<Trade[]> {
    return Array.from(this.tradesTable.values())
      .filter((trade) => trade.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const id = this.currentIds.trade++;
    const newTrade: Trade = {
      ...trade,
      id,
      executedAt: null,
      copiedFromTradeId: trade.copiedFromTradeId || null,
      createdAt: new Date()
    };
    this.tradesTable.set(id, newTrade);
    return newTrade;
  }

  async updateTrade(id: number, data: Partial<Trade>): Promise<Trade | undefined> {
    const trade = await this.getTrade(id);
    if (!trade) return undefined;

    const updatedTrade = { ...trade, ...data };
    this.tradesTable.set(id, updatedTrade);
    return updatedTrade;
  }

  async executeTrade(id: number): Promise<Trade | undefined> {
    const trade = await this.getTrade(id);
    if (!trade || trade.status !== "pending") return undefined;

    const asset = await this.getAsset(trade.assetId);
    if (!asset) return undefined;

    const user = await this.getUser(trade.userId);
    if (!user) return undefined;

    // Calculate trade cost
    const amount = parseFloat(trade.amount.toString());
    const price = parseFloat(trade.price.toString());
    const totalCost = amount * price;

    // For buy orders, check if user has enough balance
    if (trade.type === "buy") {
      if (parseFloat(user.balance.toString()) < totalCost) {
        throw new Error("Insufficient balance");
      }
      // Deduct amount from user balance
      await this.updateUserBalance(user.id, totalCost, false);
    } else if (trade.type === "sell") {
      // Add amount to user balance for sell orders
      await this.updateUserBalance(user.id, totalCost, true);
    }

    // Update trade status
    const executedTrade = await this.updateTrade(id, {
      status: "executed",
      executedAt: new Date()
    });

    // If this is a trade from a trader being copied, create copies for followers
    if (!trade.copiedFromTradeId) {
      const trader = await this.getTraderByUserId(trade.userId);
      if (trader) {
        const followers = await this.getCopyRelationshipsByTraderId(trader.id);
        for (const follower of followers) {
          if (follower.status === "active") {
            // Calculate allocation
            const allocationPercentage = parseFloat(follower.allocationPercentage.toString()) / 100;
            const followerAmount = amount * allocationPercentage;
            
            // Create copy trade for follower
            await this.createTrade({
              userId: follower.followerId,
              assetId: trade.assetId,
              type: trade.type,
              amount: followerAmount.toString(),
              price: trade.price,
              status: "pending",
              copiedFromTradeId: trade.id
            });
          }
        }
      }
    }

    return executedTrade;
  }

  // Investment plan operations
  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    return this.investmentPlansTable.get(id);
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return Array.from(this.investmentPlansTable.values())
      .filter(plan => plan.status === "active");
  }

  async createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const id = this.currentIds.investmentPlan++;
    const newPlan: InvestmentPlan = {
      ...plan,
      id,
      maxAmount: plan.maxAmount || null,
      status: "active"
    };
    this.investmentPlansTable.set(id, newPlan);
    return newPlan;
  }

  async updateInvestmentPlan(id: number, data: Partial<InvestmentPlan>): Promise<InvestmentPlan | undefined> {
    const plan = await this.getInvestmentPlan(id);
    if (!plan) return undefined;

    const updatedPlan = { ...plan, ...data };
    this.investmentPlansTable.set(id, updatedPlan);
    return updatedPlan;
  }

  // Investment operations
  async getInvestment(id: number): Promise<Investment | undefined> {
    return this.investmentsTable.get(id);
  }

  async getInvestmentsByUserId(userId: number): Promise<Investment[]> {
    return Array.from(this.investmentsTable.values())
      .filter((investment) => investment.userId === userId)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const id = this.currentIds.investment++;
    const newInvestment: Investment = {
      ...investment,
      id
    };
    this.investmentsTable.set(id, newInvestment);

    // Deduct amount from user balance
    const user = await this.getUser(investment.userId);
    if (user) {
      await this.updateUserBalance(
        user.id, 
        parseFloat(investment.amount.toString()), 
        false
      );
    }

    return newInvestment;
  }

  async updateInvestment(id: number, data: Partial<Investment>): Promise<Investment | undefined> {
    const investment = await this.getInvestment(id);
    if (!investment) return undefined;

    const updatedInvestment = { ...investment, ...data };
    this.investmentsTable.set(id, updatedInvestment);
    return updatedInvestment;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactionsTable.get(id);
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactionsTable.values())
      .filter((transaction) => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentIds.transaction++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      transactionRef: transaction.transactionRef || null,
      createdAt: new Date(),
      completedAt: null
    };
    this.transactionsTable.set(id, newTransaction);
    return newTransaction;
  }

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction) return undefined;

    const updatedTransaction = { ...transaction, ...data };
    this.transactionsTable.set(id, updatedTransaction);
    return updatedTransaction;
  }

  async completeTransaction(id: number): Promise<Transaction | undefined> {
    const transaction = await this.getTransaction(id);
    if (!transaction || transaction.status !== "pending") return undefined;

    const user = await this.getUser(transaction.userId);
    if (!user) return undefined;

    // Update user balance
    const amount = parseFloat(transaction.amount.toString());
    if (transaction.type === "deposit") {
      await this.updateUserBalance(user.id, amount, true);
    } else if (transaction.type === "withdrawal") {
      await this.updateUserBalance(user.id, amount, false);
    }

    // Update transaction
    const completedTransaction = await this.updateTransaction(id, {
      status: "completed",
      completedAt: new Date()
    });

    return completedTransaction;
  }

  // KYC document operations
  async getKycDocument(id: number): Promise<KycDocument | undefined> {
    return this.kycDocumentsTable.get(id);
  }

  async getKycDocumentsByUserId(userId: number): Promise<KycDocument[]> {
    return Array.from(this.kycDocumentsTable.values())
      .filter((document) => document.userId === userId)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());
  }

  async createKycDocument(document: InsertKycDocument): Promise<KycDocument> {
    const id = this.currentIds.kycDocument++;
    const newDocument: KycDocument = {
      ...document,
      id,
      expiryDate: document.expiryDate || null,
      verificationStatus: "pending",
      rejectionReason: null,
      submittedAt: new Date()
    };
    this.kycDocumentsTable.set(id, newDocument);

    // Update user KYC status
    const user = await this.getUser(document.userId);
    if (user && user.kycStatus === "unverified") {
      await this.updateUser(user.id, { kycStatus: "pending" });
    }

    return newDocument;
  }

  async updateKycDocument(id: number, data: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const document = await this.getKycDocument(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...data };
    this.kycDocumentsTable.set(id, updatedDocument);

    // Update user KYC status if document is verified/rejected
    if (data.verificationStatus) {
      const user = await this.getUser(document.userId);
      if (user) {
        if (data.verificationStatus === "verified") {
          await this.updateUser(user.id, { kycStatus: "verified" });
        } else if (data.verificationStatus === "rejected") {
          await this.updateUser(user.id, { kycStatus: "unverified" });
        }
      }
    }

    return updatedDocument;
  }

  // Watchlist operations
  async getWatchlistItem(id: number): Promise<WatchlistItem | undefined> {
    return this.watchlistItemsTable.get(id);
  }

  async getWatchlistItemsByUserId(userId: number): Promise<WatchlistItem[]> {
    return Array.from(this.watchlistItemsTable.values())
      .filter((item) => item.userId === userId);
  }

  async createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    // Check if item already exists
    const existing = Array.from(this.watchlistItemsTable.values()).find(
      (existingItem) => existingItem.userId === item.userId && existingItem.assetId === item.assetId
    );
    
    if (existing) {
      return existing;
    }

    const id = this.currentIds.watchlistItem++;
    const newItem: WatchlistItem = {
      ...item,
      id,
      createdAt: new Date()
    };
    this.watchlistItemsTable.set(id, newItem);
    return newItem;
  }

  async deleteWatchlistItem(id: number): Promise<boolean> {
    return this.watchlistItemsTable.delete(id);
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.usersTable.values());
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return Array.from(this.kycDocumentsTable.values());
  }

  async getAllTrades(): Promise<Trade[]> {
    return Array.from(this.tradesTable.values());
  }

  // Seed initial data
  private seedData() {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      fullName: "Administrator",
    };
    this.createUser(adminUser).then(admin => {
      this.updateUser(admin.id, { role: "admin" });
    });

    // Create demo user
    const demoUser: InsertUser = {
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "John Smith",
    };
    const user = this.createUser(demoUser);

    // Seed assets (stocks)
    const stockAssets = [
      { symbol: "AAPL", name: "Apple Inc.", type: "stock", price: "182.63", change24h: "1.45", volume24h: "34567890", marketCap: "2987654321", logoUrl: "" },
      { symbol: "MSFT", name: "Microsoft Corporation", type: "stock", price: "334.27", change24h: "0.75", volume24h: "12345678", marketCap: "2498765432", logoUrl: "" },
      { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", price: "129.12", change24h: "0.83", volume24h: "9876543", marketCap: "1324567890", logoUrl: "" },
      { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", price: "134.99", change24h: "-0.32", volume24h: "5432109", marketCap: "1765432109", logoUrl: "" },
      { symbol: "TSLA", name: "Tesla Inc.", type: "stock", price: "238.45", change24h: "-2.07", volume24h: "20987654", marketCap: "756432109", logoUrl: "" },
      { symbol: "NFLX", name: "Netflix Inc.", type: "stock", price: "415.72", change24h: "3.21", volume24h: "4321098", marketCap: "187654321", logoUrl: "" },
      { symbol: "META", name: "Meta Platforms Inc.", type: "stock", price: "286.39", change24h: "2.19", volume24h: "9871234", marketCap: "732109876", logoUrl: "" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock", price: "487.98", change24h: "4.32", volume24h: "15678901", marketCap: "1201234567", logoUrl: "" }
    ];

    stockAssets.forEach(asset => {
      this.createAsset(asset);
    });

    // Seed assets (crypto)
    const cryptoAssets = [
      { symbol: "BTC/USD", name: "Bitcoin", type: "crypto", price: "38245.86", change24h: "3.24", volume24h: "28765432109", marketCap: "765432198765", logoUrl: "" },
      { symbol: "ETH/USD", name: "Ethereum", type: "crypto", price: "2256.78", change24h: "2.87", volume24h: "15678901234", marketCap: "265432198765", logoUrl: "" },
      { symbol: "SOL/USD", name: "Solana", type: "crypto", price: "76.32", change24h: "5.67", volume24h: "5432109876", marketCap: "32198765432", logoUrl: "" },
      { symbol: "XRP/USD", name: "Ripple", type: "crypto", price: "0.56", change24h: "-1.23", volume24h: "3210987654", marketCap: "27654321098", logoUrl: "" }
    ];

    cryptoAssets.forEach(asset => {
      this.createAsset(asset);
    });

    // Seed assets (forex)
    const forexAssets = [
      { symbol: "EUR/USD", name: "Euro/US Dollar", type: "forex", price: "1.0742", change24h: "-0.23", volume24h: "98765432109", marketCap: "0", logoUrl: "" },
      { symbol: "GBP/USD", name: "British Pound/US Dollar", type: "forex", price: "1.2654", change24h: "0.12", volume24h: "5432109876", marketCap: "0", logoUrl: "" },
      { symbol: "USD/JPY", name: "US Dollar/Japanese Yen", type: "forex", price: "153.67", change24h: "0.45", volume24h: "7654321098", marketCap: "0", logoUrl: "" },
      { symbol: "USD/CAD", name: "US Dollar/Canadian Dollar", type: "forex", price: "1.3765", change24h: "-0.18", volume24h: "4321098765", marketCap: "0", logoUrl: "" }
    ];

    forexAssets.forEach(asset => {
      this.createAsset(asset);
    });

    // Create traders
    const traders = [
      { userId: 1, bio: "Professional trader with 10 years of experience", winRate: "82.0", profit30d: "18.7", rating: "4.5" },
      { userId: 2, bio: "Cryptocurrency specialist", winRate: "76.0", profit30d: "12.3", rating: "4.0" },
      { userId: 3, bio: "Forex and commodities expert", winRate: "91.0", profit30d: "23.5", rating: "5.0" }
    ];

    // Create extra users for traders
    const traderUsers = [
      { username: "michael", password: "password", email: "michael@example.com", fullName: "Michael Thompson" },
      { username: "sarah", password: "password", email: "sarah@example.com", fullName: "Sarah Johnson" },
      { username: "robert", password: "password", email: "robert@example.com", fullName: "Robert Kim" }
    ];

    traderUsers.forEach((traderUser, index) => {
      this.createUser(traderUser).then(user => {
        this.createTrader({ ...traders[index], userId: user.id });
      });
    });

    // Seed investment plans
    const investmentPlans = [
      {
        name: "Starter",
        description: "Perfect for beginners",
        minAmount: "100",
        maxAmount: "999",
        roiPercentage: "7.0",
        lockPeriodDays: 30,
        features: ["6-8% Monthly ROI", "24/7 Support", "30-day lock period"]
      },
      {
        name: "Premium",
        description: "For intermediate traders",
        minAmount: "1000",
        maxAmount: "9999",
        roiPercentage: "11.0",
        lockPeriodDays: 15,
        features: ["10-12% Monthly ROI", "Priority Support", "15-day lock period"]
      },
      {
        name: "Elite",
        description: "For professional investors",
        minAmount: "10000",
        maxAmount: "0", // No maximum
        roiPercentage: "16.5",
        lockPeriodDays: 7,
        features: ["15-18% Monthly ROI", "Dedicated Account Manager", "7-day lock period"]
      }
    ];

    investmentPlans.forEach(plan => {
      this.createInvestmentPlan(plan);
    });
  }
}

// Create storage instance based on environment
async function createStorage(): Promise<IStorage> {
  if (process.env.DATABASE_URL) {
    console.log("Using PostgreSQL database storage");
    const dbStorage = new DbStorage(process.env.DATABASE_URL);
    
    // Check if database needs seeding (if no users exist)
    try {
      const existingUser = await dbStorage.getUserByUsername("demo");
      if (!existingUser) {
        const { seedDatabase } = await import("./seed");
        await seedDatabase(dbStorage);
      }
    } catch (error) {
      console.error("Error checking/seeding database:", error);
    }
    
    return dbStorage;
  } else {
    console.log("Using in-memory storage (no DATABASE_URL found)");
    return new MemStorage();
  }
}

export const storage = createStorage();

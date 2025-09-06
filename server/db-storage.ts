
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, and } from "drizzle-orm";
import dotenv from 'dotenv';
dotenv.config();
import {
  users, assets, traders, copyRelationships, trades,
  investmentPlans, investments, transactions, kycDocuments, watchlistItems,
  type User, type InsertUser, type Asset, type InsertAsset,
  type Trader, type InsertTrader, type CopyRelationship, type InsertCopyRelationship,
  type Trade, type InsertTrade, type InvestmentPlan, type InsertInvestmentPlan,
  type Investment, type InsertInvestment, type Transaction, type InsertTransaction,
  type KycDocument, type InsertKycDocument, type WatchlistItem, type InsertWatchlistItem
} from "@shared/schema";
import { IStorage } from "./storage";

export class DbStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private client;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL must be set");
    }
    
    this.client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(this.client, {
      schema: {
        users, assets, traders, copyRelationships, trades,
        investmentPlans, investments, transactions, kycDocuments, watchlistItems
      }
    });
  }

  async close() {
    await this.client.end();
  }

  // User operations
  async createUser(data: InsertUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User> {
    const [user] = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async updateUserBalance(id: number, amount: number, isAdd: boolean): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const currentBalance = parseFloat(user.balance.toString());
    const newBalance = isAdd ? currentBalance + amount : currentBalance - amount;

    if (newBalance < 0) {
      throw new Error("Insufficient balance");
    }

    return await this.updateUser(id, { balance: newBalance.toString() });
  }

  // Asset operations
  async createAsset(data: InsertAsset): Promise<Asset> {
    const [asset] = await this.db.insert(assets).values(data).returning();
    return asset;
  }

  async getAssets(): Promise<Asset[]> {
    return await this.db.select().from(assets);
  }

  async getAssetById(id: number): Promise<Asset | undefined> {
    const [asset] = await this.db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async updateAsset(id: number, data: Partial<InsertAsset>): Promise<Asset> {
    const [asset] = await this.db.update(assets).set(data).where(eq(assets.id, id)).returning();
    return asset;
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const result = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return result[0];
  }

  async getAssetBySymbol(symbol: string): Promise<Asset | undefined> {
    const result = await this.db.select().from(assets).where(eq(assets.symbol, symbol)).limit(1);
    return result[0];
  }

  async deleteAsset(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(assets).where(eq(assets.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Delete asset error:', error);
      return false;
    }
  }

  // Trader operations
  async createTrader(data: InsertTrader): Promise<Trader> {
    const [trader] = await this.db.insert(traders).values(data).returning();
    return trader;
  }

  async getTraders(): Promise<Trader[]> {
    return await this.db.select().from(traders);
  }

  async getTrader(id: number): Promise<Trader | undefined> {
    const result = await this.db.select().from(traders).where(eq(traders.id, id)).limit(1);
    return result[0];
  }

  async getTraderByUserId(userId: number): Promise<Trader | undefined> {
    const result = await this.db.select().from(traders).where(eq(traders.userId, userId)).limit(1);
    return result[0];
  }

  async updateTrader(id: number, data: Partial<Trader>): Promise<Trader | undefined> {
    const result = await this.db.update(traders).set(data).where(eq(traders.id, id)).returning();
    return result[0];
  }

  // Trade operations
  async createTrade(data: InsertTrade): Promise<Trade> {
    const [trade] = await this.db.insert(trades).values(data).returning();
    return trade;
  }

  async getTrades(): Promise<Trade[]> {
    return await this.db.select().from(trades).orderBy(desc(trades.createdAt));
  }

  async getTradesByUserId(userId: number): Promise<Trade[]> {
    return await this.db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.createdAt));
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    const result = await this.db.select().from(trades).where(eq(trades.id, id)).limit(1);
    return result[0];
  }

  async getAllTrades(): Promise<Trade[]> {
    return await this.db.select().from(trades);
  }

  async updateTrade(id: number, data: Partial<Trade>): Promise<Trade | undefined> {
    const result = await this.db.update(trades).set(data).where(eq(trades.id, id)).returning();
    return result[0];
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

    return executedTrade;
  }

  // Investment plan operations
  async createInvestmentPlan(data: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const [plan] = await this.db.insert(investmentPlans).values(data).returning();
    return plan;
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return await this.db.select().from(investmentPlans);
  }

  async getInvestmentPlanById(id: number): Promise<InvestmentPlan | undefined> {
    const [plan] = await this.db.select().from(investmentPlans).where(eq(investmentPlans.id, id));
    return plan;
  }

  async updateInvestmentPlan(id: number, data: Partial<InsertInvestmentPlan>): Promise<InvestmentPlan> {
    const [plan] = await this.db.update(investmentPlans).set(data).where(eq(investmentPlans.id, id)).returning();
    return plan;
  }

  async getInvestmentPlan(id: number): Promise<InvestmentPlan | undefined> {
    const result = await this.db.select().from(investmentPlans).where(eq(investmentPlans.id, id)).limit(1);
    return result[0];
  }

  async getAllInvestmentPlans(): Promise<InvestmentPlan[]> {
    return await this.db.select().from(investmentPlans);
  }

  async deleteInvestmentPlan(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(investmentPlans).where(eq(investmentPlans.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error('Delete investment plan error:', error);
      return false;
    }
  }

  // Investment operations
  async createInvestment(data: InsertInvestment): Promise<Investment> {
    const [investment] = await this.db.insert(investments).values(data).returning();
    return investment;
  }

  async getInvestments(): Promise<Investment[]> {
    return await this.db.select().from(investments).orderBy(desc(investments.startDate));
  }

  async getInvestmentsByUserId(userId: number): Promise<Investment[]> {
    return await this.db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.startDate));
  }

  async getInvestment(id: number): Promise<Investment | undefined> {
    const result = await this.db.select().from(investments).where(eq(investments.id, id)).limit(1);
    return result[0];
  }

  async updateInvestment(id: number, data: Partial<Investment>): Promise<Investment | undefined> {
    const result = await this.db.update(investments).set(data).where(eq(investments.id, id)).returning();
    return result[0];
  }

  // Transaction operations
  async createTransaction(data: InsertTransaction): Promise<Transaction> {
    const [transaction] = await this.db.insert(transactions).values(data).returning();
    return transaction;
  }

  async getTransactions(): Promise<Transaction[]> {
    return await this.db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await this.db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async updateTransaction(id: number, data: Partial<InsertTransaction>): Promise<Transaction> {
    const [transaction] = await this.db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await this.db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async getAllTransactions(status?: string): Promise<Transaction[]> {
    let query = this.db.select().from(transactions);

    if (status) {
      query = query.where(eq(transactions.status, status));
    }

    return await query.orderBy(desc(transactions.createdAt));
  }

  async reviewTransaction(id: number, status: string, reviewedBy: number, adminNotes?: string): Promise<Transaction | null> {
    const result = await this.db
      .update(transactions)
      .set({
        status,
        adminNotes: adminNotes || null,
        reviewedBy,
        reviewedAt: new Date(),
        completedAt: status === "completed" ? new Date() : null
      })
      .where(eq(transactions.id, id))
      .returning();

    return result[0] || null;
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

    // Update transaction using the new review method
    const completedTransaction = await this.reviewTransaction(id, "completed", 1, "Auto-completed");
    return completedTransaction || undefined;
  }

  // KYC operations
  async createKycDocument(data: InsertKycDocument): Promise<KycDocument> {
    const [doc] = await this.db.insert(kycDocuments).values(data).returning();
    return doc;
  }

  async getKycDocuments(): Promise<KycDocument[]> {
    return await this.db.select().from(kycDocuments).orderBy(desc(kycDocuments.submittedAt));
  }

  async getKycDocumentsByUserId(userId: number): Promise<KycDocument[]> {
    return await this.db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId)).orderBy(desc(kycDocuments.submittedAt));
  }

  async updateKycDocument(id: number, data: Partial<InsertKycDocument>): Promise<KycDocument> {
    const [doc] = await this.db.update(kycDocuments).set(data).where(eq(kycDocuments.id, id)).returning();
    return doc;
  }

  async getKycDocument(id: number): Promise<KycDocument | undefined> {
    const result = await this.db.select().from(kycDocuments).where(eq(kycDocuments.id, id)).limit(1);
    return result[0];
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return await this.db.select().from(kycDocuments);
  }

  // Watchlist operations
  async createWatchlistItem(data: InsertWatchlistItem): Promise<WatchlistItem> {
    const [item] = await this.db.insert(watchlistItems).values(data).returning();
    return item;
  }

  async getWatchlistByUserId(userId: number): Promise<WatchlistItem[]> {
    return await this.db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
  }

  async deleteWatchlistItem(userId: number, assetId: number): Promise<void> {
    await this.db.delete(watchlistItems).where(
      and(eq(watchlistItems.userId, userId), eq(watchlistItems.assetId, assetId))
    );
  }

  async getWatchlistItem(id: number): Promise<WatchlistItem | undefined> {
    const result = await this.db.select().from(watchlistItems).where(eq(watchlistItems.id, id)).limit(1);
    return result[0];
  }

  async getWatchlistItemsByUserId(userId: number): Promise<WatchlistItem[]> {
    return await this.db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
  }

  // Copy relationship operations
  async createCopyRelationship(data: InsertCopyRelationship): Promise<CopyRelationship> {
    const [relationship] = await this.db.insert(copyRelationships).values(data).returning();
    return relationship;
  }

  async getCopyRelationshipsByFollowerId(followerId: number): Promise<CopyRelationship[]> {
    return await this.db.select().from(copyRelationships).where(eq(copyRelationships.followerId, followerId));
  }

  async getCopyRelationship(id: number): Promise<CopyRelationship | undefined> {
    const result = await this.db.select().from(copyRelationships).where(eq(copyRelationships.id, id)).limit(1);
    return result[0];
  }

  async getCopyRelationshipsByTraderId(traderId: number): Promise<CopyRelationship[]> {
    return await this.db.select().from(copyRelationships).where(eq(copyRelationships.traderId, traderId));
  }

  async updateCopyRelationship(id: number, data: Partial<CopyRelationship>): Promise<CopyRelationship | undefined> {
    const result = await this.db.update(copyRelationships).set(data).where(eq(copyRelationships.id, id)).returning();
    return result[0];
  }

  async deleteCopyRelationship(id: number): Promise<boolean> {
    const relationship = await this.getCopyRelationship(id);
    if (!relationship) return false;

    // Update trader followers count
    const trader = await this.getTrader(relationship.traderId);
    if (trader && trader.followers > 0) {
      await this.updateTrader(trader.id, { followers: trader.followers - 1 });
    }

    const result = await this.db.delete(copyRelationships).where(eq(copyRelationships.id, id));
    return result.length > 0;
  }

  // Admin stats
  async getAdminStats() {
    const totalUsers = await this.db.select().from(users);
    const totalTrades = await this.db.select().from(trades);
    const totalInvestments = await this.db.select().from(investments);
    const pendingKyc = await this.db.select().from(kycDocuments).where(eq(kycDocuments.verificationStatus, 'pending'));

    return {
      totalUsers: totalUsers.length,
      totalTrades: totalTrades.length,
      totalInvestments: totalInvestments.length,
      pendingKyc: pendingKyc.length
    };
  }
}

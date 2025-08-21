
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, desc, and } from "drizzle-orm";
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
  private db;
  private client;

  constructor(databaseUrl: string) {
    this.client = postgres(databaseUrl);
    this.db = drizzle(this.client);
  }

  async close() {
    await this.client.end();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
    return result[0];
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
  async getAsset(id: number): Promise<Asset | undefined> {
    const result = await this.db.select().from(assets).where(eq(assets.id, id)).limit(1);
    return result[0];
  }

  async getAssetBySymbol(symbol: string): Promise<Asset | undefined> {
    const result = await this.db.select().from(assets).where(eq(assets.symbol, symbol)).limit(1);
    return result[0];
  }

  async getAssets(type?: string): Promise<Asset[]> {
    if (type) {
      return await this.db.select().from(assets).where(eq(assets.type, type));
    }
    return await this.db.select().from(assets);
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const result = await this.db.insert(assets).values(asset).returning();
    return result[0];
  }

  async updateAsset(id: number, data: Partial<Asset>): Promise<Asset | undefined> {
    const result = await this.db.update(assets).set(data).where(eq(assets.id, id)).returning();
    return result[0];
  }

  // Trader operations
  async getTrader(id: number): Promise<Trader | undefined> {
    const result = await this.db.select().from(traders).where(eq(traders.id, id)).limit(1);
    return result[0];
  }

  async getTraderByUserId(userId: number): Promise<Trader | undefined> {
    const result = await this.db.select().from(traders).where(eq(traders.userId, userId)).limit(1);
    return result[0];
  }

  async getTraders(): Promise<Trader[]> {
    return await this.db.select().from(traders);
  }

  async createTrader(trader: InsertTrader): Promise<Trader> {
    const result = await this.db.insert(traders).values(trader).returning();
    return result[0];
  }

  async updateTrader(id: number, data: Partial<Trader>): Promise<Trader | undefined> {
    const result = await this.db.update(traders).set(data).where(eq(traders.id, id)).returning();
    return result[0];
  }

  // Copy relationship operations
  async getCopyRelationship(id: number): Promise<CopyRelationship | undefined> {
    const result = await this.db.select().from(copyRelationships).where(eq(copyRelationships.id, id)).limit(1);
    return result[0];
  }

  async getCopyRelationshipsByFollowerId(followerId: number): Promise<CopyRelationship[]> {
    return await this.db.select().from(copyRelationships).where(eq(copyRelationships.followerId, followerId));
  }

  async getCopyRelationshipsByTraderId(traderId: number): Promise<CopyRelationship[]> {
    return await this.db.select().from(copyRelationships).where(eq(copyRelationships.traderId, traderId));
  }

  async createCopyRelationship(relationship: InsertCopyRelationship): Promise<CopyRelationship> {
    const result = await this.db.insert(copyRelationships).values(relationship).returning();
    
    // Update trader followers count
    const trader = await this.getTrader(relationship.traderId);
    if (trader) {
      await this.updateTrader(trader.id, { followers: trader.followers + 1 });
    }
    
    return result[0];
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

  // Trade operations
  async getTrade(id: number): Promise<Trade | undefined> {
    const result = await this.db.select().from(trades).where(eq(trades.id, id)).limit(1);
    return result[0];
  }

  async getTradesByUserId(userId: number): Promise<Trade[]> {
    return await this.db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.createdAt));
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const result = await this.db.insert(trades).values(trade).returning();
    return result[0];
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
    const result = await this.db.select().from(investmentPlans).where(eq(investmentPlans.id, id)).limit(1);
    return result[0];
  }

  async getInvestmentPlans(): Promise<InvestmentPlan[]> {
    return await this.db.select().from(investmentPlans).where(eq(investmentPlans.status, "active"));
  }

  async createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const result = await this.db.insert(investmentPlans).values(plan).returning();
    return result[0];
  }

  async updateInvestmentPlan(id: number, data: Partial<InvestmentPlan>): Promise<InvestmentPlan | undefined> {
    const result = await this.db.update(investmentPlans).set(data).where(eq(investmentPlans.id, id)).returning();
    return result[0];
  }

  // Investment operations
  async getInvestment(id: number): Promise<Investment | undefined> {
    const result = await this.db.select().from(investments).where(eq(investments.id, id)).limit(1);
    return result[0];
  }

  async getInvestmentsByUserId(userId: number): Promise<Investment[]> {
    return await this.db.select().from(investments).where(eq(investments.userId, userId)).orderBy(desc(investments.startDate));
  }

  async createInvestment(investment: InsertInvestment): Promise<Investment> {
    const result = await this.db.insert(investments).values(investment).returning();

    // Deduct amount from user balance
    const user = await this.getUser(investment.userId);
    if (user) {
      await this.updateUserBalance(
        user.id, 
        parseFloat(investment.amount.toString()), 
        false
      );
    }

    return result[0];
  }

  async updateInvestment(id: number, data: Partial<Investment>): Promise<Investment | undefined> {
    const result = await this.db.update(investments).set(data).where(eq(investments.id, id)).returning();
    return result[0];
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const result = await this.db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await this.db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await this.db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await this.db.update(transactions).set(data).where(eq(transactions.id, id)).returning();
    return result[0];
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
    const result = await this.db.select().from(kycDocuments).where(eq(kycDocuments.id, id)).limit(1);
    return result[0];
  }

  async getKycDocumentsByUserId(userId: number): Promise<KycDocument[]> {
    return await this.db.select().from(kycDocuments).where(eq(kycDocuments.userId, userId)).orderBy(desc(kycDocuments.submittedAt));
  }

  async createKycDocument(document: InsertKycDocument): Promise<KycDocument> {
    const result = await this.db.insert(kycDocuments).values(document).returning();

    // Update user KYC status
    const user = await this.getUser(document.userId);
    if (user && user.kycStatus === "unverified") {
      await this.updateUser(user.id, { kycStatus: "pending" });
    }

    return result[0];
  }

  async updateKycDocument(id: number, data: Partial<KycDocument>): Promise<KycDocument | undefined> {
    const result = await this.db.update(kycDocuments).set(data).where(eq(kycDocuments.id, id)).returning();

    // Update user KYC status if document is verified/rejected
    if (data.verificationStatus) {
      const document = result[0];
      if (document) {
        const user = await this.getUser(document.userId);
        if (user) {
          if (data.verificationStatus === "verified") {
            await this.updateUser(user.id, { kycStatus: "verified" });
          } else if (data.verificationStatus === "rejected") {
            await this.updateUser(user.id, { kycStatus: "unverified" });
          }
        }
      }
    }

    return result[0];
  }

  // Watchlist operations
  async getWatchlistItem(id: number): Promise<WatchlistItem | undefined> {
    const result = await this.db.select().from(watchlistItems).where(eq(watchlistItems.id, id)).limit(1);
    return result[0];
  }

  async getWatchlistItemsByUserId(userId: number): Promise<WatchlistItem[]> {
    return await this.db.select().from(watchlistItems).where(eq(watchlistItems.userId, userId));
  }

  async createWatchlistItem(item: InsertWatchlistItem): Promise<WatchlistItem> {
    // Check if item already exists
    const existing = await this.db.select().from(watchlistItems)
      .where(and(eq(watchlistItems.userId, item.userId), eq(watchlistItems.assetId, item.assetId)))
      .limit(1);
    
    if (existing.length > 0) {
      return existing[0];
    }

    const result = await this.db.insert(watchlistItems).values(item).returning();
    return result[0];
  }

  async deleteWatchlistItem(id: number): Promise<boolean> {
    const result = await this.db.delete(watchlistItems).where(eq(watchlistItems.id, id));
    return result.length > 0;
  }

  // Asset operations
  async createAsset(asset: InsertAsset): Promise<Asset> {
    const result = await this.db.insert(assets).values(asset).returning();
    return result[0];
  }

  // Investment plan operations
  async createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const result = await this.db.insert(investmentPlans).values(plan).returning();
    return result[0];
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async getAllKycDocuments(): Promise<KycDocument[]> {
    return await this.db.select().from(kycDocuments);
  }

  async getAllTrades(): Promise<Trade[]> {
    return await this.db.select().from(trades);
  }
}

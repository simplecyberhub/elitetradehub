import { pgTable, text, serial, numeric, boolean, jsonb, timestamp, integer, varchar, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0").notNull(),
  avatar: text("avatar"),
  kycStatus: text("kyc_status").default("unverified").notNull(), // unverified, pending, verified
  role: text("role").default("user").notNull(), // user, admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  kycStatus: true,
  role: true,
  createdAt: true,
});

// Market assets (stocks, crypto, forex)
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // stock, crypto, forex
  price: numeric("price", { precision: 12, scale: 6 }).notNull(),
  change24h: numeric("change_24h", { precision: 5, scale: 2 }).default("0").notNull(),
  volume24h: numeric("volume_24h", { precision: 20, scale: 2 }),
  marketCap: numeric("market_cap", { precision: 20, scale: 2 }),
  logoUrl: text("logo_url"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
});

// Trader profiles for copy trading
export const traders = pgTable("traders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bio: text("bio"),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }).default("0").notNull(),
  profit30d: numeric("profit_30d", { precision: 6, scale: 2 }).default("0").notNull(),
  followers: integer("followers").default(0).notNull(),
  rating: numeric("rating", { precision: 3, scale: 1 }).default("0").notNull(),
  status: text("status").default("active").notNull(), // active, inactive
});

export const insertTraderSchema = createInsertSchema(traders).omit({
  id: true,
  followers: true,
  rating: true,
  status: true,
});

// Copy relationships
export const copyRelationships = pgTable("copy_relationships", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => users.id),
  traderId: integer("trader_id").notNull().references(() => traders.id),
  allocationPercentage: numeric("allocation_percentage", { precision: 5, scale: 2 }).default("100").notNull(),
  status: text("status").default("active").notNull(), // active, paused, stopped
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCopyRelationshipSchema = createInsertSchema(copyRelationships).omit({
  id: true,
  createdAt: true,
});

// Trades/Orders
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  type: text("type").notNull(), // buy, sell
  amount: numeric("amount", { precision: 12, scale: 8 }).notNull(),
  price: numeric("price", { precision: 12, scale: 6 }).notNull(),
  status: text("status").notNull(), // pending, executed, canceled
  executedAt: timestamp("executed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  copiedFromTradeId: integer("copied_from_trade_id"),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
  createdAt: true,
});

// Investment plans
export const investmentPlans = pgTable("investment_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  minAmount: numeric("min_amount", { precision: 12, scale: 2 }).notNull(),
  maxAmount: numeric("max_amount", { precision: 12, scale: 2 }),
  roiPercentage: numeric("roi_percentage", { precision: 5, scale: 2 }).notNull(),
  lockPeriodDays: integer("lock_period_days").notNull(),
  features: jsonb("features").notNull(),
  status: text("status").default("active").notNull(), // active, inactive
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans).omit({
  id: true,
  status: true,
});

// User investments
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  planId: integer("plan_id").notNull().references(() => investmentPlans.id),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  profit: decimal("profit", { precision: 15, scale: 2 }).default("0.00"),
  totalReturn: decimal("total_return", { precision: 15, scale: 2 }).default("0.00"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Modified insertInvestmentSchema to handle date transformation
export const insertInvestmentSchema = createInsertSchema(investments, {
  startDate: z.preprocess((val) => new Date(val as string), z.date()),
  endDate: z.preprocess((val) => new Date(val as string), z.date()),
}).omit({
  id: true,
  status: true, // Assuming status is managed internally or defaults correctly
  profit: true, // Profit is usually calculated, not inserted directly
  totalReturn: true, // Total return is usually calculated
  completedAt: true, // Completed at is a timestamp of completion
});


// Transactions (deposits, withdrawals) with admin approval system
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // deposit, withdrawal, investment
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull(), // pending, completed, failed
  method: text("method"), // bank_transfer, crypto, balance, etc.
  paymentProof: text("payment_proof"),
  adminNotes: text("admin_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  description: text("description"), // Additional description for investments
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  reviewedBy: true,
  reviewedAt: true,
  createdAt: true,
  completedAt: true,
});

// Admin transaction review schema
export const reviewTransactionSchema = z.object({
  transactionId: z.number(),
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().optional(),
});

export type ReviewTransaction = z.infer<typeof reviewTransactionSchema>;

// KYC Documents
export const kycDocuments = pgTable("kyc_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // passport, drivers_license, national_id
  documentNumber: text("document_number").notNull(),
  expiryDate: text("expiry_date"),
  verificationStatus: text("verification_status").default("pending").notNull(), // pending, verified, rejected
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertKycDocumentSchema = createInsertSchema(kycDocuments).omit({
  id: true,
  verificationStatus: true,
  rejectionReason: true,
  submittedAt: true,
});

// Watchlist
export const watchlistItems = pgTable("watchlist_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  assetId: integer("asset_id").notNull().references(() => assets.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWatchlistItemSchema = createInsertSchema(watchlistItems).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type Trader = typeof traders.$inferSelect;
export type InsertTrader = z.infer<typeof insertTraderSchema>;

export type CopyRelationship = typeof copyRelationships.$inferSelect;
export type InsertCopyRelationship = z.infer<typeof insertCopyRelationshipSchema>;

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;

export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type KycDocument = typeof kycDocuments.$inferSelect;
export type InsertKycDocument = z.infer<typeof insertKycDocumentSchema>;

export type WatchlistItem = typeof watchlistItems.$inferSelect;
export type InsertWatchlistItem = z.infer<typeof insertWatchlistItemSchema>;

// Platform settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull(), // trading, email, system
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Sessions table for express-session with connect-pg-simple
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { mode: 'date' }).notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // info, success, warning, error
  read: boolean("read").default(false).notNull(),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Export types for settings
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Export types for notifications
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
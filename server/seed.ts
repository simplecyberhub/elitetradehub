
import { DbStorage } from "./db-storage";
import type { InsertUser, InsertAsset, InsertTrader, InsertInvestmentPlan } from "@shared/schema";

export async function seedDatabase(storage: DbStorage) {
  console.log("Seeding database...");

  try {
    // Create admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      fullName: "Administrator",
    };
    const admin = await storage.createUser(adminUser);
    await storage.updateUser(admin.id, { role: "admin" });
    console.log("Created admin user:", admin.username);

    // Create demo user
    const demoUser: InsertUser = {
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "John Smith",
    };
    const user = await storage.createUser(demoUser);
    console.log("Created demo user:", user.username);

    // Seed assets (stocks)
    const stockAssets: InsertAsset[] = [
      { symbol: "AAPL", name: "Apple Inc.", type: "stock", price: "182.63", change24h: "1.45", volume24h: "34567890", marketCap: "2987654321", logoUrl: "" },
      { symbol: "MSFT", name: "Microsoft Corporation", type: "stock", price: "334.27", change24h: "0.75", volume24h: "12345678", marketCap: "2498765432", logoUrl: "" },
      { symbol: "AMZN", name: "Amazon.com Inc.", type: "stock", price: "129.12", change24h: "0.83", volume24h: "9876543", marketCap: "1324567890", logoUrl: "" },
      { symbol: "GOOGL", name: "Alphabet Inc.", type: "stock", price: "134.99", change24h: "-0.32", volume24h: "5432109", marketCap: "1765432109", logoUrl: "" },
      { symbol: "TSLA", name: "Tesla Inc.", type: "stock", price: "238.45", change24h: "-2.07", volume24h: "20987654", marketCap: "756432109", logoUrl: "" },
      { symbol: "NFLX", name: "Netflix Inc.", type: "stock", price: "415.72", change24h: "3.21", volume24h: "4321098", marketCap: "187654321", logoUrl: "" },
      { symbol: "META", name: "Meta Platforms Inc.", type: "stock", price: "286.39", change24h: "2.19", volume24h: "9871234", marketCap: "732109876", logoUrl: "" },
      { symbol: "NVDA", name: "NVIDIA Corporation", type: "stock", price: "487.98", change24h: "4.32", volume24h: "15678901", marketCap: "1201234567", logoUrl: "" }
    ];

    for (const asset of stockAssets) {
      await storage.createAsset(asset);
    }
    console.log("Created stock assets");

    // Seed assets (crypto)
    const cryptoAssets: InsertAsset[] = [
      { symbol: "BTC/USD", name: "Bitcoin", type: "crypto", price: "38245.86", change24h: "3.24", volume24h: "28765432109", marketCap: "765432198765", logoUrl: "" },
      { symbol: "ETH/USD", name: "Ethereum", type: "crypto", price: "2256.78", change24h: "2.87", volume24h: "15678901234", marketCap: "265432198765", logoUrl: "" },
      { symbol: "SOL/USD", name: "Solana", type: "crypto", price: "76.32", change24h: "5.67", volume24h: "5432109876", marketCap: "32198765432", logoUrl: "" },
      { symbol: "XRP/USD", name: "Ripple", type: "crypto", price: "0.56", change24h: "-1.23", volume24h: "3210987654", marketCap: "27654321098", logoUrl: "" }
    ];

    for (const asset of cryptoAssets) {
      await storage.createAsset(asset);
    }
    console.log("Created crypto assets");

    // Seed assets (forex)
    const forexAssets: InsertAsset[] = [
      { symbol: "EUR/USD", name: "Euro/US Dollar", type: "forex", price: "1.0742", change24h: "-0.23", volume24h: "98765432109", marketCap: "0", logoUrl: "" },
      { symbol: "GBP/USD", name: "British Pound/US Dollar", type: "forex", price: "1.2654", change24h: "0.12", volume24h: "5432109876", marketCap: "0", logoUrl: "" },
      { symbol: "USD/JPY", name: "US Dollar/Japanese Yen", type: "forex", price: "153.67", change24h: "0.45", volume24h: "7654321098", marketCap: "0", logoUrl: "" },
      { symbol: "USD/CAD", name: "US Dollar/Canadian Dollar", type: "forex", price: "1.3765", change24h: "-0.18", volume24h: "4321098765", marketCap: "0", logoUrl: "" }
    ];

    for (const asset of forexAssets) {
      await storage.createAsset(asset);
    }
    console.log("Created forex assets");

    // Create extra users for traders
    const traderUsers: InsertUser[] = [
      { username: "michael", password: "password", email: "michael@example.com", fullName: "Michael Thompson" },
      { username: "sarah", password: "password", email: "sarah@example.com", fullName: "Sarah Johnson" },
      { username: "robert", password: "password", email: "robert@example.com", fullName: "Robert Kim" }
    ];

    const traders: InsertTrader[] = [
      { userId: 0, bio: "Professional trader with 10 years of experience", winRate: "82.0", profit30d: "18.7", rating: "4.5" },
      { userId: 0, bio: "Cryptocurrency specialist", winRate: "76.0", profit30d: "12.3", rating: "4.0" },
      { userId: 0, bio: "Forex and commodities expert", winRate: "91.0", profit30d: "23.5", rating: "5.0" }
    ];

    for (let i = 0; i < traderUsers.length; i++) {
      const traderUser = await storage.createUser(traderUsers[i]);
      await storage.createTrader({ ...traders[i], userId: traderUser.id });
    }
    console.log("Created trader users and profiles");

    // Seed investment plans
    const investmentPlans: InsertInvestmentPlan[] = [
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
        maxAmount: null,
        roiPercentage: "16.5",
        lockPeriodDays: 7,
        features: ["15-18% Monthly ROI", "Dedicated Account Manager", "7-day lock period"]
      }
    ];

    for (const plan of investmentPlans) {
      await storage.createInvestmentPlan(plan);
    }
    console.log("Created investment plans");

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

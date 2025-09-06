import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { marketDataService } from "./market-data";
import { z } from "zod";
import {
  insertUserSchema, insertAssetSchema, insertTraderSchema,
  insertCopyRelationshipSchema, insertTradeSchema, insertInvestmentPlanSchema,
  insertInvestmentSchema, insertTransactionSchema, insertKycDocumentSchema,
  insertWatchlistItemSchema, reviewTransactionSchema
} from "@shared/schema";
import {
  requireAuth, requireAdmin, hashPassword, validatePassword,
  sendWelcomeEmail, sendTransactionEmail, sendKycStatusEmail,
  configureSession, configureSecurity, validateInputs, validateEmail,
  validateUsername, validatePasswordStrength, validateAmount, sanitizeInput
} from "./auth";
import {
  errorHandler, asyncHandler, requestLogger, healthCheck,
  ValidationError, AuthenticationError, ConflictError
} from "./error-handler";

// Authentication and security middleware configured in auth.ts

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure security and session management
  configureSecurity(app);
  configureSession(app);

  // Add request logging
  app.use(requestLogger);

  // Health check endpoint
  app.get('/health', healthCheck);

  // Initialize storage
  const storageInstance = await storage;

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await storageInstance.getAllUsers();
      const users = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      // Handle balance adjustment
      if (updates.balanceAdjustment) {
        const { amount, type } = updates.balanceAdjustment;
        const user = await storageInstance.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const currentBalance = parseFloat(user.balance || "0");
        const adjustmentAmount = parseFloat(amount);
        const newBalance = type === 'add'
          ? currentBalance + adjustmentAmount
          : Math.max(0, currentBalance - adjustmentAmount);

        updates.balance = newBalance.toString();
        delete updates.balanceAdjustment;
      }

      const updatedUser = await storageInstance.updateUser(userId, updates);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/admin/kyc-documents", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const allDocuments = await storageInstance.getAllKycDocuments();
      const documents = await Promise.all(allDocuments.map(async (doc) => {
        const user = await storageInstance.getUser(doc.userId);
        const { password, ...userWithoutPassword } = user || {};
        return {
          ...doc,
          user: userWithoutPassword
        };
      }));

      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get KYC documents" });
    }
  });

  app.patch("/api/admin/kyc-documents/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const docId = parseInt(req.params.id);
      const { verificationStatus, rejectionReason } = req.body;

      // Get the KYC document first to get user info
      const existingDoc = await storageInstance.getKycDocument(docId);
      if (!existingDoc) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      const user = await storageInstance.getUser(existingDoc.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedDoc = await storageInstance.updateKycDocument(docId, {
        verificationStatus,
        rejectionReason
      });

      if (!updatedDoc) {
        return res.status(404).json({ message: "KYC document not found" });
      }

      // Update user KYC status if approved
      if (verificationStatus === 'verified') {
        await storageInstance.updateUser(existingDoc.userId, { kycStatus: 'verified' });
      } else if (verificationStatus === 'rejected') {
        await storageInstance.updateUser(existingDoc.userId, { kycStatus: 'unverified' });
      }

      // Send KYC status email notification
      await sendKycStatusEmail(user.email, verificationStatus);

      res.status(200).json(updatedDoc);
    } catch (error) {
      res.status(500).json({ message: "Failed to update KYC document" });
    }
  });

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const allUsers = await storageInstance.getAllUsers();
      const allTrades = await storageInstance.getAllTrades();
      const allDocuments = await storageInstance.getAllKycDocuments();

      const totalUsers = allUsers.length;
      const totalTrades = allTrades.length;
      const totalInvestments = 0; // Placeholder, would need getAllInvestments method
      const pendingKyc = allDocuments.filter(doc => doc.verificationStatus === 'pending').length;

      res.status(200).json({
        totalUsers,
        totalTrades,
        totalInvestments,
        pendingKyc
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get admin stats" });
    }
  });

  app.get("/api/admin/trades", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const allTrades = await storageInstance.getAllTrades();
      const trades = await Promise.all(allTrades.map(async (trade) => {
        const user = await storageInstance.getUser(trade.userId);
        const asset = await storageInstance.getAsset(trade.assetId);
        const { password, ...userWithoutPassword } = user || {};

        return {
          ...trade,
          user: userWithoutPassword,
          asset
        };
      }));

      // Sort by creation date (newest first)
      trades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.status(200).json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trades" });
    }
  });

  // Admin assets management
  app.get("/api/admin/assets", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const assets = await storageInstance.getAssets();
      res.status(200).json(assets);
    } catch (error) {
      console.error("Get admin assets error:", error);
      res.status(500).json({ message: "Failed to get assets" });
    }
  });

  app.post("/api/admin/assets", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertAssetSchema.parse({
        symbol: req.body.symbol,
        name: req.body.name,
        type: req.body.type,
        price: req.body.currentPrice || req.body.price
      });
      const newAsset = await storageInstance.createAsset(validatedData);
      res.status(201).json(newAsset);
    } catch (error) {
      console.error("Create asset error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create asset" });
      }
    }
  });

  app.patch("/api/admin/assets/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const updates = req.body;
      
      // Map currentPrice to price if it exists
      if (updates.currentPrice && !updates.price) {
        updates.price = updates.currentPrice;
      }
      
      const updatedAsset = await storageInstance.updateAsset(assetId, updates);
      
      if (!updatedAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.status(200).json(updatedAsset);
    } catch (error) {
      console.error("Update asset error:", error);
      res.status(500).json({ message: "Failed to update asset" });
    }
  });

  app.delete("/api/admin/assets/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const success = await storageInstance.deleteAsset(assetId);
      
      if (!success) {
        return res.status(404).json({ message: "Asset not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete asset error:", error);
      res.status(500).json({ message: "Failed to delete asset" });
    }
  });

  // Admin investment plans management
  app.get("/api/admin/investment-plans", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const plans = await storageInstance.getAllInvestmentPlans();
      res.status(200).json(plans);
    } catch (error) {
      console.error("Get admin investment plans error:", error);
      res.status(500).json({ message: "Failed to get investment plans" });
    }
  });

  app.post("/api/admin/investment-plans", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Parse duration string to days
      let lockPeriodDays = req.body.lockPeriodDays || req.body.duration;
      if (typeof lockPeriodDays === 'string') {
        const durationMatch = lockPeriodDays.match(/(\d+)\s*(day|days|week|weeks|month|months|year|years)/i);
        if (durationMatch) {
          const value = parseInt(durationMatch[1]);
          const unit = durationMatch[2].toLowerCase();
          switch (unit) {
            case 'day':
            case 'days':
              lockPeriodDays = value;
              break;
            case 'week':
            case 'weeks':
              lockPeriodDays = value * 7;
              break;
            case 'month':
            case 'months':
              lockPeriodDays = value * 30;
              break;
            case 'year':
            case 'years':
              lockPeriodDays = value * 365;
              break;
            default:
              lockPeriodDays = parseInt(lockPeriodDays) || 1;
          }
        } else {
          lockPeriodDays = parseInt(lockPeriodDays) || 1;
        }
      }

      const validatedData = {
        name: req.body.name,
        description: req.body.description,
        minAmount: req.body.minAmount,
        maxAmount: req.body.maxAmount || null,
        roiPercentage: req.body.roiPercentage || req.body.expectedReturn,
        lockPeriodDays: lockPeriodDays,
        features: req.body.features || [],
        status: req.body.status || 'active'
      };
      const newPlan = await storageInstance.createInvestmentPlan(validatedData);
      res.status(201).json(newPlan);
    } catch (error) {
      console.error("Create investment plan error:", error);
      res.status(500).json({ message: "Failed to create investment plan" });
    }
  });

  app.patch("/api/admin/investment-plans/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.id);
      const updates = req.body;
      const updatedPlan = await storageInstance.updateInvestmentPlan(planId, updates);
      
      if (!updatedPlan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }
      
      res.status(200).json(updatedPlan);
    } catch (error) {
      console.error("Update investment plan error:", error);
      res.status(500).json({ message: "Failed to update investment plan" });
    }
  });

  app.delete("/api/admin/investment-plans/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.id);
      const success = await storageInstance.deleteInvestmentPlan(planId);
      
      if (!success) {
        return res.status(404).json({ message: "Investment plan not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete investment plan error:", error);
      res.status(500).json({ message: "Failed to delete investment plan" });
    }
  });

  // Settings management endpoints
  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const allSettings = await storageInstance.getAllSettings();
      
      // Group settings by category for easier frontend handling
      const groupedSettings = allSettings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
        acc[setting.category][setting.key] = setting.value;
        return acc;
      }, {} as Record<string, Record<string, string>>);

      res.status(200).json(groupedSettings);
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.post("/api/admin/settings", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const settingsData = req.body;
      const updatedSettings = [];

      // Update each setting
      for (const [category, categorySettings] of Object.entries(settingsData)) {
        for (const [key, value] of Object.entries(categorySettings as Record<string, string>)) {
          const updatedSetting = await storageInstance.updateSetting(key, value);
          if (updatedSetting) {
            updatedSettings.push(updatedSetting);
          }
        }
      }

      res.status(200).json({
        message: "Settings updated successfully",
        updatedCount: updatedSettings.length
      });
    } catch (error) {
      console.error("Update settings error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Export data endpoints
  app.get("/api/admin/export/:type", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      let data: any[] = [];
      let filename = '';

      switch (type) {
        case 'users':
          data = await storageInstance.getAllUsers();
          filename = 'users-export.csv';
          break;
        case 'transactions':
          data = await storageInstance.getAllTransactions();
          filename = 'transactions-export.csv';
          break;
        case 'trades':
          data = await storageInstance.getAllTrades();
          filename = 'trades-export.csv';
          break;
        default:
          return res.status(400).json({ message: "Invalid export type" });
      }

      // Convert to CSV
      if (data.length === 0) {
        return res.status(404).json({ message: "No data found" });
      }

      const csvHeaders = Object.keys(data[0]).filter(key => key !== 'password').join(',');
      const csvRows = data.map(item => {
        const { password, ...itemWithoutPassword } = item;
        return Object.values(itemWithoutPassword).map(value =>
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',');
      });

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // User routes
  app.post("/api/auth/register",
    validateInputs({
      username: validateUsername,
      email: validateEmail,
      password: validatePasswordStrength
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const validatedData = insertUserSchema.parse(req.body);

      // Sanitize inputs
      const sanitizedData = {
        ...validatedData,
        username: sanitizeInput(validatedData.username),
        email: sanitizeInput(validatedData.email).toLowerCase(),
        fullName: sanitizeInput(validatedData.fullName)
      };

      // Check if username or email already exists
      const existingUser = await storageInstance.getUserByUsername(sanitizedData.username);
      if (existingUser) {
        throw new ConflictError("Username already exists");
      }

      const existingEmail = await storageInstance.getUserByEmail(sanitizedData.email);
      if (existingEmail) {
        throw new ConflictError("Email already exists");
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(sanitizedData.password);
      const userDataWithHashedPassword = {
        ...sanitizedData,
        password: hashedPassword
      };

      const newUser = await storageInstance.createUser(userDataWithHashedPassword);

      // Set up session
      req.session.userId = newUser.id;
      req.session.userRole = newUser.role;

      // Send welcome email
      await sendWelcomeEmail(newUser.email, newUser.username);

      // Don't return password in response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    })
  );

  // Login route
  app.post("/api/auth/login",
    validateInputs({
      username: (val) => typeof val === 'string' && val.length > 0,
      password: (val) => typeof val === 'string' && val.length > 0
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const { username, password } = req.body;
      console.log("Login attempt for username:", sanitizeInput(username));

      const sanitizedUsername = sanitizeInput(username);
      const user = await storageInstance.getUserByUsername(sanitizedUsername);

      if (!user) {
        console.log("User not found for username:", sanitizedUsername);
        throw new AuthenticationError("Invalid username or password");
      }

      // Validate password using bcrypt
      const isValidPassword = await validatePassword(password, user.password);
      if (!isValidPassword) {
        console.log("Invalid password for username:", sanitizedUsername);
        throw new AuthenticationError("Invalid username or password");
      }

      // Ensure session is properly initialized
      if (!req.session) {
        console.error("Session not initialized");
        throw new Error("Session not initialized");
      }

      // Set user session
      req.session.userId = user.id;
      req.session.userRole = user.role;

      console.log("Setting session - User ID:", user.id, "Session ID:", req.sessionID);

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }

        console.log("Session saved successfully for user:", user.id);
        console.log("Session data:", { userId: req.session.userId, userRole: req.session.userRole });

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })
  );

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      console.log('Me endpoint - Session exists:', !!req.session);
      console.log('Me endpoint - Session ID:', req.sessionID);
      console.log('Me endpoint - User ID:', req.session?.userId);

      if (!req.session || !req.session.userId) {
        console.log('Me endpoint - No session or userId');
        return res.status(401).json({ message: 'Authentication required' });
      }

      const user = await storageInstance.getUser(req.session.userId);
      if (!user) {
        console.log('Me endpoint - User not found for ID:', req.session.userId);
        return res.status(404).json({ message: "User not found" });
      }

      console.log('Me endpoint - User found:', user.username);
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/user/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storageInstance.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.patch("/api/user/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);

      // Validate the request body
      const validatedData = z.object({
        fullName: z.string().min(2).optional(),
        email: z.string().email().optional(),
        phoneNumber: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      }).parse(req.body);

      // Ensure user can only update their own profile
      if (req.session?.userId !== userId) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const user = await storageInstance.updateUser(userId, validatedData);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error); // Added logging for clarity
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  });


  // Asset routes
  app.get("/api/assets", async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string | undefined;
      const assets = await storageInstance.getAssets(type);
      res.status(200).json(assets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get assets" });
    }
  });

  app.get("/api/assets/:id", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storageInstance.getAsset(assetId);

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      res.status(200).json(asset);
    } catch (error) {
      res.status(500).json({ message: "Failed to get asset" });
    }
  });

  // Trader routes
  app.get("/api/traders", async (req: Request, res: Response) => {
    try {
      const traders = await storageInstance.getTraders();

      // Get user details for each trader
      const tradersWithDetails = await Promise.all(traders.map(async (trader) => {
        const user = await storageInstance.getUser(trader.userId);
        if (!user) return null;

        const { password, ...userWithoutPassword } = user;
        return {
          ...trader,
          user: userWithoutPassword
        };
      }));

      // Remove null entries
      const filteredTraders = tradersWithDetails.filter(Boolean);

      res.status(200).json(filteredTraders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get traders" });
    }
  });

  app.get("/api/traders/:id", async (req: Request, res: Response) => {
    try {
      const traderId = parseInt(req.params.id);
      const trader = await storageInstance.getTrader(traderId);

      if (!trader) {
        return res.status(404).json({ message: "Trader not found" });
      }

      const user = await storageInstance.getUser(trader.userId);
      if (!user) {
        return res.status(404).json({ message: "Trader user not found" });
      }

      // Don't return password in response
      const { password, ...userWithoutPassword } = user;

      res.status(200).json({
        ...trader,
        user: userWithoutPassword
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get trader" });
    }
  });

  // Copy trading routes
  app.post("/api/copy-trading", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCopyRelationshipSchema.parse(req.body);

      // Check if follower exists
      const follower = await storageInstance.getUser(validatedData.followerId);
      if (!follower) {
        return res.status(404).json({ message: "Follower not found" });
      }

      // Check if trader exists
      const trader = await storageInstance.getTrader(validatedData.traderId);
      if (!trader) {
        return res.status(404).json({ message: "Trader not found" });
      }

      // Check if relationship already exists
      const existingRelationships = await storageInstance.getCopyRelationshipsByFollowerId(validatedData.followerId);
      const existingRelationship = existingRelationships.find(r => r.traderId === validatedData.traderId);

      if (existingRelationship) {
        return res.status(400).json({ message: "Already following this trader" });
      }

      const newRelationship = await storageInstance.createCopyRelationship(validatedData);
      res.status(201).json(newRelationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create copy relationship" });
      }
    }
  });

  app.get("/api/user/:userId/copy-trading", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const relationships = await storageInstance.getCopyRelationshipsByFollowerId(userId);

      // Get trader details for each relationship
      const relationshipsWithDetails = await Promise.all(relationships.map(async (relationship) => {
        const trader = await storageInstance.getTrader(relationship.traderId);
        if (!trader) return null;

        const user = await storageInstance.getUser(trader.userId);
        if (!user) return null;

        // Don't return password in response
        const { password, ...userWithoutPassword } = user;

        return {
          ...relationship,
          trader: {
            ...trader,
            user: userWithoutPassword
          }
        };
      }));

      // Remove null entries
      const filteredRelationships = relationshipsWithDetails.filter(Boolean);

      res.status(200).json(filteredRelationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to get copy relationships" });
    }
  });

  app.patch("/api/copy-trading/:id", async (req: Request, res: Response) => {
    try {
      const relationshipId = parseInt(req.params.id);
      const relationship = await storageInstance.getCopyRelationship(relationshipId);

      if (!relationship) {
        return res.status(404).json({ message: "Copy relationship not found" });
      }

      const validatedData = z.object({
        allocationPercentage: z.number().min(1).max(100).optional().transform(val => val ? val.toString() : undefined),
        status: z.enum(["active", "paused", "stopped"]).optional()
      }).parse(req.body);

      const updatedRelationship = await storageInstance.updateCopyRelationship(relationshipId, validatedData);

      if (!updatedRelationship) {
        return res.status(404).json({ message: "Copy relationship not found" });
      }

      res.status(200).json(updatedRelationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update copy relationship" });
      }
    }
  });

  app.delete("/api/copy-trading/:id", async (req: Request, res: Response) => {
    try {
      const relationshipId = parseInt(req.params.id);
      const relationship = await storageInstance.getCopyRelationship(relationshipId);

      if (!relationship) {
        return res.status(404).json({ message: "Copy relationship not found" });
      }

      const result = await storageInstance.deleteCopyRelationship(relationshipId);

      if (!result) {
        return res.status(404).json({ message: "Copy relationship not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete copy relationship" });
    }
  });

  // Trade routes
  app.post("/api/trades", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTradeSchema.parse(req.body);

      // Check if user exists
      const user = await storageInstance.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if asset exists
      const asset = await storageInstance.getAsset(validatedData.assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const newTrade = await storageInstance.createTrade(validatedData);

      // Auto-execute the trade if it's not a copy
      if (!validatedData.copiedFromTradeId && validatedData.status === "pending") {
        try {
          const executedTrade = await storageInstance.executeTrade(newTrade.id);
          if (executedTrade) {
            return res.status(201).json(executedTrade);
          }
        } catch (error) {
          // If execution fails, still return the created trade
          console.error("Trade execution failed:", error);
        }
      }

      res.status(201).json(newTrade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create trade" });
      }
    }
  });

  app.get("/api/user/:userId/trades", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storageInstance.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const trades = await storageInstance.getTradesByUserId(userId);

      // Get asset details for each trade
      const tradesWithAssets = await Promise.all(trades.map(async (trade) => {
        const asset = await storageInstance.getAsset(trade.assetId);
        return {
          ...trade,
          asset
        };
      }));

      res.status(200).json(tradesWithAssets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trades" });
    }
  });

  app.get("/api/trades/:id", async (req: Request, res: Response) => {
    try {
      const tradeId = parseInt(req.params.id);
      const trade = await storageInstance.getTrade(tradeId);

      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }

      const asset = await storageInstance.getAsset(trade.assetId);

      res.status(200).json({
        ...trade,
        asset
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get trade" });
    }
  });

  // Investment plan routes
  app.get("/api/investment-plans", async (req: Request, res: Response) => {
    try {
      const plans = await storageInstance.getInvestmentPlans();
      res.status(200).json(plans);
    } catch (error) {
      res.status(500).json({ message: "Failed to get investment plans" });
    }
  });

  app.get("/api/investment-plans/:id", async (req: Request, res: Response) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storageInstance.getInvestmentPlan(planId);

      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      res.status(200).json(plan);
    } catch (error) {
      res.status(500).json({ message: "Failed to get investment plan" });
    }
  });

  // Investment routes
  app.post("/api/investments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertInvestmentSchema.parse(req.body);

      // Check if user exists
      const user = await storageInstance.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if plan exists
      const plan = await storageInstance.getInvestmentPlan(validatedData.planId);
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      // Validate user balance
      const userBalance = parseFloat(user.balance || "0");
      const investmentAmount = parseFloat(validatedData.amount);

      if (investmentAmount > userBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Check if investment amount meets plan limits
      const minAmount = parseFloat(plan.minAmount.toString());
      const maxAmount = plan.maxAmount ? parseFloat(plan.maxAmount.toString()) : Infinity;

      if (investmentAmount < minAmount) {
        return res.status(400).json({ message: `Minimum investment amount is ${minAmount}` });
      }

      if (maxAmount !== 0 && investmentAmount > maxAmount) {
        return res.status(400).json({ message: `Maximum investment amount is ${maxAmount}` });
      }

      const newInvestment = await storageInstance.createInvestment(validatedData);
      res.status(201).json(newInvestment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create investment" });
      }
    }
  });

  app.get("/api/user/:userId/investments", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storageInstance.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const investments = await storageInstance.getInvestmentsByUserId(userId);

      // Get plan details for each investment
      const investmentsWithPlans = await Promise.all(investments.map(async (investment) => {
        const plan = await storageInstance.getInvestmentPlan(investment.planId);
        return {
          ...investment,
          plan
        };
      }));

      res.status(200).json(investmentsWithPlans);
    } catch (error) {
      res.status(500).json({ message: "Failed to get investments" });
    }
  });

  // File upload endpoint for payment proofs
  app.post("/api/upload/payment-proof", async (req: Request, res: Response) => {
    try {
      // For now, simulate file upload by generating a unique filename
      // In a real application, you would use a file upload middleware like multer
      const fileName = `payment_proof_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const fileUrl = `/uploads/payment_proofs/${fileName}`;

      res.status(200).json({
        message: "Payment proof uploaded successfully",
        fileUrl: fileUrl,
        fileName: fileName
      });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload payment proof" });
    }
  });

  // Transaction routes
  app.post("/api/transactions", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);

      // Ensure all new transactions start as pending
      validatedData.status = "pending";

      // Check if user exists
      const user = await storageInstance.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // For withdrawals, check if user has sufficient balance
      if (validatedData.type === "withdrawal") {
        const withdrawalAmount = parseFloat(validatedData.amount.toString());
        const userBalance = parseFloat(user.balance.toString());

        if (userBalance < withdrawalAmount) {
          return res.status(400).json({ message: "Insufficient balance" });
        }
      }

      const newTransaction = await storageInstance.createTransaction(validatedData);

      // Send transaction email notification
      await sendTransactionEmail(
        user.email,
        validatedData.type as 'deposit' | 'withdrawal',
        validatedData.amount.toString()
      );

      // All transactions now require admin approval - no auto-completion
      // Transaction remains in pending status until admin reviews

      res.status(201).json(newTransaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get("/api/user/:userId/transactions", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storageInstance.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transactions = await storageInstance.getTransactionsByUserId(userId);
      res.status(200).json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  // Admin transaction management endpoints
  app.get("/api/admin/transactions", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      // Get all transactions or filter by status
      const status = req.query.status as string;
      const transactions = await storageInstance.getAllTransactions(status);

      // Include user details for each transaction
      const transactionsWithUsers = await Promise.all(
        transactions.map(async (transaction) => {
          const user = await storageInstance.getUser(transaction.userId);
          return {
            ...transaction,
            user: {
              id: user?.id,
              username: user?.username,
              email: user?.email,
              fullName: user?.fullName
            }
          };
        })
      );

      res.status(200).json(transactionsWithUsers);
    } catch (error) {
      console.error("Admin transactions error:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/admin/transactions/:id/review", requireAuth, requireAdmin, async (req: Request, res: Response) => {
    try {
      const transactionId = parseInt(req.params.id);
      const { action, adminNotes } = reviewTransactionSchema.parse({
        transactionId,
        action: req.body.action,
        adminNotes: req.body.adminNotes
      });

      const adminUserId = req.session?.userId;
      if (!adminUserId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const transaction = await storageInstance.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      if (transaction.status !== "pending") {
        return res.status(400).json({ message: "Transaction is not pending" });
      }

      // Update transaction status based on admin action
      const newStatus = action === "approve" ? "completed" : "failed";
      const reviewedTransaction = await storageInstance.reviewTransaction(
        transactionId,
        newStatus,
        adminUserId,
        adminNotes
      );

      // If approved and it's a deposit, add funds to user balance
      if (action === "approve" && transaction.type === "deposit") {
        await storageInstance.updateUserBalance(
          transaction.userId,
          parseFloat(transaction.amount.toString()),
          true
        );
      }

      // If approved and it's a withdrawal, deduct funds from user balance
      if (action === "approve" && transaction.type === "withdrawal") {
        await storageInstance.updateUserBalance(
          transaction.userId,
          parseFloat(transaction.amount.toString()),
          false
        );
      }

      // Send email notification to user about status change
      const user = await storageInstance.getUser(transaction.userId);
      if (user) {
        await sendTransactionEmail(
          user.email,
          transaction.type as 'deposit' | 'withdrawal',
          transaction.amount.toString()
        );
      }

      res.status(200).json(reviewedTransaction);
    } catch (error) {
      console.error("Transaction review error:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to review transaction" });
      }
    }
  });

  // KYC document routes
  app.post("/api/kyc-documents", async (req: Request, res: Response) => {
    try {
      const validatedData = insertKycDocumentSchema.parse(req.body);

      // Check if user exists
      const user = await storageInstance.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const newDocument = await storageInstance.createKycDocument(validatedData);
      res.status(201).json(newDocument);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create KYC document" });
      }
    }
  });

  app.get("/api/user/:userId/kyc-documents", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storageInstance.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const documents = await storageInstance.getKycDocumentsByUserId(userId);
      res.status(200).json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get KYC documents" });
    }
  });

  // Watchlist routes
  app.post("/api/watchlist", async (req: Request, res: Response) => {
    try {
      const validatedData = insertWatchlistItemSchema.parse(req.body);

      // Check if user exists
      const user = await storageInstance.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if asset exists
      const asset = await storageInstance.getAsset(validatedData.assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const newItem = await storageInstance.createWatchlistItem(validatedData);

      // Get asset details
      const itemWithAsset = {
        ...newItem,
        asset
      };

      res.status(201).json(itemWithAsset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add to watchlist" });
      }
    }
  });

  app.get("/api/user/:userId/watchlist", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const user = await storageInstance.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const watchlistItems = await storageInstance.getWatchlistItemsByUserId(userId);

      // Get asset details for each item
      const itemsWithAssets = await Promise.all(watchlistItems.map(async (item) => {
        const asset = await storageInstance.getAsset(item.assetId);
        return {
          ...item,
          asset
        };
      }));

      res.status(200).json(itemsWithAssets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get watchlist" });
    }
  });

  app.delete("/api/watchlist/:id", async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.id);
      const item = await storageInstance.getWatchlistItem(itemId);

      if (!item) {
        return res.status(404).json({ message: "Watchlist item not found" });
      }

      const result = await storageInstance.deleteWatchlistItem(itemId);

      if (!result) {
        return res.status(404).json({ message: "Watchlist item not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete watchlist item" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
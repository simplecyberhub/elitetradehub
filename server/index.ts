import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors'; // Import cors

import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS to allow credentials
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-User-Id', 'X-User-Role']
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database and seed data
  try {
    const { seedDatabaseNew } = await import('./seed');
    await seedDatabaseNew();
    log('Database seeded successfully');
  } catch (error) {
    log(`Error seeding database: ${String(error)}`);
  }

  const server = await registerRoutes(app);

  // Start market data service
  const { marketDataService } = await import('./market-data');
  marketDataService.startPeriodicUpdates();

  // Start investment maturity processing (check every hour)
  const storageInstance = await import('./storage');
  const storage = await storageInstance.storage;

  setInterval(async () => {
    try {
      await storage.processMaturedInvestments();
    } catch (error) {
      console.error('Error in investment processing scheduler:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  // Process matured investments on startup
  setTimeout(async () => {
    try {
      await storage.processMaturedInvestments();
    } catch (error) {
      console.error('Error in initial investment processing:', error);
    }
  }, 10000); // 10 seconds after startup


  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "127.0.0.1",
    reusePort: false,
  }, () => {
    log(`serving on port ${port}`);
    console.log(`Investment processing: Active`);
    console.log(`Market data updates: Active`);
  });
})();
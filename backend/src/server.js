import dotenv from "dotenv";
dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import express from "express";
import cors from "cors";
import { initDb } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js";
import job from "./config/cron.js";

const app = express();

// Allow CORS for browser clients (Expo web) so fetch requests succeed
app.use(
  cors({
    origin: true, // reflect request origin on dev; replace with a fixed origin in prod
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Only apply rate limiting in production to avoid Upstash limits during local dev
if (process.env.NODE_ENV === "production") {
  app.use(rateLimiter);
}

app.use(express.json());

// Simple request logger for debugging (prints method and path)
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

if (process.env.NODE_ENV === "production") job.start();

app.get("/", (req, res) => {
  res.send("Welcome to the Transactions API!");
});

app.use("/api/transactions", transactionsRoute);

const PORT = process.env.PORT || 5001; // allow overriding the port via env for local dev

app.get("/api/transactions", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Basic health endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

initDb()
  .then(() => {
    const HOST = process.env.HOST || "0.0.0.0";
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
      try {
        const addr = server.address();
        console.log("server.address ->", addr);
        console.log("env HOST, PORT ->", process.env.HOST, process.env.PORT);
      } catch (e) {
        console.warn("Could not read server.address()", e?.message || e);
      }
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `Port ${PORT} is already in use. Either stop the process using it or set PORT to a free port (e.g. PORT=5002).`
        );
        process.exit(1);
      }
      console.error("Server error:", err);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize the database:", error);
    process.exit(1);
  });

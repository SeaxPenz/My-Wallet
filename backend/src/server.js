import dotenv from "dotenv";
dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import express from "express";
import cors from "cors";
import { initDb } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js";
import ratesRoute from "./routes/ratesRoute.js";
import job from "./config/cron.js";

const app = express();

// Allow CORS for browser clients (Expo web) so fetch requests succeed
app.use(
  cors({
    origin: true, // reflect request origin on dev; replace with a fixed origin in prod
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    // allow developer helper headers (x-user-id) used during local testing
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-user-id",
      "x-dev-user-id",
      "x-requested-with",
    ],
    credentials: true,
  })
);

// Explicitly respond to OPTIONS preflight to ensure custom headers like x-user-id are allowed
app.options("/*", (req, res) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-user-id, x-dev-user-id, x-requested-with"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  return res.sendStatus(204);
});

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

// Log preflight requests to aid debugging CORS issues in development
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    console.log(
      "[API] CORS preflight for",
      req.originalUrl,
      "headers:",
      req.headers
    );
  }
  next();
});

if (process.env.NODE_ENV === "production") job.start();

app.get("/", (req, res) => {
  res.send("Welcome to the Transactions API!");
});

app.use("/api/transactions", transactionsRoute);
app.use("/api/rates", ratesRoute);

// Dev-only helper: seed a few transactions for the local dev stub user `dev-user-1`.
// This endpoint is intentionally only enabled when NODE_ENV !== 'production'.
if (process.env.NODE_ENV !== "production") {
  app.post("/api/__dev/seed-dev-user", async (req, res) => {
    try {
      // lazy import controller to avoid circular deps
      const { sql } = await import("./config/db.js");
      const sample = [
        {
          user_id: "dev-user-1",
          email: "dev@example.com",
          title: "Coffee",
          amount: -3.5,
          category: "Food & Drinks",
          note: "Morning coffee",
        },
        {
          user_id: "dev-user-1",
          email: "dev@example.com",
          title: "Salary",
          amount: 1500,
          category: "Income",
          note: "Monthly salary",
        },
        {
          user_id: "dev-user-1",
          email: "dev@example.com",
          title: "Groceries",
          amount: -45.9,
          category: "Food & Drinks",
          note: "Weekly groceries",
        },
      ];

      const inserted = [];
      for (const tx of sample) {
        const result = await sql`
          INSERT INTO transactions (user_id, email, title, amount, category, note, created_at)
          VALUES (${tx.user_id}, ${tx.email}, ${tx.title}, ${tx.amount}, ${tx.category}, ${tx.note}, NOW())
          RETURNING *;
        `;
        inserted.push(result[0]);
      }
      res.status(201).json({ inserted });
    } catch (err) {
      console.error("Dev seed error", err);
      res.status(500).json({ error: "Failed to seed dev transactions" });
    }
  });
}

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

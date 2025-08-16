import dotenv from "dotenv";
dotenv.config();

console.log("DATABASE_URL:", process.env.DATABASE_URL);

import express from "express";
import { initDb } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRouter from "./routes/transactionsRoute.js";

const app = express();

app.use(rateLimiter);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the Transactions API!");
});

app.use("/api/transactions", transactionsRouter);

const PORT = 5001; // Use 5001 to avoid EADDRINUSE

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize the database:", error);
    process.exit(1);
  });

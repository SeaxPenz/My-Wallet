import express from "express";
import rateLimiter from "../middleware/rateLimiter.js";
import {
  getSummaryByUserId,
  getTransactionsByUserId,
  createTransaction,
  deleteTransaction,
} from "../controllers/transactionsControllers.js";
import { upsertUserMetadata } from "../controllers/usersController.js";

const router = express.Router();

// Only apply rate limiting in production to avoid Upstash rate limits during local dev/testing
if (process.env.NODE_ENV === "production") {
  router.use(rateLimiter);
}

router.get("/", (req, res) => {
  res.send("Yes, it is working now!");
});

router.get("/summary/:userId", getSummaryByUserId);

router.get("/:userId", getTransactionsByUserId);

router.post("/", createTransaction);

router.delete("/:id", deleteTransaction);

router.post("/users/:userId", upsertUserMetadata);

export default router;

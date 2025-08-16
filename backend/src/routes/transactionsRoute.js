import express from "express";
import rateLimiter from "../middleware/rateLimiter.js";
import {
  getSummaryByUserId,
  getTransactionsByUserId,
  createTransaction,
  deleteTransaction,
} from "../controllers/transactionsControllers.js";

const router = express.Router();

router.use(rateLimiter); // Apply rate limiting to all routes

router.get("/", (req, res) => {
  res.send("Yes, it is working now!");
});

router.get("/:userId", getTransactionsByUserId);

router.post("/", createTransaction);

router.delete("/:id", deleteTransaction);

router.get("/summary/:userId", getSummaryByUserId);

export default router;

import express from "express";
import rateLimiter from "../middleware/rateLimiter.js";
import {
  getSummaryByUserId,
  getTransactionsByUserId,
  getTransactionsDebug,
  getTransactionsForRequester,
  getSummaryForRequester,
  createTransaction,
  deleteTransaction,
} from "../controllers/transactionsControllers.js";
import {
  upsertUserMetadata,
  updateUserAvatar,
} from "../controllers/usersController.js";

const router = express.Router();

// Only apply rate limiting in production to avoid Upstash rate limits during local dev/testing
if (process.env.NODE_ENV === "production") {
  router.use(rateLimiter);
}

router.get("/", (req, res) => {
  res.send("Yes, it is working now!");
});

router.get("/summary/:userId", getSummaryByUserId);

// requester-aware endpoints: GET /api/transactions/summary/me and /me
// These allow clients to call without embedding the userId in the path and
// are useful during development when authentication is proxied by headers.
router.get("/summary/me", getSummaryForRequester);

router.get("/:userId", getTransactionsByUserId);
router.get("/me", getTransactionsForRequester);
// Allow POST /me which creates a transaction for the requester (dev-friendly)
router.post("/me", createTransaction);
// dev-only debug endpoint
if (process.env.NODE_ENV !== "production") {
  router.get("/__debug/users", getTransactionsDebug);
}

router.post("/", createTransaction);

router.delete("/:id", deleteTransaction);

router.post("/users/:userId", upsertUserMetadata);
router.post("/users/:userId/avatar", updateUserAvatar);

export default router;

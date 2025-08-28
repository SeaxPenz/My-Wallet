import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;
    console.log(
      `[transactions] getTransactionsByUserId called with userId=${userId}`
    );
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const transactions = await sql`
      SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    console.log(
      `[transactions] found rows=${
        transactions?.length || 0
      } for userId=${userId}`
    );
    return res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions:", error);
    return res.status(500).json({ error: "Failed to get transactions" });
  }
}

export async function createTransaction(req, res) {
  try {
    // Dev-time logging: print headers and body to help debug create failures
    if (process.env.NODE_ENV !== "production") {
      try {
        console.log("[transactions.create] headers=", req.headers);
        console.log("[transactions.create] body=", req.body);
      } catch (e) {
        console.warn(
          "[transactions.create] failed to log request metadata",
          e?.message || e
        );
      }
    }
    // Allow the client to either provide the user_id in the body or let the
    // server resolve it from a developer header / bearer token for local dev.
    const body = req.body || {};
    let { user_id, email, title, amount, category, created_at, note } = body;
    // normalize/trim incoming strings to avoid accidental whitespace issues
    if (typeof title === "string") title = title.trim();
    if (typeof category === "string") category = category.trim();
    if (typeof note === "string") note = note.trim();
    // fallback to requester header/token when user_id not provided in body
    if (!user_id) {
      const requester = extractRequesterUserId(req);
      if (requester) {
        user_id = requester;
        console.log(
          `createTransaction: resolved user_id from header -> ${user_id}`
        );
      }
    }

    console.log(
      "createTransaction: body=",
      req.body,
      "resolved_user_id=",
      user_id
    );

    // coerce amount to numeric
    const parsedAmount = Number(amount);
    if (
      !user_id ||
      !title ||
      amount === undefined ||
      amount === null ||
      Number.isNaN(parsedAmount)
    ) {
      return res.status(400).json({
        error:
          "Missing or invalid fields: user_id, title and numeric amount are required",
      });
    }

    const txToInsert = {
      user_id,
      email: email || null,
      title,
      amount: parsedAmount,
      category: category || null,
      note: note || null,
      created_at: created_at || null,
    };

    const transaction = await sql`
      INSERT INTO transactions (user_id, email, title, amount, category, note, created_at)
      VALUES (${txToInsert.user_id}, ${txToInsert.email}, ${
      txToInsert.title
    }, ${txToInsert.amount}, ${txToInsert.category}, ${txToInsert.note}, ${
      txToInsert.created_at || sql`NOW()`
    }) RETURNING *`;
    console.log("Transaction created successfully:", transaction);
    res.status(201).json(transaction[0]);
  } catch (error) {
    console.error("Error creating transaction:", error);
    // Print stack if available for deeper debugging in dev
    if (error && error.stack) console.error(error.stack);
    // Include error message in response during development to speed debugging
    return res
      .status(500)
      .json({ error: "Failed to create transaction", details: error.message });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    console.log(
      `[transactions] delete requested id=${id} from ${
        req.ip || req.headers["x-forwarded-for"] || "unknown"
      }`
    );
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    const result =
      await sql`DELETE FROM transactions WHERE id = ${id} RETURNING *`;
    console.log(
      `[transactions] delete result for id=${id} -> rows=${result.length}`
    );
    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    // return the deleted row for client debugging/testing
    res.status(200).json({
      message: "Transaction deleted successfully",
      deleted: result[0],
    });
  } catch (error) {
    console.log("Error deleting transaction:", error);
    if (error && error.stack) console.error(error.stack);
    return res
      .status(500)
      .json({ error: "Failed to delete transaction", details: error?.message });
  }
}

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;
    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount),0) as balance FROM transactions WHERE user_id = ${userId}
    `;
    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount),0) as income FROM transactions WHERE user_id = ${userId} AND amount > 0
    `;
    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount),0) as expenses FROM transactions WHERE user_id = ${userId} AND amount < 0
    `;
    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.log("Error getting the summary:", error);
    return res.status(500).json({ error: "Failed to get summary" });
  }
}

// Helper: extract user id from request in a dev-friendly way.
function extractRequesterUserId(req) {
  // Prefer explicit header allowing development/testing without full auth
  const headerId = req.headers["x-user-id"] || req.headers["x-dev-user-id"];
  if (headerId) return headerId;

  // Allow passing a raw id as Bearer token in dev (e.g. "Authorization: Bearer dev-user-1").
  const auth = req.headers["authorization"];
  if (auth && auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  return null;
}

// Return transactions for the requesting client. In production this should be
// backed by a real authentication check; here we accept x-user-id or a Bearer
// token as a convenient developer shortcut.
export async function getTransactionsForRequester(req, res) {
  try {
    const userId = extractRequesterUserId(req);
    if (!userId) {
      // In production we avoid leaking data; require an explicit id header.
      if (process.env.NODE_ENV === "production") {
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.status(400).json({
        error: "Missing requester user id (x-user-id or Authorization header)",
      });
    }
    console.log(`[transactions] getTransactionsForRequester userId=${userId}`);
    const transactions = await sql`
      SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    console.log(
      `[transactions] found rows=${
        transactions?.length || 0
      } for requester=${userId}`
    );
    return res.status(200).json(transactions || []);
  } catch (error) {
    console.error("Error in getTransactionsForRequester", error);
    return res
      .status(500)
      .json({ error: "Failed to get transactions for requester" });
  }
}

// Summary counterpart for the requester-aware endpoint
export async function getSummaryForRequester(req, res) {
  try {
    const userId = extractRequesterUserId(req);
    if (!userId) {
      if (process.env.NODE_ENV === "production") {
        return res.status(401).json({ error: "Unauthorized" });
      }
      return res.status(400).json({
        error: "Missing requester user id (x-user-id or Authorization header)",
      });
    }
    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount),0) as balance FROM transactions WHERE user_id = ${userId}
    `;
    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount),0) as income FROM transactions WHERE user_id = ${userId} AND amount > 0
    `;
    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount),0) as expenses FROM transactions WHERE user_id = ${userId} AND amount < 0
    `;
    return res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.error("Error in getSummaryForRequester", error);
    return res
      .status(500)
      .json({ error: "Failed to get summary for requester" });
  }
}

// Dev helper: return counts grouped by user_id so clients can verify which
// user ids have transactions. Only enabled in non-production.
export async function getTransactionsDebug(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  try {
    const rows = await sql`
      SELECT user_id, COUNT(*) as cnt FROM transactions GROUP BY user_id ORDER BY cnt DESC
    `;
    return res.status(200).json(rows || []);
  } catch (error) {
    console.error("Error in getTransactionsDebug", error);
    return res.status(500).json({ error: "Failed to query debug info" });
  }
}

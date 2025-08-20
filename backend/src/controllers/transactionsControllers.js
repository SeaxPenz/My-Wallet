import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    const transactions = await sql`
      SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return res.status(200).json(transactions);
  } catch (error) {
    console.log("Error getting the transactions:", error);
    return res.status(500).json({ error: "Failed to get transactions" });
  }
}

export async function createTransaction(req, res) {
  try {
    const { user_id, email, title, amount, category, created_at } = req.body;
    console.log("createTransaction: body=", req.body);
    if (!user_id || !title || !amount || !category) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const transaction =
      await sql`INSERT INTO transactions (user_id, email, title, amount, category, created_at)
      VALUES (${user_id}, ${email}, ${title}, ${amount}, ${category}, ${
        created_at || sql`NOW()`
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
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }
    const result =
      await sql`DELETE FROM transactions WHERE id = ${id} RETURNING *`;
    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting transaction:", error);
    return res.status(500).json({ error: "Failed to delete transaction" });
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

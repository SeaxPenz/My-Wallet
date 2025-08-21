// react custom hook file

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../constants/api";
import { wrapError } from "../utils/errorHelpers";

/*
  useTransactions hook:
  - fetches transactions and summary
  - createTransaction
  - deleteTransaction (throws file-backed Error on failure)
*/

export default function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/${userId}`);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      try {
        const json = JSON.parse(text);
        setTransactions(json || []);
      } catch (_p) {
        setTransactions([]);
      }
    } catch (err) {
      throw wrapError("useTransactions.fetchTransactions", err);
    }
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/summary/${userId}`);
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${text}`);
      }
      try {
        const json = JSON.parse(text);
        setSummary(json || { balance: 0, income: 0, expenses: 0 });
      } catch (_p) {
        // ignore parse errors, keep defaults
      }
    } catch (err) {
      throw wrapError("useTransactions.fetchSummary", err);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId, loadData]);

  const retry = () => loadData();

  async function createTransaction(payload) {
    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Create failed");
      }
      await loadData();
      return true;
    } catch (err) {
      throw wrapError("useTransactions.createTransaction", err);
    }
  }

  async function deleteTransaction(id) {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Delete failed");
      }
      await loadData();
      return true;
    } catch (err) {
      throw wrapError("useTransactions.deleteTransaction", err);
    }
  }

  return {
    transactions,
    summary,
    isLoading,
    error,
    loadData,
    deleteTransaction,
    createTransaction,
    retry,
  };
}

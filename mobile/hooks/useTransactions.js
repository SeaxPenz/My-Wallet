// react custom hook file

import { useState, useEffect, useCallback } from "react";
import { API_URL } from "../constants/api";

// const API_URL = "https://my-wallet-bl80.onrender.com/api";
// const API_URL = "https://wallet-api-cxqp.onrender.com/api";
// const API_URL = "http://localhost:5001/api";

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/${userId}`);
      const text = await res.text();
      if (!res.ok) {
        console.warn("fetchTransactions failed", res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }
      try {
        const json = JSON.parse(text);
        setTransactions(json || []);
      } catch (_parseErr) {
        console.warn("fetchTransactions: response not JSON", text);
        setTransactions([]);
      }
    } catch (err) {
      console.warn("useTransactions: Error fetching transactions:", err);
    }
  }, [userId]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/transactions/summary/${userId}`);
      const text = await res.text();
      if (!res.ok) {
        console.warn("fetchSummary failed", res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }
      try {
        const json = JSON.parse(text);
        setSummary(json || { balance: 0, income: 0, expenses: 0 });
        setIsOffline(false);
      } catch (_parseErr) {
        console.warn("fetchSummary: response not JSON", text);
      }
    } catch (err) {
      console.warn("useTransactions: Error fetching summary:", err);
      setError(err);
      setIsOffline(true);
    }
  }, [userId]);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchTransactions(), fetchSummary()]);
    } catch (err) {
      console.warn("useTransactions: loadData error", err);
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

  const deleteTransaction = async (id) => {
    try {
      const res = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const text = await res.text();
        console.warn("deleteTransaction failed", res.status, text);
        throw new Error(`HTTP ${res.status}`);
      }
      // refresh data after deletion
      await loadData();
      return true;
    } catch (err) {
      console.warn("useTransactions: deleteTransaction error", err);
      throw err;
    }
  };

  return {
    transactions,
    setTransactions,
    summary,
    isLoading,
    error,
    isOffline,
    loadData,
    retry,
    deleteTransaction,
  };
}

// keep default export for modules that import the hook as default
export default useTransactions;

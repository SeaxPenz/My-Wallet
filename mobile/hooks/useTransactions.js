// react custom hook file

import { useCallback, useEffect, useState } from "react";
import { API_URL } from "../constants/api";
import { wrapError } from "../utils/errorHelpers";
import { getItemAsync, setItemAsync } from "../lib/secureStore";

/*
  useTransactions hook:
  - fetches transactions and summary
  - createTransaction
  - deleteTransaction (throws file-backed Error on failure)
*/

// Allow a developer override via env var EXPO_DEV_USER_ID to run the app
// against local seeded transactions without needing auth.
const DEV_USER_ID = process.env.EXPO_DEV_USER_ID || null;

export default function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper: fetch with timeout using AbortController
  async function fetchWithTimeout(resource, options = {}, timeout = 7000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(resource, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      if (err && err.name === "AbortError") {
        throw new Error("Request timed out");
      }
      throw err;
    }
  }

  // helper: fetch with retry/backoff for transient errors (429)
  async function fetchWithRetries(
    resource,
    options = {},
    timeout = 7000,
    retries = 1,
    delay = 600
  ) {
    let attempt = 0;
    let lastErr = null;
    while (attempt <= retries) {
      try {
        const res = await fetchWithTimeout(resource, options, timeout);
        // If 429, respect Retry-After header and only retry once with jitter.
        if (res.status === 429) {
          const ra = res.headers.get("retry-after");
          const retryAfterMs = ra
            ? Number(ra) * 1000
            : delay * Math.pow(2, attempt);
          if (attempt < retries) {
            // add small jitter to avoid sync retry storms
            const jitter = Math.floor(Math.random() * 300);
            await new Promise((r) => setTimeout(r, retryAfterMs + jitter));
            attempt++;
            continue;
          }
          // no more retries; return the response to let caller handle 429 body
          return res;
        }
        return res;
      } catch (err) {
        lastErr = err;
        // retry on timeout/network errors
        if (attempt < retries) {
          const backoff = delay * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, backoff));
          attempt++;
          continue;
        }
        throw lastErr;
      }
    }
    throw lastErr || new Error("Failed to fetch");
  }

  const fetchTransactions = useCallback(
    async (overrideUserId) => {
      try {
        const resolvedUserId = overrideUserId || userId || DEV_USER_ID || null;
        const url = resolvedUserId
          ? `${API_URL}/transactions/${resolvedUserId}`
          : `${API_URL}/transactions/me`;
        const headers = {};
        // If a dev user id is configured, include it as a requester header
        // even when resolvedUserId is present so server-side bypass applies.
        try {
          if (resolvedUserId && DEV_USER_ID)
            headers["x-user-id"] = resolvedUserId;
          else if (!resolvedUserId && DEV_USER_ID)
            headers["x-user-id"] = DEV_USER_ID;
        } catch (e) {}

        let res;
        try {
          res = await fetchWithRetries(url, { headers }, 7000);
        } catch (err) {
          // fallback to loopback as before
          try {
            const fallbackUrl = url.replace(
              /https?:\/\/(.*?):?(\d*)/,
              (m, host, port) => {
                const proto = m.startsWith("https") ? "https" : "http";
                const p = port || "5001";
                return `${proto}://127.0.0.1:${p}`;
              }
            );
            console.warn(
              "[useTransactions] primary fetch failed, retrying with fallback",
              fallbackUrl,
              err?.message || err
            );
            res = await fetchWithRetries(fallbackUrl, { headers }, 7000);
          } catch (err2) {
            console.error(
              "[useTransactions] both primary and fallback fetch failed",
              { url, err: err2?.message || err2 }
            );
            throw err2;
          }
        }

        const text = await res.text();
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${text}`);
        }
        try {
          const json = JSON.parse(text);
          setTransactions(json || []);
          // cache for faster subsequent loads
          try {
            await setItemAsync(
              `transactions:${resolvedUserId}`,
              JSON.stringify(json || [])
            );
          } catch (e) {
            // caching failure is non-fatal
          }
          return json || [];
        } catch (_p) {
          setTransactions([]);
          return [];
        }
      } catch (err) {
        throw wrapError("useTransactions.fetchTransactions", err);
      }
    },
    [userId]
  );

  const fetchSummary = useCallback(
    async (overrideUserId) => {
      try {
        const resolvedUserId = overrideUserId || userId || DEV_USER_ID || null;
        const url = resolvedUserId
          ? `${API_URL}/transactions/summary/${resolvedUserId}`
          : `${API_URL}/transactions/summary/me`;
        const headers = {};
        try {
          if (resolvedUserId && DEV_USER_ID)
            headers["x-user-id"] = resolvedUserId;
          else if (!resolvedUserId && DEV_USER_ID)
            headers["x-user-id"] = DEV_USER_ID;
        } catch (e) {}

        let res;
        try {
          res = await fetchWithRetries(url, { headers }, 5000);
        } catch (err) {
          try {
            const fallbackUrl = url.replace(
              /https?:\/\/(.*?):?(\d*)/,
              (m, host, port) => {
                const proto = m.startsWith("https") ? "https" : "http";
                const p = port || "5001";
                return `${proto}://127.0.0.1:${p}`;
              }
            );
            console.warn(
              "[useTransactions] summary fetch failed, retrying with fallback",
              fallbackUrl,
              err?.message || err
            );
            res = await fetchWithRetries(fallbackUrl, { headers }, 5000);
          } catch (err2) {
            throw err2;
          }
        }

        const text = await res.text();
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${text}`);
        }
        try {
          const json = JSON.parse(text);
          setSummary(json || { balance: 0, income: 0, expenses: 0 });
          try {
            await setItemAsync(
              `transactions_summary:${resolvedUserId}`,
              JSON.stringify(json || {})
            );
          } catch (e) {}
          return json || { balance: 0, income: 0, expenses: 0 };
        } catch (_p) {
          return { balance: 0, income: 0, expenses: 0 };
        }
      } catch (err) {
        throw wrapError("useTransactions.fetchSummary", err);
      }
    },
    [userId]
  );

  const loadData = useCallback(async () => {
    // In development allow running without an explicit userId when
    // EXPO_DEV_USER_ID is provided so /me endpoints can be used.
    const resolvedUserId = userId || DEV_USER_ID || null;
    if (!userId && !DEV_USER_ID) return;
    setIsLoading(true);
    setError(null);
    try {
      // show cached data immediately while network requests run
      try {
        const cached = await getItemAsync(`transactions:${resolvedUserId}`);
        if (cached) {
          setTransactions(JSON.parse(cached));
        }
      } catch (e) {}

      try {
        const cachedSummary = await getItemAsync(
          `transactions_summary:${resolvedUserId}`
        );
        if (cachedSummary) {
          setSummary(JSON.parse(cachedSummary));
        }
      } catch (e) {}

      // Serialize the two calls to avoid creating simultaneous bursts that may
      // trigger upstream rate limits (fetchSummary is cheap so run it second).
      const results = [];
      try {
        const tx = await fetchTransactions();
        results.push({ status: "fulfilled", value: tx });
      } catch (e) {
        results.push({ status: "rejected", reason: e });
      }
      try {
        const s = await fetchSummary();
        results.push({ status: "fulfilled", value: s });
      } catch (e) {
        results.push({ status: "rejected", reason: e });
      }
      const errors = results
        .filter((r) => r.status === "rejected")
        .map((r) => (r.status === "rejected" ? r.reason : null))
        .filter(Boolean);
      if (errors.length === results.length) {
        // all failed
        setError(
          errors[0] || new Error("Failed to load transactions and summary")
        );
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTransactions, fetchSummary, userId]);

  const retry = () => loadData();

  async function createTransaction(payload) {
    try {
      // basic client-side validation to fail fast with friendly messages
      const missing = [];
      if (!payload) throw new Error("Missing payload");
      if (!payload.user_id) missing.push("user_id");
      if (!payload.title) missing.push("title");
      if (
        payload.amount === undefined ||
        payload.amount === null ||
        Number.isNaN(Number(payload.amount))
      )
        missing.push("amount");
      if (!payload.category) missing.push("category");
      if (missing.length)
        throw new Error(`Missing required fields: ${missing.join(", ")}`);

      // debug: show payload being sent for easier tracing
      // eslint-disable-next-line no-console
      console.debug("[useTransactions] createTransaction payload ->", payload);

      // quick connectivity preflight to give a clearer error when API is unreachable
      try {
        const healthUrl = `${API_URL.replace(/\/+$/, "")}/health`;
        // include requester header on health preflight so the server can
        // bypass IP-based rate limiting for authenticated/dev requests
        const healthHeaders = {};
        try {
          if (payload && payload.user_id)
            healthHeaders["x-user-id"] = payload.user_id;
          else if (!userId && DEV_USER_ID)
            healthHeaders["x-user-id"] = DEV_USER_ID;
        } catch (e) {}
        const hres = await fetchWithTimeout(
          healthUrl,
          { headers: healthHeaders },
          3000
        ).catch((e) => {
          throw e;
        });
        if (!hres || !hres.ok) {
          // eslint-disable-next-line no-console
          console.warn(
            "[useTransactions] health check failed",
            healthUrl,
            hres && hres.status
          );
          throw new Error(
            `Cannot reach backend at ${API_URL}. Check EXPO_PUBLIC_API_URL or backend server. (health check ${
              hres && hres.status
            })`
          );
        }
      } catch (e) {
        // surface a helpful error for the UI
        throw wrapError(
          "useTransactions.createTransaction",
          new Error(
            `Backend unreachable: ${API_URL}. Set EXPO_PUBLIC_API_URL or start the local API. (${
              e.message || e
            })`
          )
        );
      }
      const url = `${API_URL}/transactions`;
      const headers = { "Content-Type": "application/json" };
      // Always include a requester header when we can. Some dev flows resolve
      // the user from the header instead of body; include payload.user_id as a
      // hint to the server to increase robustness.
      try {
        if (payload && payload.user_id) headers["x-user-id"] = payload.user_id;
        else if (!userId && DEV_USER_ID) headers["x-user-id"] = DEV_USER_ID;
      } catch (e) {
        // ignore header set failures
      }

      let res;
      try {
        // debug: log outgoing request metadata for easier tracing
        // eslint-disable-next-line no-console
        console.debug("[useTransactions] POST ->", url, {
          headers,
          body: payload,
        });
        res = await fetchWithRetries(
          url,
          { method: "POST", headers, body: JSON.stringify(payload) },
          7000
        );
      } catch (err) {
        // try fallback to /me path as older backends expect requester resolution
        try {
          const meUrl = `${API_URL}/transactions/me`;
          // ensure header is present for /me route too
          if (payload && payload.user_id)
            headers["x-user-id"] = payload.user_id;
          else if (!userId && DEV_USER_ID) headers["x-user-id"] = DEV_USER_ID;
          // eslint-disable-next-line no-console
          console.debug(
            "[useTransactions] primary POST failed, trying /me ->",
            meUrl,
            err?.message || err
          );
          res = await fetchWithRetries(
            meUrl,
            { method: "POST", headers, body: JSON.stringify(payload) },
            7000
          );
        } catch (err2) {
          // surface the network error
          throw wrapError("useTransactions.createTransaction", err2);
        }
      }

      // parse response body (prefer JSON)
      let bodyText = "";
      try {
        bodyText = await res.text();
      } catch (e) {
        bodyText = "";
      }

      // Always log response for easier debugging
      // eslint-disable-next-line no-console
      console.debug("[useTransactions] create response ->", {
        status: res.status,
        body: bodyText,
      });
      if (!res.ok) {
        let parsed = null;
        try {
          parsed = JSON.parse(bodyText);
        } catch (e) {
          parsed = null;
        }
        const backendMsg =
          (parsed && (parsed.error || parsed.message || parsed.details)) ||
          bodyText ||
          `HTTP ${res.status}`;
        const errMsg = `Create failed: ${backendMsg}`;
        // eslint-disable-next-line no-console
        console.error(
          "[useTransactions] createTransaction response error",
          res.status,
          bodyText
        );
        throw new Error(errMsg);
      }

      // success — try to parse returned object
      let created = null;
      try {
        created = JSON.parse(bodyText);
      } catch (e) {
        created = bodyText || null;
      }
      // refresh local cache/state for the created user's id (ensure we refresh
      // even if this hook was instantiated without a userId). Use the payload
      // user_id when available to guarantee the new tx appears.
      try {
        const refreshId =
          (payload && payload.user_id) || userId || DEV_USER_ID || null;
        if (refreshId) {
          await fetchTransactions(refreshId);
          await fetchSummary(refreshId);
        } else {
          // fallback to loadData which may no-op if no dev id is configured
          try {
            await loadData();
          } catch (_) {}
        }
      } catch (e) {
        /* non-fatal */
      }
      return created || true;
    } catch (err) {
      if (err && err.message) {
        throw wrapError(
          "useTransactions.createTransaction",
          new Error(err.message)
        );
      }
      throw wrapError("useTransactions.createTransaction", err);
    }
  }

  async function deleteTransaction(id) {
    try {
      const url = `${API_URL}/transactions/${id}`;
      const headers = {};
      if (!userId && DEV_USER_ID) headers["x-user-id"] = DEV_USER_ID;

      const res = await fetchWithRetries(
        url,
        { method: "DELETE", headers },
        5000
      );
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
    // compute simple stats for a category (mean, std, count)
    computeCategoryStats: (category) => {
      try {
        if (!category) return { count: 0, mean: 0, std: 0 };
        const same = (transactions || [])
          .filter(
            (t) =>
              String(t.category || "").toLowerCase() ===
              String(category || "").toLowerCase()
          )
          .map((t) => Number(t.amount || 0));
        if (!same || same.length === 0) return { count: 0, mean: 0, std: 0 };
        const mean = same.reduce((s, v) => s + v, 0) / same.length;
        const variance =
          same.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / same.length;
        const std = Math.sqrt(variance);
        return { count: same.length, mean, std };
      } catch (e) {
        return { count: 0, mean: 0, std: 0 };
      }
    },
    // classify a transaction amount for a category using z-score or heuristics
    classifyTransaction: (amount, category) => {
      try {
        // compute from current transactions state
        const same = (transactions || [])
          .filter(
            (t) =>
              String(t.category || "").toLowerCase() ===
              String(category || "").toLowerCase()
          )
          .map((t) => Number(t.amount || 0));
        let mean = 0,
          std = 0,
          count = 0;
        if (same && same.length >= 1) {
          count = same.length;
          mean = same.reduce((s, v) => s + v, 0) / same.length;
          const variance =
            same.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / same.length;
          std = Math.sqrt(variance);
        }

        const amt = Number(amount || 0);
        if (count >= 3 && std > 0) {
          const z = (amt - mean) / std;
          if (z >= 2)
            return {
              label: "too_high",
              note: `Unusually high for ${category}`,
              z,
            };
          if (z <= -2)
            return {
              label: "too_low",
              note: `Unusually low for ${category}`,
              z,
            };
          // good income heuristic
          if (amt > mean && amt - mean > 1.5 * std)
            return {
              label: "good",
              note: `Higher than usual for ${category}`,
              z,
            };
          return {
            label: "normal",
            note: `Matches typical ${category} transactions`,
            z,
          };
        }

        // fallback heuristics when insufficient history
        // use median-ish heuristic: if amount is >200% of median -> too high; <50% -> too low
        if (same && same.length > 0) {
          const sorted = same.slice().sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          const median =
            sorted.length % 2 === 1
              ? sorted[mid]
              : (sorted[mid - 1] + sorted[mid]) / 2;
          if (median !== 0) {
            if (amt > median * 2)
              return {
                label: "too_high",
                note: `High compared to past ${category}`,
                median,
              };
            if (amt < median * 0.5)
              return {
                label: "too_low",
                note: `Low compared to past ${category}`,
                median,
              };
          }
        }

        // default: normal
        return {
          label: "normal",
          note: `No unusual pattern detected for ${category}`,
        };
      } catch (e) {
        return { label: "unknown", note: "Could not classify" };
      }
    },
  };
}

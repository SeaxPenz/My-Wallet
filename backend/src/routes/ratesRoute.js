import express from "express";
import dotenv from "dotenv";
dotenv.config();

// Ensure a fetch implementation exists (globalThis.fetch on Node 18+, otherwise try node-fetch)
let _fetch = globalThis.fetch;
async function ensureFetch() {
  if (!_fetch) {
    try {
      // dynamic import to avoid hard dependency in environments that already have fetch
      // eslint-disable-next-line import/no-extraneous-dependencies
      const nf = await import("node-fetch");
      _fetch = nf.default || nf;
      console.log("Using node-fetch as fetch implementation");
    } catch (e) {
      console.warn("No fetch available on server:", e?.message || e);
      _fetch = undefined;
    }
  }
}

// eagerly try to set up fetch; top-level await is supported in this ESM repo
await ensureFetch();

const router = express.Router();

// Proxies exchange rate requests to exchangerate-api and hides the API key from clients.
router.get("/latest/:base?", async (req, res) => {
  const base = (req.params.base || "USD").toUpperCase();
  const API_KEY = process.env.EXCHANGE_API_KEY || "";

  if (!_fetch) {
    console.error("No fetch implementation available on server");
    return res.status(500).json({ error: "Server fetch unavailable" });
  }

  // small helper to fetch with timeout and return { ok, status, body }
  async function safeFetch(url, timeoutMs = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const r = await _fetch(url, { signal: controller.signal });
      const text = await r.text();
      // attempt to parse JSON if content-type indicates JSON
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = null;
      }
      return { ok: r.ok, status: r.status, parsed, text };
    } catch (e) {
      return { ok: false, error: e?.message || e };
    } finally {
      clearTimeout(id);
    }
  }

  try {
    // Try primary provider if API key present
    if (API_KEY) {
      const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${encodeURIComponent(
        base
      )}`;
      const resp = await safeFetch(url);
      if (resp.ok && resp.parsed) {
        const data = resp.parsed;
        if (data && data.conversion_rates) {
          return res.json({
            rates: data.conversion_rates,
            ts: Date.now(),
            base: data.base_code || base,
            provider: "exchangerate-api",
          });
        }
        console.warn("exchangerate-api returned unexpected shape", {
          status: resp.status,
          body: resp.text?.slice(0, 400),
        });
      } else {
        console.warn("exchangerate-api fetch failed", resp);
      }
    }

    // Try several public fallback providers in order. Some providers may now require keys,
    // so we attempt multiple endpoints and pick the first that returns a usable `rates` object.
    const candidates = [
      {
        name: "exchangerate.host",
        url: `https://api.exchangerate.host/latest?base=${encodeURIComponent(
          base
        )}`,
        getRates: (p) => p.rates,
        getBase: (p) => p.base,
      },
      {
        name: "open.er-api",
        url: `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
        getRates: (p) => p.rates || p.conversion_rates,
        getBase: (p) => p.base_code || p.base,
      },
      {
        name: "exchangerate-api-v4",
        url: `https://api.exchangerate-api.com/v4/latest/${encodeURIComponent(
          base
        )}`,
        getRates: (p) => p.rates || p.conversion_rates,
        getBase: (p) => p.base || p.base_code,
      },
    ];

    for (const c of candidates) {
      try {
        const r = await safeFetch(c.url);
        if (r.ok && r.parsed) {
          const ratesObj = c.getRates(r.parsed);
          if (ratesObj && typeof ratesObj === "object") {
            return res.json({
              rates: ratesObj,
              ts: Date.now(),
              base: c.getBase(r.parsed) || base,
              provider: c.name,
            });
          }
          // provider returned JSON but no rates field
          console.warn(`Rates provider ${c.name} returned JSON without rates`, {
            providerBody: r.text?.slice(0, 800),
          });
        } else {
          console.warn(`Rates provider ${c.name} fetch failed or non-OK`, r);
        }
      } catch (e) {
        console.warn(
          `Error contacting rates provider ${c.name}`,
          e?.message || e
        );
      }
    }

    // If we reach here, all attempted providers failed or returned unexpected data.
    console.error("Rates proxy: upstreams failed", {
      primary: API_KEY ? "tried" : "skipped",
      triedProviders: candidates.map((c) => c.name),
    });
    return res
      .status(502)
      .json({ error: "Invalid response from upstream provider" });
  } catch (err) {
    console.error("Rates proxy error", err?.message || err);
    return res.status(502).json({ error: "Failed to retrieve rates" });
  }
});

export default router;

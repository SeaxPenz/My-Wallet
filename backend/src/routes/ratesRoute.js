import express from "express";
import dotenv from "dotenv";
dotenv.config();

// prefer global fetch (Node 18+). If not available, try to require node-fetch dynamically.
let _fetch = global.fetch;
try {
  if (!_fetch) {
    // dynamic import to avoid failing on environments without node-fetch installed
    // eslint-disable-next-line import/no-extraneous-dependencies
    const nf = await import("node-fetch");
    _fetch = nf.default || nf;
  }
} catch (e) {
  // leave _fetch undefined and handle later
  _fetch = global.fetch;
}

const router = express.Router();

// Proxies exchange rate requests to exchangerate-api and hides the API key from clients.
router.get("/latest/:base?", async (req, res) => {
  const base = (req.params.base || "USD").toUpperCase();
  const API_KEY = process.env.EXCHANGE_API_KEY || "";
  try {
    // If an API key is provided, prefer exchangerate-api (kept server-side)
    if (API_KEY) {
      const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${encodeURIComponent(
        base
      )}`;
      if (!_fetch) {
        console.error("No fetch implementation available on server");
        return res.status(500).json({ error: "Server fetch unavailable" });
      }
      const r = await _fetch(url);
      const data = await r.json();
      // only forward the conversion_rates portion for simplicity
      if (data && data.conversion_rates) {
        return res.json({
          rates: data.conversion_rates,
          ts: Date.now(),
          base: data.base_code || base,
          provider: "exchangerate-api",
        });
      }
      // if the upstream returned an unexpected shape, fall through to fallback
      console.warn("exchangerate-api returned unexpected data", data);
    }

    // Fallback: use a free, no-key provider so clients work out-of-the-box during development
    // exchangerate.host provides a compatible rates object at /latest?base=XXX
    const fallbackUrl = `https://api.exchangerate.host/latest?base=${encodeURIComponent(
      base
    )}`;
    if (!_fetch) {
      console.error("No fetch implementation available on server");
      return res.status(500).json({ error: "Server fetch unavailable" });
    }
    const fr = await _fetch(fallbackUrl);
    const fdata = await fr.json();
    if (fdata && fdata.rates) {
      return res.json({
        rates: fdata.rates,
        ts: Date.now(),
        base: fdata.base || base,
        provider: "exchangerate.host",
      });
    }

    return res
      .status(502)
      .json({ error: "Invalid response from upstream provider" });
  } catch (err) {
    console.error("Rates proxy error", err?.message || err);
    return res.status(502).json({ error: "Failed to retrieve rates" });
  }
});

export default router;

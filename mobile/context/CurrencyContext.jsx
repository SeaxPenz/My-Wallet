import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "../lib/secureStore";

const STORE_KEY = "user.currency";
const STORE_KEY_RATES = "currency.rates";

const available = {
  NGN: { code: "NGN", symbol: "₦", locale: "en-NG" },
  USD: { code: "USD", symbol: "$", locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", locale: "en-GB" },
};

const CurrencyContext = createContext({
  currency: available.USD,
  setCurrency: () => {},
  available,
});

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrencyState] = useState(available.USD);
  const [rates, setRates] = useState({ USD: 1 });
  const [version, setVersion] = useState(Date.now());

  // fetch simple exchange rates with USD as base
  // load cached rates and fetch fresh rates
  useEffect(() => {
    let mounted = true;

    const loadCachedAndFetch = async () => {
      try {
        const raw = await SecureStore.getItemAsync(STORE_KEY_RATES);
        if (raw) {
          const parsed = JSON.parse(raw);
          // use cached rates immediately if present
          if (parsed && parsed.rates) {
            setRates(parsed.rates);
          }
        }
      } catch (err) {
        console.warn('Failed to load cached rates', err);
      }

      // fetch latest in background
      try {
        await fetchRates(true);
      } catch (err) {
        if (mounted) console.warn('Failed to fetch exchange rates', err);
      }
    };

    loadCachedAndFetch();
    return () => { mounted = false };
  }, []);

  // fetch and optionally persist rates
  const fetchRates = async (force = false) => {
    try {
      const symbols = Object.keys(available).join(",");
      const res = await fetch(`https://api.exchangerate.host/latest?base=USD&symbols=${symbols}`);
      const data = await res.json();
      if (data && data.rates) {
        const newRates = { ...data.rates, USD: 1 };
        setRates(newRates);
  // bump version so consumers re-render with new rates immediately
  setVersion(Date.now());
        try {
          await SecureStore.setItemAsync(STORE_KEY_RATES, JSON.stringify({ rates: newRates, ts: Date.now() }));
        } catch (err) {
          console.warn('Failed to persist rates', err);
        }
      }
    } catch (err) {
      if (force) throw err; // bubble up when caller requested force
      console.warn('Failed to fetch exchange rates', err);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(STORE_KEY);
        if (stored && available[stored]) setCurrencyState(available[stored]);
      } catch (err) {
        console.warn("Currency load failed", err);
      }
    })();
  }, []);

  const setCurrency = async (code) => {
    if (!available[code]) return;
  setCurrencyState(available[code]);
    try {
      await SecureStore.setItemAsync(STORE_KEY, code);
    } catch (err) {
      console.warn("Currency save failed", err);
    }
    // proactively fetch latest rates for the newly selected currency so UI updates immediately
    try {
      await fetchRates(true);
    } catch (err) {
      console.warn('Failed to refresh rates after currency change', err);
    }
  // force consumers to refresh
  setVersion(Date.now());
  };

  const convert = (amount = 0) => {
    // assume stored amounts are in USD; convert to selected currency
    const baseAmount = Number(amount) || 0;
    const rate = rates[currency.code] || 1;
    return baseAmount * rate;
  };

  const refreshRates = async () => {
    await fetchRates(true);
  };

  // convert a value expressed in the currently selected currency back to USD (base)
  const toBase = (amount = 0) => {
    const v = Number(amount) || 0;
    const rate = rates[currency.code] || 1;
    if (rate === 0) return v;
    return v / rate;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, available, rates, convert, refreshRates, toBase, version }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

export default CurrencyContext;

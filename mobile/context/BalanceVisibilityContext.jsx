import React, { createContext, useContext, useEffect, useState } from 'react';
import { getItemAsync, setItemAsync } from '../lib/secureStore';

const KEY = 'show_balance';

const BalanceVisibilityContext = createContext(null);

export function BalanceVisibilityProvider({ children }) {
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const v = await getItemAsync(KEY);
        if (!mounted) return;
        if (v === null || v === undefined) {
          setVisible(true);
        } else {
          setVisible(String(v) === 'true');
        }
      } catch (e) {
        setVisible(true);
      } finally {
        if (mounted) setLoaded(true);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // persist changes
    (async () => {
      try {
        await setItemAsync(KEY, String(visible));
      } catch (e) {
        // ignore persistence failures
      }
    })();
  }, [visible]);

  return (
    <BalanceVisibilityContext.Provider value={{ visible, setVisible, loaded }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const ctx = useContext(BalanceVisibilityContext);
  if (!ctx) {
    // fallback for components rendered outside provider: default visible
    return { visible: true, setVisible: () => {}, loaded: true };
  }
  return ctx;
}

export default BalanceVisibilityProvider;

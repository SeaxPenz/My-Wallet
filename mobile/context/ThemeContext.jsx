import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'user.theme';

export const THEME_LIST = {
  light: {
    id: 'light',
    name: 'Sunlight',
    background: '#FFF8F3',
    text: '#4A3428',
    primary: '#8B593E',
    card: '#FFFFFF',
    mode: 'light',
  border: '#E5D3B7',
  white: '#FFFFFF',
  textLight: '#9A8478',
  expense: '#E74C3C',
  income: '#2ECC71',
  shadow: '#000000',
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze',
    background: '#E6F7FF',
    text: '#023047',
    primary: '#0477BF',
    card: '#FFFFFF',
    mode: 'light',
  border: '#BEE6F7',
  white: '#FFFFFF',
  textLight: '#4FB0E6',
  expense: '#EF5350',
  income: '#26A69A',
  shadow: '#000000',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    background: '#FFF4EE',
    text: '#402218',
    primary: '#FF6B35',
    card: '#FFFFFF',
    mode: 'light',
  border: '#FFD9C9',
  white: '#FFFFFF',
  textLight: '#C57A60',
  expense: '#D32F2F',
  income: '#2E7D32',
  shadow: '#000000',
  },
  dark: {
    id: 'dark',
    name: 'Midnight',
    background: '#0B0B0D',
    text: '#EAEAEA',
    primary: '#8B59A3',
    card: '#121212',
    mode: 'dark',
  border: '#1F1F23',
  white: '#FFFFFF',
  textLight: '#A9A9A9',
  expense: '#FF6B6B',
  income: '#66E29D',
  shadow: '#000000',
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    background: '#E6F4EA',
    text: '#2E4637',
    primary: '#2E7D32',
    card: '#FFFFFF',
    mode: 'light',
  border: '#C8E6C9',
  white: '#FFFFFF',
  textLight: '#66BB6A',
  expense: '#C62828',
  income: '#388E3C',
  shadow: '#000000',
  },
  purple: {
    id: 'purple',
    name: 'Purple',
    background: '#F3E6FF',
    text: '#4B2E63',
    primary: '#6A1B9A',
    card: '#FFFFFF',
    mode: 'light',
  border: '#D1C4E9',
  white: '#FFFFFF',
  textLight: '#BA68C8',
  expense: '#D32F2F',
  income: '#388E3C',
  shadow: '#000000',
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    background: '#F4F6F8',
    text: '#1F2937',
    primary: '#0F172A',
    card: '#FFFFFF',
    mode: 'light',
  border: '#E6E9EE',
  white: '#FFFFFF',
  textLight: '#94A3B8',
  expense: '#E11D48',
  income: '#10B981',
  shadow: '#000000',
  },
};

const ThemeContext = createContext({ theme: THEME_LIST.light, setTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEME_LIST.light);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (stored && THEME_LIST[stored]) setThemeState(THEME_LIST[stored]);
      } catch (err) {
        console.warn('Theme load failed', err);
      }
    })();
  }, []);

  const setTheme = async (id) => {
    if (!THEME_LIST[id]) return;
    setThemeState(THEME_LIST[id]);
    try {
      await SecureStore.setItemAsync(THEME_KEY, id);
    } catch (err) {
      console.warn('Theme save failed', err);
    }
  };

  return <ThemeContext.Provider value={{ theme, setTheme, THEME_LIST }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

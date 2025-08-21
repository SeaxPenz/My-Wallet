import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from '../lib/secureStore';

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
    name: 'Moonlight',
    mode: 'dark',
    background: '#0A0F14',
    card: '#0F1720',
    text: '#E6EEF3',
    textLight: '#AFC7D6',
    border: '#121921',
    primary: '#4FB0FF',
    white: '#0B0F12',
    expense: '#FF6B6B',
    income: '#2DD4BF',
    shadow: '#000000',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
    background: '#03040A',
    card: '#0A0B12',
    text: '#F3F6FA',
    textLight: '#B5C2D1',
    border: '#0D1117',
    primary: '#7C5CFF',
    expense: '#FF6B6B',
    income: '#4CE0A6',
    shadow: '#000000',
  },
  solar: {
    id: 'solar',
    name: 'Solar Flare',
    mode: 'light',
    background: '#FFF8ED',
    card: '#FFFDF8',
    text: '#3B2F2A',
    textLight: '#8A6A55',
    border: '#FFE9C8',
    primary: '#FF7A1A',
    expense: '#E53935',
    income: '#2E7D32',
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
  retro: {
    id: 'retro',
    name: 'Retro',
    background: '#FFF6E8',
    text: '#3A2E2A',
    primary: '#C45A2D',
    card: '#FFF9F2',
    mode: 'light',
    border: '#E9D6C2',
    white: '#FFFFFF',
    textLight: '#A97B63',
    expense: '#D23E2A',
    income: '#2E7D32',
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

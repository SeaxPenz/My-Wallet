import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from '../lib/secureStore';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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
  // slightly lighter than pure black to improve contrast for avatars and names
  background: '#0E141A',
  card: '#121821',
    text: '#E6EEF3',
    textLight: '#AFC7D6',
    border: '#121921',
    primary: '#4FB0FF',
  // was incorrectly set to a dark color which caused contrast issues; use true white
  white: '#FFFFFF',
    expense: '#FF6B6B',
    income: '#2DD4BF',
    shadow: '#000000',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    mode: 'dark',
  // reduce the depth so text and avatars remain visible
  background: '#080913',
  card: '#0F1117',
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
  // Additional curated themes
  elegant: {
    id: 'elegant',
    name: 'Elegant Gray',
    mode: 'light',
    background: '#F7F7F9',
    card: '#FFFFFF',
    text: '#1F2937',
    headerText: '#0B1220',
    textLight: '#8A94A6',
    primary: '#5560FF',
    border: '#E6E9EE',
    white: '#FFFFFF',
    expense: '#E11D48',
    income: '#10B981',
    shadow: '#000000',
  },
  ember: {
    id: 'ember',
    name: 'Ember',
    mode: 'light',
    background: '#FFF7F5',
    card: '#FFFBF9',
    text: '#3B2B2A',
    headerText: '#2A1F1E',
    textLight: '#C99688',
    primary: '#FF6B35',
    border: '#FFE6E0',
    white: '#FFFFFF',
    expense: '#D32F2F',
    income: '#2E7D32',
    shadow: '#000000',
  },
  seafoam: {
    id: 'seafoam',
    name: 'Seafoam',
    mode: 'light',
    background: '#F0FFFB',
    card: '#FFFFFF',
    text: '#123B33',
    headerText: '#0B2E26',
    textLight: '#8EDBC9',
    primary: '#00B39F',
    border: '#DEFFF6',
    white: '#FFFFFF',
    expense: '#E53935',
    income: '#2E7D32',
    shadow: '#000000',
  },
};

const ThemeContext = createContext({ theme: THEME_LIST.light, setTheme: () => {} });

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(THEME_LIST.light);
  const [customThemes, setCustomThemes] = useState({});
  // wallpaper settings: uri of chosen image, opacity and brightness
  const [wallpaper, setWallpaper] = useState(null);
  const [wallpaperOpacity, setWallpaperOpacity] = useState(0.5);
  const [wallpaperBrightness, setWallpaperBrightness] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(THEME_KEY);
        if (stored && THEME_LIST[stored]) setThemeState(THEME_LIST[stored]);
        const c = await SecureStore.getItemAsync('user.custom.themes');
        if (c) {
          try { setCustomThemes(JSON.parse(c)); } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn('Theme load failed', err);
      }
    })();
  }, []);

  // load wallpaper settings
  useEffect(() => {
    (async () => {
      try {
        const uri = await SecureStore.getItemAsync('user.wallpaper');
        // wallpaper may be a persisted string (remote uri) or a saved id for a local asset
        if (uri) {
          try {
            const parsed = JSON.parse(uri);
            // expected shape: { id: string|number, uri: string }
            if (parsed && parsed.uri) setWallpaper(parsed);
            else if (parsed && parsed.id != null) {
              // try to map known local thumbnail ids back to required modules
              const thumbMap = getLocalThumbnails();
              if (thumbMap[parsed.id]) setWallpaper({ id: parsed.id, module: thumbMap[parsed.id], uri: parsed.uri || '' });
              else setWallpaper(parsed);
            }
            else setWallpaper(uri);
          } catch (e) { setWallpaper(uri); }
        }
        const ws = await SecureStore.getItemAsync('user.wallpaper.settings');
        if (ws) {
          const parsed = JSON.parse(ws);
          if (parsed.opacity != null) setWallpaperOpacity(parsed.opacity);
          if (parsed.brightness != null) setWallpaperBrightness(parsed.brightness);
        }
      } catch (err) {
        console.warn('Failed to load wallpaper settings', err);
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

  // wallpaper persistence helpers
  const setWallpaperUri = async (uri) => {
    setWallpaper(uri);
    try {
      // persist either a string uri or a small object with id/uri
      if (typeof uri === 'string') {
        await SecureStore.setItemAsync('user.wallpaper', uri || '');
      } else if (uri && (uri.id || uri.uri)) {
        await SecureStore.setItemAsync('user.wallpaper', JSON.stringify({ id: uri.id, uri: uri.uri || '' }));
      }
    } catch (e) { console.warn('Failed to save wallpaper', e); }
  };

  // helper to pick an image from device and set as wallpaper
  const pickDeviceWallpaper = async () => {
    try {
      const resPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!resPerm.granted) return null;
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true });
      if (!result.cancelled) {
        // resize/compress to a reasonable size for backgrounds
        try {
          const manip = await ImageManipulator.manipulateAsync(result.uri, [{ resize: { width: 1600 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG });
          const obj = { uri: manip.uri };
          await setWallpaperUri(obj);
          return obj;
        } catch (e) {
          const obj = { uri: result.uri };
          await setWallpaperUri(obj);
          return obj;
        }
      }
      return null;
    } catch (e) {
      console.warn('Wallpaper pick failed', e);
      return null;
    }
  };

  const editDeviceWallpaper = async () => {
    // allow re-picking and re-processing the current wallpaper
    return await pickDeviceWallpaper();
  };

  const cropDeviceWallpaper = async (uri, aspect = 'square') => {
    // aspect: 'square' or '16:9' or 'free' (no-op)
    try {
      if (!uri) return null;
      // get image size
      const size = await new Promise((resolve, reject) => {
        // use Image.getSize to fetch dimensions
        try {
          const { Image } = require('react-native');
          Image.getSize(uri, (w, h) => resolve({ w, h }), (err) => reject(err));
        } catch (e) { reject(e); }
      });
      const { w, h } = size;
      if (!w || !h) return null;
      let cropW = w;
      let cropH = h;
      if (aspect === 'square') {
        const side = Math.min(w, h);
        cropW = side; cropH = side;
      } else if (aspect === '16:9') {
        const targetRatio = 16 / 9;
        if (w / h > targetRatio) {
          cropH = h; cropW = Math.round(h * targetRatio);
        } else {
          cropW = w; cropH = Math.round(w / targetRatio);
        }
      }
      const originX = Math.max(0, Math.floor((w - cropW) / 2));
      const originY = Math.max(0, Math.floor((h - cropH) / 2));
      const manip = await ImageManipulator.manipulateAsync(uri, [{ crop: { originX, originY, width: cropW, height: cropH } }, { resize: { width: 1600 } }], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG });
      if (manip && manip.uri) {
        const obj = { uri: manip.uri };
        await setWallpaperUri(obj);
        return obj;
      }
      return null;
    } catch (e) {
      console.warn('Crop failed', e);
      return null;
    }
  };

  // local thumbnails mapping (id -> required module) so selected local wallpapers persist by id
  const getLocalThumbnails = () => ({
    0: require('../assets/images/Pose-1.png'),
    1: require('../assets/images/Pose-3a.png'),
    2: require('../assets/images/logo.png'),
  });

  const setWallpaperSettings = async ({ opacity = 0.5, brightness = 1 } = {}) => {
    setWallpaperOpacity(opacity);
    setWallpaperBrightness(brightness);
    try { await SecureStore.setItemAsync('user.wallpaper.settings', JSON.stringify({ opacity, brightness })); } catch (e) { console.warn('Failed to save wallpaper settings', e); }
  };

  const addCustomTheme = async (id, themeObj) => {
    const next = { ...customThemes, [id]: themeObj };
    setCustomThemes(next);
    try { await SecureStore.setItemAsync('user.custom.themes', JSON.stringify(next)); } catch (e) { console.warn('Failed to persist custom themes', e); }
  };

  const removeCustomTheme = async (id) => {
    const next = { ...customThemes };
    delete next[id];
    setCustomThemes(next);
    try { await SecureStore.setItemAsync('user.custom.themes', JSON.stringify(next)); } catch (e) { console.warn('Failed to persist custom themes', e); }
  };

  // merge built-in and custom themes for consumers
  const availableThemes = { ...THEME_LIST, ...customThemes };
  // ensure every theme includes a headerText token for consistent header contrast
  const availableThemesNormalized = Object.fromEntries(
    Object.entries(availableThemes).map(([k, v]) => [k, { ...v, headerText: v.headerText || (v.mode === 'dark' ? (v.white || '#FFFFFF') : '#111111') }])
  );

  return <ThemeContext.Provider value={{ theme, setTheme, THEME_LIST: availableThemesNormalized, wallpaper, setWallpaper: setWallpaperUri, wallpaperOpacity, wallpaperBrightness, setWallpaperSettings, addCustomTheme, removeCustomTheme, pickDeviceWallpaper, editDeviceWallpaper, cropDeviceWallpaper }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

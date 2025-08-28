import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from '../lib/secureStore';
import * as ImagePicker from 'expo-image-picker';

const WallpaperContext = createContext();

export function WallpaperProvider({ children }) {
  const [wallpaper, setWallpaper] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const uri = await SecureStore.getItemAsync('wallpaper.uri');
      if (uri) setWallpaper(uri);
      setLoading(false);
    })();
  }, []);

  const pickWallpaper = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets[0]?.uri) {
      setWallpaper(result.assets[0].uri);
      await SecureStore.setItemAsync('wallpaper.uri', result.assets[0].uri);
    }
  };

  const clearWallpaper = async () => {
    setWallpaper(null);
    await SecureStore.deleteItemAsync('wallpaper.uri');
  };

  return (
    <WallpaperContext.Provider value={{ wallpaper, pickWallpaper, clearWallpaper, loading }}>
      {children}
    </WallpaperContext.Provider>
  );
}

export function useWallpaper() {
  return useContext(WallpaperContext);
}

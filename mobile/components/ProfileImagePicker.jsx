import React from 'react';
import { View, Text, Image, Pressable, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// A small image picker helper that tries to copy the picked image into the app's documentDirectory
// so it persists across sessions and can be safely deleted later. Falls back gracefully on web.
export default function ProfileImagePicker({ value, onChange, pickDeviceWallpaper, theme }) {
  const pick = async () => {
    try {
      // Prefer centralized picker if provided by ThemeContext
      if (pickDeviceWallpaper) {
        const picked = await pickDeviceWallpaper();
        if (!picked || !picked.uri) return;
        const uri = picked.uri;
        await handleCopy(uri);
        return;
      }

      // dynamic import to avoid bundling native-only modules on web
      const ImagePicker = await import('expo-image-picker');
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
      if (result.cancelled || !result.assets) return;
      const asset = result.assets[0];
      if (!asset || !asset.uri) return;
      await handleCopy(asset.uri);
    } catch (err) {
      console.warn('Pick image failed', err);
      Alert.alert('Pick failed', String(err?.message || err));
    }
  };

  const handleCopy = async (srcUri) => {
    try {
      // On web, FileSystem.documentDirectory may behave differently. Keep the original uri.
      if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
        onChange && onChange(srcUri);
        return;
      }

      // If src is remote, download first
      let finalSrc = srcUri;
      if (srcUri.startsWith('http://') || srcUri.startsWith('https://')) {
        const dest = `${FileSystem.cacheDirectory}profile-download-${Date.now()}`;
        const dl = await FileSystem.downloadAsync(srcUri, dest);
        finalSrc = dl.uri;
      }

      const ext = finalSrc.split('.').pop().split('?')[0] || 'jpg';
      const destPath = `${FileSystem.documentDirectory}profile-${Date.now()}.${ext}`;
      try {
        await FileSystem.copyAsync({ from: finalSrc, to: destPath });
      } catch (_err) {
        // some platforms may not support copy; fallback to download
        try {
          await FileSystem.downloadAsync(finalSrc, destPath);
        } catch (err) {
          console.warn('Copy/download fallback failed', err);
          onChange && onChange(srcUri);
          return;
        }
      }
      onChange && onChange(destPath);
    } catch (err) {
      console.warn('Handle copy failed', err);
      Alert.alert('Image save failed', String(err?.message || err));
      onChange && onChange(srcUri);
    }
  };

  const remove = async () => {
    try {
      if (value && value.startsWith(FileSystem.documentDirectory)) {
        try { await FileSystem.deleteAsync(value, { idempotent: true }); } catch (_e) { /* ignore */ }
      }
      onChange && onChange(null);
    } catch (err) {
      console.warn('Remove image failed', err);
      Alert.alert('Remove failed', String(err?.message || err));
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable onPress={pick} style={{ marginTop: 12 }}>
        {value ? (
          <Image source={{ uri: value }} style={{ width: 96, height: 96, borderRadius: 48 }} />
        ) : (
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme?.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: theme?.onPrimary || '#fff' }}>Upload</Text>
          </View>
        )}
      </Pressable>

      {value ? (
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <Pressable onPress={remove} style={{ marginRight: 12 }}>
            <Text style={{ color: theme?.primary || '#007AFF' }}>Remove</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

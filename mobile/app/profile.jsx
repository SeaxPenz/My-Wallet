import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, TouchableOpacity, Alert, Platform } from 'react-native';
import * as SecureStore from '../lib/secureStore';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../constants/api';
import { useSafeUser as useUser } from "../hooks/useSafeUser";
import useSafeClerk from '../hooks/useSafeClerk';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import ProfileImagePicker from '../components/ProfileImagePicker';

export default function ProfilePage() {
  const { theme, pickDeviceWallpaper } = useTheme();
  const { user } = useUser();
  const { updateUser } = useSafeClerk();
  const [name, setName] = useState(user?.fullName || '');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState(user?.phoneNumber || '');
  const [imageUri, setImageUri] = useState(null);
  const router = useRouter();

  useEffect(() => {
      (async () => {
        try {
          const stored = await SecureStore.getItemAsync('user.profile');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.name) setName(parsed.name);
            if (parsed.address) setAddress(parsed.address);
            if (parsed.contact) setContact(parsed.contact);
            if (parsed.imageUri) setImageUri(parsed.imageUri);
          }
        } catch (_err) {
          /* ignore */
        }
      })();
  }, []);

  const onImageChange = async (newUri) => {
    setImageUri(newUri);
    try {
      const payload = { name, address, contact, imageUri: newUri };
      await SecureStore.setItemAsync('user.profile', JSON.stringify(payload));
    } catch (_err) {
      // ignore
    }
  };

  const saveImageToGallery = async () => {
    if (!imageUri) return Alert.alert('No image', 'Please upload an image first.');
    try {
      if (Platform.OS === 'web') {
        return Alert.alert('Not supported on web', 'Saving to device gallery is only available on native platforms.');
      }
      // dynamically import expo-media-library to avoid bundling errors on web
      // eslint-disable-next-line import/no-unresolved
      const MediaLibrary = await import('expo-media-library');

      // support older and newer expo-media-library permission APIs
      let perm = null;
      if (typeof MediaLibrary.requestPermissionsAsync === 'function') {
        perm = await MediaLibrary.requestPermissionsAsync();
      } else if (typeof MediaLibrary.requestMediaLibraryPermissionsAsync === 'function') {
        perm = await MediaLibrary.requestMediaLibraryPermissionsAsync();
      }
      if (perm && !perm.granted) {
        return Alert.alert('Permission required', 'Permission to access the media library is required to save images.');
      }

      let localUri = imageUri;
      // If it's a remote http(s) url, download it to a temporary cache file first
      if (!localUri.startsWith('file://') && (localUri.startsWith('http://') || localUri.startsWith('https://'))) {
        const dest = `${FileSystem.cacheDirectory}profile-${Date.now()}.jpg`;
        const downloaded = await FileSystem.downloadAsync(localUri, dest);
        localUri = downloaded.uri;
      }

      if (!localUri) throw new Error('Local file not available');

      const asset = await MediaLibrary.createAssetAsync(localUri);
      try {
        if (typeof MediaLibrary.createAlbumAsync === 'function') {
          await MediaLibrary.createAlbumAsync('MyWallet', asset, false);
        }
      } catch (_e) {
        // on some platforms the album may already exist or creation may fail; ignore
      }
      Alert.alert('Saved', 'Profile image saved to your device gallery.');
    } catch (err) {
      console.warn('Save to gallery failed', err);
      Alert.alert('Save failed', String(err?.message || err));
    }
  };

  const clearImage = async () => {
    // delete local file when possible
    try {
      if (imageUri && imageUri.startsWith(FileSystem.documentDirectory)) {
        try { await FileSystem.deleteAsync(imageUri, { idempotent: true }); } catch (_e) { /* ignore */ }
      }
    } catch (_err) {
      // ignore
    }
    setImageUri(null);
    try {
      const payload = { name, address, contact, imageUri: null };
      await SecureStore.setItemAsync('user.profile', JSON.stringify(payload));
    } catch (_err) {}
  };

  const saveProfile = async () => {
    try {
      const payload = { name, address, contact, imageUri };
      await SecureStore.setItemAsync('user.profile', JSON.stringify(payload));
      // attempt to update Clerk public metadata so name/avatar can be available from user object elsewhere
      try {
        if (user && user.id) {
          // updateUser is provided by Clerk; wrap in try/catch
          try {
            await updateUser(user.id, { publicMetadata: { name, imageUri } });
          } catch (_err) {
            // ignore update failures when Clerk missing or offline
          }
        }
      } catch (_err) {
        console.error('Error saving profile:', _err);
      }
      // attempt to save to backend profile endpoint (best-effort)
      try {
        const devUserId = process.env.EXPO_DEV_USER_ID;
        const headers = { 'Content-Type': 'application/json' };
        if (devUserId) headers['x-user-id'] = devUserId;
        await fetch(`${API_URL}/users/${user?.id || ''}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, imageUri, contact, address }),
        });
        // If imageUri is an externally reachable URL, ask backend to fetch and sync to Clerk
        try {
          if (imageUri && (imageUri.startsWith('http://') || imageUri.startsWith('https://'))) {
            await fetch(`${API_URL}/users/${user?.id || ''}/avatar`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ imageUrl: imageUri }),
            });
          }
        } catch (_e) {
          // ignore avatar sync failures
        }
      } catch (_err) {
        // ignore backend failures
      }

      // navigate to dashboard (home)
      router.replace('/');
    } catch (_err) {
      console.warn('Profile save failed', _err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Profile</Text>

      <ProfileImagePicker value={imageUri} onChange={onImageChange} pickDeviceWallpaper={pickDeviceWallpaper} theme={theme} />
      {imageUri ? (
        <TouchableOpacity onPress={saveImageToGallery} style={{ marginTop: 8 }}>
          <Text style={{ color: theme.primary }}>Save to gallery</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Name</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Full name" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 10, borderRadius: 8, color: theme.text, marginTop: 6 }} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Address</Text>
        <TextInput value={address} onChangeText={setAddress} placeholder="Address" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 10, borderRadius: 8, color: theme.text, marginTop: 6 }} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Contact</Text>
        <TextInput value={contact} onChangeText={setContact} placeholder="Phone or contact" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 10, borderRadius: 8, color: theme.text, marginTop: 6 }} />
      </View>

      <View style={{ marginTop: 18 }}>
        <Button title="Save" onPress={saveProfile} color={theme.primary} />
      </View>
    </View>
  );
}

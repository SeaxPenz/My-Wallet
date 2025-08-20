import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from '../lib/secureStore';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../constants/api';
import { useSafeUser as useUser } from "../hooks/useSafeUser";
import useSafeClerk from '../hooks/useSafeClerk';
import { useRouter } from 'expo-router';

export default function ProfilePage() {
  const { theme } = useTheme();
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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    // Support both older (cancelled, uri) and newer (canceled, assets) shapes
    if (result?.cancelled === false && result?.uri) {
      setImageUri(result.uri);
      return;
    }
    if (result?.canceled === false && result?.assets && result.assets.length) {
      setImageUri(result.assets[0].uri);
      return;
    }
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
        await fetch(`${API_URL}/users/${user?.id || ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, imageUri, contact, address }),
        });
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

      <TouchableOpacity onPress={pickImage} style={{ marginTop: 12 }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: 96, height: 96, borderRadius: 48 }} />
        ) : (
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: theme.onPrimary }}>Upload</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Name</Text>
        <TextInput value={name} onChangeText={setName} style={{ color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.border }} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Address</Text>
        <TextInput value={address} onChangeText={setAddress} style={{ color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.border }} />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Contact</Text>
        <TextInput value={contact} onChangeText={setContact} style={{ color: theme.text, borderBottomWidth: 1, borderBottomColor: theme.border }} />
      </View>

      <View style={{ marginTop: 18 }}>
        <Button title="Save" onPress={saveProfile} color={theme.primary} />
      </View>
    </View>
  );
}

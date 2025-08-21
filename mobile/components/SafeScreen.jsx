import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StyleSheet, TouchableOpacity, Image, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ThemeSwitcher from './ThemeSwitcher';
import { SignOutButton } from './SignOutButton';
import { useTheme } from '../context/ThemeContext';
import { useSafeUser as useUser } from '../hooks/useSafeUser';
import * as SecureStore from '../lib/secureStore';
import { StatusBar } from 'expo-status-bar';

export default function SafeScreen({ children }) {
  const router = useRouter();
  const path = usePathname();
  const { theme } = useTheme();
  const { isSignedIn } = useUser() || {};
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const p = await SecureStore.getItemAsync('user.profile');
      if (p) setProfile(JSON.parse(p));
    })();
  }, []);

  const handleBack = () => {
    if (path === '/' || path === '/index') return;
    if (path === '/profile') {
      router.replace('/');
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      {/* Modern mobile header: back/profile/settings/signout, larger touch targets, more spacing */}
      <View style={[styles.topBar, { backgroundColor: theme.card, paddingVertical: 8 }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {path !== '/' && !(path.startsWith('/(auth)') || path.startsWith('/sign') || path.startsWith('/forgot-password')) && (
            <TouchableOpacity onPress={handleBack} style={[styles.iconBtn, { marginRight: 8 }]}> 
              <Ionicons name="arrow-back" size={26} color={theme.text} />
            </TouchableOpacity>
          )}
          {/* Only show profile image and name when signed in and not on auth pages */}
          {isSignedIn && !path.startsWith('/(auth)') && path !== '/' ? (
            <>
              {profile?.imageUri ? (
                <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginRight: 12 }}>
                  <Image source={{ uri: profile.imageUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                </TouchableOpacity>
              ) : null}
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 }} numberOfLines={1}>
                {profile?.name || 'Welcome'}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 }} numberOfLines={1}>
              {path === '/' ? 'My Wallet' : 'Welcome'}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* ThemeSwitcher should be available even when not signed in so users
              can select dark or other themes in dev. Settings/SignOut show only when signed in. */}
          <ThemeSwitcher compact />
          {isSignedIn && !path.startsWith('/(auth)') && (
            <>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}> 
                <Ionicons name="settings-outline" size={24} color={theme.text} />
              </TouchableOpacity>
              <SignOutButton />
            </>
          )}
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {isSignedIn && (
        <View style={[styles.bottomNav, { backgroundColor: theme.card }]}> 
          <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/')}> 
            <Ionicons name="home" size={24} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 13 }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/transactions')}> 
            <Ionicons name="list" size={24} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 13 }}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/reports')}> 
            <Ionicons name="bar-chart" size={24} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 13 }}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}> 
            {profile?.imageUri ? (
              <Image source={{ uri: profile.imageUri }} style={styles.avatarSmall} />
            ) : (
              <Ionicons name="person-circle" size={24} color={theme.text} />
            )}
            <Text style={{ color: theme.text, fontSize: 13 }}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, justifyContent: 'space-between' },
  left: { width: 56, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  right: { width: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  iconBtn: { padding: 8, marginLeft: 6, borderRadius: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  bottomNav: { height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#00000015' },
  navItem: { alignItems: 'center' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14 },
});
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
    // no back on home
    if (path === '/' || path === '/index') return;
    // profile should go to home
    if (path === '/profile') {
      router.replace('/');
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      {/* Top header: single back arrow and right action group */}
      <View style={[styles.topBar, { backgroundColor: theme.card }]}>
        <View style={styles.left}>
          {/* Hide the back arrow for auth routes (grouped under /(auth)) so
              sign-in/sign-up render without a back button. Keep it for other
              screens except home. */}
          {path !== '/' && !(path.startsWith('/(auth)') || path.startsWith('/sign') || path.startsWith('/forgot-password')) && (
            <TouchableOpacity onPress={handleBack} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.center}>
          {/* optional title could be inserted by screens if needed */}
        </View>

        <View style={styles.right}>
          {isSignedIn ? (
            <>
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconBtn}>
                <Ionicons name="settings-outline" size={22} color={theme.text} />
              </TouchableOpacity>

              <ThemeSwitcher compact />

              <SignOutButton />
            </>
          ) : null}
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {/* Bottom static nav (single) */}
      {isSignedIn && (
        <View style={[styles.bottomNav, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.replace('/')}>
            <Ionicons name="home" size={22} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 12 }}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/transactions')}>
            <Ionicons name="list" size={22} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 12 }}>Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/reports')}>
            <Ionicons name="bar-chart" size={22} color={theme.text} />
            <Text style={{ color: theme.text, fontSize: 12 }}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/profile')}>
            {profile?.imageUri ? (
              <Image source={{ uri: profile.imageUri }} style={styles.avatarSmall} />
            ) : (
              <Ionicons name="person-circle" size={22} color={theme.text} />
            )}
            <Text style={{ color: theme.text, fontSize: 12 }}>Profile</Text>
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
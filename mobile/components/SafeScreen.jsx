import React, { useEffect, useState } from 'react';
import { View, SafeAreaView, StyleSheet, Pressable, Image, Text, Platform } from 'react-native';
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
  const { wallpaper, wallpaperOpacity, wallpaperBrightness } = useTheme();
  const { isSignedIn } = useUser() || {};
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const p = await SecureStore.getItemAsync('user.profile');
      if (p) setProfile(JSON.parse(p));
    })();
  }, []);

  const handleBack = () => {
    // prefer safe navigation back when possible, otherwise fall back to replacing to home
    try {
      if (!path) {
        router.replace('/');
        return;
      }
      const p = path.split('?')[0];
      if (p === '/' || p === '/index') return;
      if (p.startsWith('/profile')) {
        router.replace('/');
        return;
      }
      // use router.canGoBack() when available to avoid GO_BACK warnings
      if (typeof router.canGoBack === 'function') {
        if (router.canGoBack()) router.back();
        else router.replace('/');
        return;
      }
      // best-effort fallback
      try { router.back(); } catch (_e) { router.replace('/'); }
      return;
    } catch (e) {
      router.replace('/');
    }
  };

  // normalized path without query for active checks
  const normalizedPath = path ? path.split('?')[0] : '';
  const isActive = (route) => {
    if (!normalizedPath) return false;
    if (route === '/') return normalizedPath === '/' || normalizedPath === '/index';
    return normalizedPath === route || normalizedPath.startsWith(route + '/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />

      {/* Wallpaper (if set) — render absolutely behind content */}
      {wallpaper ? (
        <Image source={ typeof wallpaper === 'string' ? { uri: wallpaper } : wallpaper }
          style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
          resizeMode="cover"
        />
      ) : null}
      {/* brightness/opacity overlay */}
      {wallpaper ? (
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: `rgba(0,0,0,${1 - (wallpaperBrightness || 1)})`, opacity: wallpaperOpacity ?? 0.5 }]} />
      ) : null}

      {/* Modern mobile header: back/profile/settings/signout, larger touch targets, more spacing */}
      <View style={[styles.topBar, { backgroundColor: theme.card, paddingVertical: 8 }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {path !== '/' && !(path.startsWith('/(auth)') || path.startsWith('/sign') || path.startsWith('/forgot-password')) && (
            <Pressable onPress={handleBack} style={[styles.iconBtn, { marginRight: 8 }]} accessibilityRole="button"> 
              <Ionicons name="arrow-back" size={26} color={theme.text} />
            </Pressable>
          )}
          {/* Only show profile image and name when signed in and not on auth pages */}
          {isSignedIn && !path.startsWith('/(auth)') && path !== '/' ? (
            <>
              {profile?.imageUri ? (
                <Pressable onPress={() => router.push('/profile')} style={{ marginRight: 12 }} accessibilityRole="button">
                  <Image source={{ uri: profile.imageUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                </Pressable>
              ) : null}
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 }} numberOfLines={1}>
                {profile?.name || 'Welcome'}
              </Text>
            </>
          ) : (
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#000', flex: 1 }} numberOfLines={1}>
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
              <Pressable onPress={() => router.push('/settings')} style={styles.iconBtn} accessibilityRole="button"> 
                <Ionicons name="settings-outline" size={24} color={theme.text} />
              </Pressable>
              <SignOutButton />
            </>
          )}
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      {isSignedIn && (
        <View style={[styles.bottomNav, { backgroundColor: theme.card }]}> 
          <Pressable style={({ hovered }) => [styles.navItem, hovered && styles.navHover]} onPress={() => router.replace('/')} accessibilityRole="button"> 
            <Ionicons name="home" size={24} color={isActive('/') ? theme.primary : theme.text} />
            <Text style={{ color: isActive('/') ? theme.primary : theme.text, fontSize: 13 }}>Home</Text>
          </Pressable>
          <Pressable style={({ hovered }) => [styles.navItem, hovered && styles.navHover]} onPress={() => router.push('/transactions')} accessibilityRole="button"> 
            <Ionicons name="list" size={24} color={isActive('/transactions') ? theme.primary : theme.text} />
            <Text style={{ color: isActive('/transactions') ? theme.primary : theme.text, fontSize: 13 }}>Transactions</Text>
          </Pressable>
          <Pressable style={({ hovered }) => [styles.navItem, hovered && styles.navHover]} onPress={() => router.push('/reports')} accessibilityRole="button"> 
            <Ionicons name="bar-chart" size={24} color={isActive('/reports') ? theme.primary : theme.text} />
            <Text style={{ color: isActive('/reports') ? theme.primary : theme.text, fontSize: 13 }}>Reports</Text>
          </Pressable>
          <Pressable style={({ hovered }) => [styles.navItem, hovered && styles.navHover]} onPress={() => router.push('/profile')} accessibilityRole="button"> 
            {profile?.imageUri ? (
              <Image source={{ uri: profile.imageUri }} style={styles.avatarSmall} />
            ) : (
              <Ionicons name="person-circle" size={24} color={isActive('/profile') ? theme.primary : theme.text} />
            )}
            <Text style={{ color: isActive('/profile') ? theme.primary : theme.text, fontSize: 13 }}>Profile</Text>
          </Pressable>
        </View>
      )}

      {/* Developer credit footer */}
      <View style={{ padding: 6, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#000', fontSize: 11 }}>Developed by Abraham Ajetomobi © 2025</Text>
      </View>
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
  content: { flex: 1 },
  bottomNav: { height: 64, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 1, borderColor: '#00000015' },
  navItem: { alignItems: 'center', padding: 6, },
  navHover: { opacity: 0.85, transform: [{ scale: 1.02 }], ...(Platform.OS === 'web' ? { transitionDuration: '150ms' } : {}) },
  avatarSmall: { width: 28, height: 28, borderRadius: 14 },
});
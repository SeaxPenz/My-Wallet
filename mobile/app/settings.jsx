import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, PanResponder, Animated, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';
import CurrencySwitcher from '../components/CurrencySwitcher';
import { useCurrency } from '../context/CurrencyContext';

export default function SettingsPage() {
  const { theme, wallpaper, setWallpaper, wallpaperOpacity, wallpaperBrightness, setWallpaperSettings, addCustomTheme, pickDeviceWallpaper, editDeviceWallpaper, cropDeviceWallpaper } = useTheme();
  const { currency } = useCurrency();

  const thumbnails = [
    require('../assets/images/Pose-1.png'),
    require('../assets/images/Pose-3a.png'),
    require('../assets/images/logo.png'),
  ];

  const [localOpacity, setLocalOpacity] = useState(wallpaperOpacity || 0.5);
  const [localBrightness, setLocalBrightness] = useState(wallpaperBrightness || 1);
  const [selectedThumb, setSelectedThumb] = useState(null);

  useEffect(() => {
    // if wallpaper in context is an object with id we can restore selection
    if (wallpaper && typeof wallpaper === 'object' && wallpaper.id != null) {
      setSelectedThumb(wallpaper.id);
    }
  }, [wallpaper]);
  const [newThemeName, setNewThemeName] = useState('');
  const [newThemePrimary, setNewThemePrimary] = useState('#FF7A1A');
  const [newThemeBackground, setNewThemeBackground] = useState('#FFFFFF');
  const [newThemeText, setNewThemeText] = useState('#111111');
  const [newThemeHeaderText, setNewThemeHeaderText] = useState('#111111');
  const [newThemeCard, setNewThemeCard] = useState('#FFFFFF');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropBusy, setCropBusy] = useState(false);

  return (
    <>
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.background }}>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }}>Settings</Text>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textLight, marginBottom: 8 }}>Theme</Text>
        <ThemeSwitcher />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: theme.textLight, marginBottom: 8 }}>Currency</Text>
        <CurrencySwitcher />
        <Text style={{ color: theme.text, marginTop: 8 }}>Selected: {currency.code} {currency.symbol}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ color: theme.textLight }}>More settings will be available here.</Text>
      </View>
      <View style={{ marginTop: 24 }}>
        <Text style={{ color: theme.text, marginBottom: 8 }}>Create Custom Theme</Text>
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextInput value={newThemeName} onChangeText={setNewThemeName} placeholder="Theme id (no spaces)" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 8, borderRadius: 6, color: theme.text, marginBottom: 8 }} />
            <TextInput value={newThemePrimary} onChangeText={setNewThemePrimary} placeholder="#hex primary" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 8, borderRadius: 6, color: theme.text, marginBottom: 8 }} />
            <TextInput value={newThemeBackground} onChangeText={setNewThemeBackground} placeholder="#hex background" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 8, borderRadius: 6, color: theme.text, marginBottom: 8 }} />
            <TextInput value={newThemeText} onChangeText={setNewThemeText} placeholder="#hex text" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 8, borderRadius: 6, color: theme.text, marginBottom: 8 }} />
            <TextInput value={newThemeHeaderText} onChangeText={setNewThemeHeaderText} placeholder="#hex headerText" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 8, borderRadius: 6, color: theme.text, marginBottom: 8 }} />
            <TextInput value={newThemeCard} onChangeText={setNewThemeCard} placeholder="#hex card" placeholderTextColor={theme.textLight} style={{ backgroundColor: theme.card, padding: 8, borderRadius: 6, color: theme.text, marginBottom: 8 }} />
          </View>
            <View style={{ width: 120, height: 120, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#00000008', backgroundColor: newThemeBackground, justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
            <View style={{ width: '100%', height: 36, backgroundColor: newThemeCard, justifyContent: 'center', paddingLeft: 10 }}>
              <Text style={{ color: newThemeHeaderText, fontWeight: '700' }}>{newThemeName || 'Preview'}</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: newThemeText }}>Aa</Text>
              <View style={{ width: 40, height: 24, borderRadius: 6, backgroundColor: newThemePrimary, marginTop: 8 }} />
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => {
          if (!newThemeName) return alert('Provide theme id');
          const id = newThemeName.replace(/\s+/g,'-').toLowerCase();
          // determine mode (dark/light) from background luminance roughly
          const bg = newThemeBackground || '#FFFFFF';
          const hex = bg.replace('#','');
          const r = parseInt(hex.substring(0,2),16) || 255;
          const g = parseInt(hex.substring(2,4),16) || 255;
          const b = parseInt(hex.substring(4,6),16) || 255;
          const luminance = (0.2126*r + 0.7152*g + 0.0722*b) / 255;
          const mode = luminance < 0.5 ? 'dark' : 'light';
          addCustomTheme(id, { id, name: newThemeName, background: newThemeBackground, text: newThemeText, headerText: newThemeHeaderText, primary: newThemePrimary, card: newThemeCard, mode });
          setNewThemeName('');
          setNewThemePrimary('#FF7A1A');
          setNewThemeBackground('#FFFFFF');
          setNewThemeText('#111111');
          setNewThemeHeaderText('#111111');
          setNewThemeCard('#FFFFFF');
        }} style={{ padding: 10, backgroundColor: theme.primary, borderRadius: 8, marginTop: 6 }}>
          <Text style={{ color: theme.white }}>Add Theme</Text>
        </TouchableOpacity>
      </View>
      <View style={{ marginTop: 24 }}>
        <Text style={{ color: theme.textLight, marginBottom: 8 }}>Wallpaper</Text>
    <View style={{ flexDirection: 'row' }}>
          {thumbnails.map((src, i) => (
            <TouchableOpacity key={i} onPress={() => { setSelectedThumb(i); setWallpaper({ id: i, uri: '', module: src }); }}>
        <Image source={src} style={{ width: 72, height: 72, borderRadius: 8, marginRight: 8, borderWidth: selectedThumb === i ? 2 : 0, borderColor: theme.primary }} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => setWallpaper(null)} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: theme.primary }}>Clear</Text>
          </TouchableOpacity>
      <TouchableOpacity onPress={async () => {
            const picked = await pickDeviceWallpaper();
            if (!picked) return;
            setSelectedThumb(null);
            setWallpaper(picked);
          }} style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
            <Text style={{ color: theme.primary }}>Pick from device</Text>
          </TouchableOpacity>
          {wallpaper && wallpaper.uri ? (
            <>
              <TouchableOpacity onPress={() => setCropModalOpen(true)} style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
                <Text style={{ color: theme.primary }}>Crop</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={async () => {
                // re-edit existing device wallpaper (re-pick)
                try {
                  const edited = await editDeviceWallpaper?.();
                  if (edited) setWallpaper(edited);
                } catch (_e) { /* ignore */ }
              }} style={{ justifyContent: 'center', alignItems: 'center', marginLeft: 8 }}>
                <Text style={{ color: theme.primary }}>Replace</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: theme.textLight }}>Opacity: {Math.round((localOpacity ?? 0.5) * 100)}%</Text>
          <Slider value={localOpacity} onChange={(v) => { setLocalOpacity(v); setWallpaperSettings({ opacity: v, brightness: localBrightness }); }} />
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: theme.textLight }}>Brightness: {Math.round((localBrightness || 1) * 100)}%</Text>
          <Slider value={localBrightness} min={0.3} max={1.4} onChange={(v) => { setLocalBrightness(v); setWallpaperSettings({ opacity: localOpacity, brightness: v }); }} />
        </View>
      </View>
    </ScrollView>

    <Modal visible={cropModalOpen} transparent animationType="slide" onRequestClose={() => setCropModalOpen(false)}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#00000088' }}>
        <View style={{ width: '88%', backgroundColor: theme.card, borderRadius: 12, padding: 16 }}>
          <Text style={{ color: theme.text, fontWeight: '700', marginBottom: 8 }}>Crop wallpaper</Text>
          <Text style={{ color: theme.textLight, marginBottom: 12 }}>Choose an aspect ratio to crop the current wallpaper.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={async () => {
              if (!wallpaper?.uri) return;
              setCropBusy(true);
              const res = await cropDeviceWallpaper?.(wallpaper.uri, 'square');
              setCropBusy(false);
              if (res) setWallpaper(res);
              setCropModalOpen(false);
            }} style={{ padding: 10, backgroundColor: theme.primary, borderRadius: 8 }}>
              <Text style={{ color: theme.white }}>{cropBusy ? 'Working...' : 'Square'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={async () => {
              if (!wallpaper?.uri) return;
              setCropBusy(true);
              const res = await cropDeviceWallpaper?.(wallpaper.uri, '16:9');
              setCropBusy(false);
              if (res) setWallpaper(res);
              setCropModalOpen(false);
            }} style={{ padding: 10, backgroundColor: theme.primary, borderRadius: 8 }}>
              <Text style={{ color: theme.white }}>{cropBusy ? 'Working...' : '16:9'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCropModalOpen(false)} style={{ padding: 10, backgroundColor: theme.card, borderRadius: 8, borderWidth: 1, borderColor: '#00000008' }}>
              <Text style={{ color: theme.text }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  );
}

// Simple slider component implemented with PanResponder and Animated to avoid extra deps
function Slider({ value = 0.5, onChange = () => {}, min = 0, max = 1 }) {
  const pan = useRef(new Animated.Value(0)).current;
  const width = 240;
  // slider normalized value derived from `value` when needed inside effect

  useEffect(() => {
    const normalizedLocal = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
    const initialLocal = normalizedLocal * width;
    pan.setValue(initialLocal);
  }, [value, min, max, pan, width]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(pan._value || 0);
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(width, Math.max(0, (pan._offset || 0) + gesture.dx));
        pan.setValue(next - (pan._offset || 0));
        const norm = next / width;
        const v = min + norm * (max - min);
        onChange(Number(v.toFixed(2)));
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      }
    })
  ).current;

  const left = pan.interpolate({ inputRange: [0, width], outputRange: [0, width], extrapolate: 'clamp' });
  return (
    <View style={{ width, height: 36, justifyContent: 'center' }}>
      <View style={{ height: 6, backgroundColor: '#ddd', borderRadius: 3 }} />
      <Animated.View
        {...responder.panHandlers}
        style={{ position: 'absolute', left: left, top: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#666' }} />
      </Animated.View>
    </View>
  );
}

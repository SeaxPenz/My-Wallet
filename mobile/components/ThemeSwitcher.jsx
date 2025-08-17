import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, THEME_LIST } from '../context/ThemeContext';

export const themes = THEME_LIST; // keep compatibility export

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const items = Object.values(THEME_LIST);

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => setOpen((s) => !s)}
        style={{ padding: 8, borderRadius: 10, backgroundColor: theme.card }}
      >
        <MaterialCommunityIcons name={theme.id === 'dark' ? 'weather-night' : 'white-balance-sunny'} size={20} color={theme.text} />
      </TouchableOpacity>

      {open && (
        <Animated.View style={{ marginTop: 8, backgroundColor: theme.card, padding: 8, borderRadius: 12, elevation: 6 }}>
          {items.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: t.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name={t.id === 'dark' ? 'moon' : t.id === 'forest' ? 'leaf' : t.id === 'purple' ? 'color-palette' : 'sunny'} size={18} color={'#fff'} />
              </View>
              <Text style={{ color: theme.text }}>{t.name}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}
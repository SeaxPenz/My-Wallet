import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';
import CurrencySwitcher from '../components/CurrencySwitcher';
import { useCurrency } from '../context/CurrencyContext';

export default function SettingsPage() {
  const { theme } = useTheme();
  const { currency } = useCurrency();

  return (
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
    </ScrollView>
  );
}

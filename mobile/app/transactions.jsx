import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TransactionsPage() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Transactions</Text>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>This page will list all transactions. Use the home screen recent transactions for now.</Text>
      </View>
    </View>
  );
}

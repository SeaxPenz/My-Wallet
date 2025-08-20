import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTransactions } from '../hooks/useTransactions';
import { useSafeUser as useUser } from '../hooks/useSafeUser';

export default function ReportsPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { summary, loadData } = useTransactions(user?.id);
  const safeSummary = summary || { balance: 0, income: 0, expenses: 0 };

  // simple weekly/monthly grouping will be implemented here; for now show summary
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      {/* SafeScreen provides the header back arrow; show page title only */}
      <Text style={{ color: theme.text, fontSize: 20, fontWeight: '700' }}>Reports</Text>

  <View style={{ marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ color: theme.textLight }}>Summary</Text>
              <Text style={{ color: theme.text }}>Balance: {safeSummary.balance}</Text>
              <Text style={{ color: theme.income || '#2ECC71' }}>Income: {safeSummary.income}</Text>
              <Text style={{ color: theme.expense || '#E74C3C' }}>Expenses: {safeSummary.expenses}</Text>
            </View>
            <TouchableOpacity onPress={() => loadData()} style={{ padding: 8 }}>
              <Ionicons name="refresh" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>
  </View>

      <View style={{ marginTop: 18 }}>
        <Text style={{ color: theme.textLight }}>Weekly & Monthly reports coming soon.</Text>
      </View>
    </ScrollView>
  );
}

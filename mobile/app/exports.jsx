import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useTransactions from '../hooks/useTransactions';
import { useSafeUser as useUser } from '../hooks/useSafeUser';

export default function ExportsPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { transactions, summary, loadData } = useTransactions(user?.id);

  const handleExportCsv = async () => {
    Alert.alert('Export', 'CSV export started (stub).');
  };
  const handleExportPdf = async () => {
    Alert.alert('Export', 'PDF export started (stub).');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ color: theme.headerText || theme.text, fontSize: 20, fontWeight: '700' }}>Exports</Text>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Export your transactions to CSV or PDF.</Text>
        <TouchableOpacity onPress={handleExportCsv} style={{ marginTop: 12, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.white }}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExportPdf} style={{ marginTop: 12, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.white }}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

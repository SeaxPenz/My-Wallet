import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useTransactions from '../hooks/useTransactions';
import { useSafeUser as useUser } from '../hooks/useSafeUser';
import { TransactionItem } from '../components/TransactionItem';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export default function TransactionsPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { transactions, loadData, isLoading } = useTransactions(user?.id);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('date_desc');

  const filtered = useMemo(() => {
    let list = (transactions || []).slice();
    if (q) list = list.filter(t => (t.title || '').toLowerCase().includes(q.toLowerCase()) || (t.category || '').toLowerCase().includes(q.toLowerCase()));
    if (typeFilter === 'income') list = list.filter(t => Number(t.amount) >= 0);
    if (typeFilter === 'expenses') list = list.filter(t => Number(t.amount) < 0);
    if (sort === 'date_desc') list.sort((a,b) => new Date(b.date||b.created_at||0) - new Date(a.date||a.created_at||0));
    if (sort === 'date_asc') list.sort((a,b) => new Date(a.date||a.created_at||0) - new Date(b.date||b.created_at||0));
    if (sort === 'amount_desc') list.sort((a,b) => b.amount - a.amount);
    if (sort === 'amount_asc') list.sort((a,b) => a.amount - b.amount);
    return list;
  }, [q, transactions, typeFilter, sort]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ color: theme.headerText || theme.text, fontSize: 20, fontWeight: '700' }}>Transactions</Text>
      <View style={{ marginTop: 12 }}>
        <TextInput placeholder="Search by title or category" placeholderTextColor={theme.textLight} value={q} onChangeText={setQ} style={{ backgroundColor: theme.card, padding: 10, borderRadius: 8, color: theme.text }} />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setTypeFilter('all')} style={{ padding: 8, backgroundColor: typeFilter === 'all' ? theme.primary : theme.card, borderRadius: 8, marginRight: 8 }}><Text style={{ color: typeFilter === 'all' ? theme.white : theme.text }}>All</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTypeFilter('income')} style={{ padding: 8, backgroundColor: typeFilter === 'income' ? theme.primary : theme.card, borderRadius: 8, marginRight: 8 }}><Text style={{ color: typeFilter === 'income' ? theme.white : theme.text }}>Income</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setTypeFilter('expenses')} style={{ padding: 8, backgroundColor: typeFilter === 'expenses' ? theme.primary : theme.card, borderRadius: 8 }}><Text style={{ color: typeFilter === 'expenses' ? theme.white : theme.text }}>Expenses</Text></TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => setSort('date_desc')} style={{ padding: 8, backgroundColor: sort === 'date_desc' ? theme.primary : theme.card, borderRadius: 8, marginRight: 8 }}><Text style={{ color: sort === 'date_desc' ? theme.white : theme.text }}>Newest</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSort('amount_desc')} style={{ padding: 8, backgroundColor: sort === 'amount_desc' ? theme.primary : theme.card, borderRadius: 8 }}><Text style={{ color: sort === 'amount_desc' ? theme.white : theme.text }}>Biggest</Text></TouchableOpacity>
        </View>
      </View>

      <FlatList data={filtered} keyExtractor={(i) => String(i.id)} renderItem={({ item }) => <TransactionItem item={item} />} style={{ marginTop: 12 }} onRefresh={loadData} refreshing={isLoading} />

      <View style={{ marginTop: 12, flexDirection: 'row' }}>
        <TouchableOpacity onPress={async () => {
          try {
            const rows = [['date','title','category','amount']];
            for (const t of filtered) {
              const d = new Date(t.date || t.created_at || Date.now());
              rows.push([d.toISOString(), (t.title||''), (t.category||''), String(t.amount || 0)]);
            }
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""') }"`).join(',')).join('\n');
            const path = `${FileSystem.cacheDirectory}transactions-export-${Date.now()}.csv`;
            await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: 'text/csv' });
            else Alert.alert('Export saved', 'CSV saved to: ' + path);
          } catch (err) { console.warn('Export failed', err); Alert.alert('Export failed', String(err?.message || err)); }
        }} style={{ padding: 12, backgroundColor: theme.primary, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: theme.white }}>Export CSV</Text>
  </TouchableOpacity>
  <TouchableOpacity onPress={async () => {
          try {
            const html = `<h1>Transactions Export</h1><ul>${filtered.map(t => `<li>${new Date(t.date||t.created_at||0).toLocaleDateString()} - ${t.title} - ${t.category} - ${t.amount}</li>`).join('')}</ul>`;
            const { uri } = await Print.printToFileAsync({ html });
            if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
            else Alert.alert('PDF saved', uri);
          } catch (err) { console.warn('PDF export failed', err); Alert.alert('Export failed', String(err?.message || err)); }
        }} style={{ padding: 12, backgroundColor: theme.card, borderRadius: 8, alignItems: 'center', marginLeft: 8 }}>
          <Text style={{ color: theme.text }}>Export PDF</Text>
  </TouchableOpacity>
      </View>
    </View>
  );
}

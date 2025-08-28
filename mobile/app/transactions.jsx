import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, Pressable, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import useTransactions from '../hooks/useTransactions';
import { useSafeUser as useUser } from '../hooks/useSafeUser';
import { TransactionItem } from '../components/TransactionItem';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';

export default function TransactionsPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  React.useEffect(() => {
    try {
      console.debug('[client] TransactionsPage mounted user.id ->', user?.id);
    } catch (e) {
      // ignore
    }
  }, [user]);
  const { transactions, loadData, isLoading, error, retry } = useTransactions(user?.id);
  const { visible: showBalance } = useBalanceVisibility();
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.headerText || theme.text, fontSize: 20, fontWeight: '700' }}>Transactions</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Eye toggle to control global balance visibility */}
          <BalanceToggle />
          <TouchableOpacity onPress={() => router.push('/create')} style={{ marginLeft: 8, padding: 8, backgroundColor: theme.primary, borderRadius: 8 }}>
            <Text style={{ color: theme.white }}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error banner when fetch fails */}
      {error ? (
        <View style={{ marginTop: 12, padding: 10, backgroundColor: '#ffdddd', borderRadius: 8 }}>
          <Text style={{ color: '#800000', fontWeight: '600' }}>Failed to load transactions</Text>
          <Text style={{ color: '#800000', marginTop: 6 }}>{String(error?.message || error)}</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <Pressable onPress={() => retry()} style={{ padding: 8, backgroundColor: theme.primary, borderRadius: 8 }}>
              <Text style={{ color: theme.white }}>Retry</Text>
            </Pressable>
            <Pressable onPress={() => loadData()} style={{ padding: 8, marginLeft: 8, backgroundColor: theme.card, borderRadius: 8 }}>
              <Text style={{ color: theme.text }}>Reload</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <View style={{ marginTop: 12 }}>
        <TextInput placeholder="Search by title or category" placeholderTextColor={theme.textLight} value={q} onChangeText={setQ} style={{ backgroundColor: theme.card, padding: 10, borderRadius: 8, color: theme.text }} />
      </View>

      <View style={{ flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={() => setTypeFilter('all')} style={({ hovered }) => [{ padding: 8, backgroundColor: typeFilter === 'all' ? theme.primary : theme.card, borderRadius: 8, marginRight: 8 }, hovered && { opacity: 0.9 }]}><Text style={{ color: typeFilter === 'all' ? theme.white : theme.text }}>All</Text></Pressable>
          <Pressable onPress={() => setTypeFilter('income')} style={({ hovered }) => [{ padding: 8, backgroundColor: typeFilter === 'income' ? theme.primary : theme.card, borderRadius: 8, marginRight: 8 }, hovered && { opacity: 0.9 }]}><Text style={{ color: typeFilter === 'income' ? theme.white : theme.text }}>Income</Text></Pressable>
          <Pressable onPress={() => setTypeFilter('expenses')} style={({ hovered }) => [{ padding: 8, backgroundColor: typeFilter === 'expenses' ? theme.primary : theme.card, borderRadius: 8 }, hovered && { opacity: 0.9 }]}><Text style={{ color: typeFilter === 'expenses' ? theme.white : theme.text }}>Expenses</Text></Pressable>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Pressable onPress={() => setSort('date_desc')} style={({ hovered }) => [{ padding: 8, backgroundColor: sort === 'date_desc' ? theme.primary : theme.card, borderRadius: 8, marginRight: 8 }, hovered && { opacity: 0.9 }]}><Text style={{ color: sort === 'date_desc' ? theme.white : theme.text }}>Newest</Text></Pressable>
          <Pressable onPress={() => setSort('amount_desc')} style={({ hovered }) => [{ padding: 8, backgroundColor: sort === 'amount_desc' ? theme.primary : theme.card, borderRadius: 8 }, hovered && { opacity: 0.9 }]}><Text style={{ color: sort === 'amount_desc' ? theme.white : theme.text }}>Biggest</Text></Pressable>
        </View>
      </View>

      <FlatList data={filtered} keyExtractor={(i) => String(i.id)} renderItem={({ item }) => <TransactionItem item={item} />} style={{ marginTop: 12 }} onRefresh={loadData} refreshing={isLoading} />

      {/* Empty state when there are no transactions and no error */}
      {!isLoading && (!transactions || transactions.length === 0) && !error ? (
        <View style={{ marginTop: 16, padding: 12, backgroundColor: theme.card, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: theme.text, marginBottom: 8 }}>No transactions yet.</Text>
          <Pressable onPress={() => loadData()} style={{ padding: 8, backgroundColor: theme.primary, borderRadius: 8 }}>
            <Text style={{ color: theme.white }}>Refresh</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ marginTop: 12, flexDirection: 'row' }}>
        <TouchableOpacity onPress={async () => {
          try {
            const rows = [['date','title','category','amount']];
            for (const t of filtered) {
              const d = new Date(t.date || t.created_at || Date.now());
              rows.push([d.toISOString(), (t.title||''), (t.category||''), showBalance ? String(t.amount || 0) : '']);
            }
            const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""') }"`).join(',')).join('\n');

            // Web fallback: create blob + anchor download
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `transactions-export-${Date.now()}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              URL.revokeObjectURL(url);
              return;
            }

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
            // Build a clean HTML table without UI chrome (no delete buttons, safe screen parts)
            const rowsHtml = filtered.map(t => {
              const d = new Date(t.date||t.created_at||0);
              return `<tr><td>${d.toLocaleDateString()}</td><td>${(t.title||'')}</td><td>${(t.category||'')}</td><td>${showBalance ? t.amount : '•••'}</td></tr>`;
            }).join('');
            const html = `<html><body><h1>Transactions</h1><table border="1" cellpadding="6" cellspacing="0"><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th></tr>${rowsHtml}</table></body></html>`;
            const printed = await Print.printToFileAsync({ html });
            const uri = printed && printed.uri;
            if (!uri) throw new Error('PDF generation failed');
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

function BalanceToggle() {
  const { visible, setVisible } = useBalanceVisibility();
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={() => setVisible(!visible)} style={{ padding: 8, borderRadius: 8, backgroundColor: theme.card }}>
      <Text style={{ color: theme.text }}>{visible ? 'Hide' : 'Show'}</Text>
    </TouchableOpacity>
  );
}

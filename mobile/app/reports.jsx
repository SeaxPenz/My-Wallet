import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import useTransactions from '../hooks/useTransactions';
import { useSafeUser as useUser } from '../hooks/useSafeUser';
import { useCurrency } from '../context/CurrencyContext';
import { formatCurrency } from '../lib/utils';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { Svg, Polyline } from 'react-native-svg';

export default function ReportsPage() {
  const { theme } = useTheme();
  const { user } = useUser();
  const { summary, transactions, loadData } = useTransactions(user?.id);
  const { currency, convert } = useCurrency();
  const safeSummary = summary || { balance: 0, income: 0, expenses: 0 };
  const { visible: showBalance } = useBalanceVisibility();
  const [sort, setSort] = useState('date_desc');

  const sorted = useMemo(() => {
    const list = (transactions || []).slice();
    if (sort === 'date_desc') return list.sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0));
    if (sort === 'date_asc') return list.sort((a, b) => new Date(a.date || a.created_at || 0) - new Date(b.date || b.created_at || 0));
    if (sort === 'amount_desc') return list.sort((a, b) => b.amount - a.amount);
    if (sort === 'amount_asc') return list.sort((a, b) => a.amount - b.amount);
    return list;
  }, [transactions, sort]);

  const exportCsv = async () => {
    const rows = [['date','title','category','amount']];
    for (const t of sorted) {
      const d = new Date(t.date || t.created_at || Date.now());
  rows.push([d.toISOString(), (t.title||''), (t.category||''), showBalance ? String(t.amount || 0) : 'MASKED']);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""') }"`).join(',')).join('\n');
    try {
      // Web fallback
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reports-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
      const path = `${FileSystem.cacheDirectory}reports-export-${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, { mimeType: 'text/csv', dialogTitle: 'Export Transactions CSV' });
      } else {
        console.debug('[Reports] CSV export saved to', path);
        Alert.alert('Export saved', 'CSV saved to app cache. Check Metro log for path.');
      }
    } catch (err) {
      console.warn('CSV export failed', err);
      Alert.alert('Export failed', String(err?.message || err));
    }
  };

  const exportPdf = async () => {
    try {
      const rowsHtml = sorted.map(t => {
        const d = new Date(t.date || t.created_at || 0);
        return `<tr><td>${d.toLocaleDateString()}</td><td>${(t.title||'')}</td><td>${(t.category||'')}</td><td>${showBalance ? t.amount : 'MASKED'}</td></tr>`;
      }).join('');
      const html = `<html><body><h1>Reports</h1><p>Balance: ${showBalance ? formatCurrency(convert(safeSummary.balance), currency) : '•••'}</p><table border="1" cellpadding="4" cellspacing="0"><tr><th>Date</th><th>Title</th><th>Category</th><th>Amount</th></tr>${rowsHtml}</table></body></html>`;
      const printed = await Print.printToFileAsync({ html });
      const uri = printed && printed.uri;
      if (!uri) throw new Error('PDF generation failed');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
      } else {
        Alert.alert('PDF saved', 'PDF generated and saved to: ' + uri);
      }
    } catch (err) {
      console.warn('PDF export failed', err);
      Alert.alert('PDF export failed', String(err?.message || err));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.headerText || theme.text, fontSize: 20, fontWeight: '700' }}>Reports</Text>
        <BalanceToggle />
      </View>

      <View style={{ marginTop: 12, backgroundColor: theme.card, padding: 12, borderRadius: 10 }}>
        <Text style={{ color: theme.textLight }}>Summary</Text>
  <Text style={{ color: theme.text, marginTop: 6 }}>Balance: {showBalance ? formatCurrency(convert(safeSummary.balance), currency) : '•••'}</Text>
  <Text style={{ color: theme.income || '#2ECC71' }}>Income: {showBalance ? formatCurrency(convert(safeSummary.income), currency) : '•••'}</Text>
  <Text style={{ color: theme.expense || '#E74C3C' }}>Expenses: {showBalance ? formatCurrency(convert(safeSummary.expenses), currency) : '•••'}</Text>
        <TouchableOpacity onPress={() => loadData()} style={{ position: 'absolute', right: 8, top: 8, padding: 6 }}>
          <Ionicons name="refresh" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: theme.textLight }}>Monthly Breakdown</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={() => setSort('date_desc')} style={{ padding: 6, marginRight: 8 }}><Text style={{ color: theme.text }}>Newest</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setSort('amount_desc')} style={{ padding: 6, marginRight: 8 }}><Text style={{ color: theme.text }}>Biggest</Text></TouchableOpacity>
            <TouchableOpacity onPress={exportCsv} style={{ padding: 6, marginRight: 8 }}><Text style={{ color: theme.primary }}>Export CSV</Text></TouchableOpacity>
            <TouchableOpacity onPress={exportPdf} style={{ padding: 6 }}><Text style={{ color: theme.primary }}>Export PDF</Text></TouchableOpacity>
          </View>
        </View>

        {(sorted || []).map((t) => {
          const d = new Date(t.date || t.created_at || Date.now());
          const dateStr = isNaN(d.getTime()) ? 'Unknown date' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
          return (
            <View key={t.id} style={{ paddingVertical: 6 }}>
              <Text style={{ color: theme.text }}>{dateStr} — {t.title} — {formatCurrency(convert(t.amount), currency)}</Text>
            </View>
          );
        })}
        <View style={{ marginTop: 12, height: 80 }}>
          <Svg width="100%" height="80" viewBox="0 0 100 80">
            {(() => {
              const arr = (sorted || []).slice(-30);
              if (arr.length === 0) return null;
              const amounts = arr.map(x => Number(x.amount || 0));
              const min = Math.min(...amounts, 0);
              const max = Math.max(...amounts, 1);
              const points = arr.map((t, i) => {
                const v = Number(t.amount || 0);
                const x = (i / Math.max(1, arr.length - 1)) * 100;
                const y = 80 - ((v - min) / (max - min || 1)) * 70 - 5;
                return `${x},${y}`;
              }).join(' ');
              return <Polyline points={points} fill="none" stroke={theme.primary} strokeWidth="2" />;
            })()}
          </Svg>
        </View>
      </View>
    </ScrollView>
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

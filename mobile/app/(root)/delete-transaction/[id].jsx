import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useSafeUser } from '../../../hooks/useSafeUser';
import useTransactions from '../../../hooks/useTransactions';

export default function DeleteTransactionPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, debug } = params;
  const { user } = useSafeUser() || {};
  const { deleteTransaction } = useTransactions(user?.id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !user) {
      Alert.alert('Error', 'Missing transaction id or user');
      router.back();
      return;
    }

    // Keep dev debug behavior available but don't auto-trigger deletion on mount
    if (debug === '1') {
      // throwing here helps Metro symbolication when the page is visited intentionally
      throw new Error('dev-instrumentation: delete page visited (debug=1)');
    }
  // router and user references are stable here; we intentionally run this effect on id change only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleCancel = () => router.back();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTransaction(id);
      Alert.alert('Deleted', 'Transaction deleted successfully');
      router.replace('/');
    } catch (err) {
      Alert.alert('Delete failed', err?.message || 'Unable to delete transaction');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: theme.background }}>
      <Text style={{ color: theme.text, fontSize: 18, marginBottom: 12 }}>Delete transaction?</Text>
      <Text style={{ color: theme.textLight, marginBottom: 18, textAlign: 'center' }}>This action cannot be undone. Are you sure you want to delete this transaction?</Text>
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity onPress={handleCancel} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#EEE', marginRight: 12 }}>
          <Text>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} style={{ paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: theme.primary }} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff' }}>Delete</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

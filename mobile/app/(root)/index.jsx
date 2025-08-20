import { useSafeUser as useUser } from "../../hooks/useSafeUser";
import { useRouter } from "expo-router";
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View, Image } from "react-native";
import { useTransactions } from "../../hooks/useTransactions";
import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import DateTime from '../../components/DateTime';
import * as SecureStore from '../../lib/secureStore';
import PageLoader from "../../components/PageLoader";
import { createHomeStyles } from "../../assets/styles/home.styles";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from "../../context/CurrencyContext";
import { Ionicons } from "@expo/vector-icons";
import { BalanceCard } from "../../components/BalanceCard";
import Svg, { G, Circle } from 'react-native-svg';
import { TransactionItem } from "../../components/TransactionItem";
import NoTransactionsFound from "../../components/NoTransactionsFound";


export default function Page() {
  const { theme } = useTheme();
  const styles = createHomeStyles(theme);
  const { refreshRates } = useCurrency();
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);

  const { transactions, summary, isLoading, loadData, deleteTransaction } = useTransactions(
    user?.id
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // refresh exchange rates first, then reload transactions
      await refreshRates();
      await loadData();
    } catch (_err) {
      console.error('Error loading profile:', _err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload stored profile whenever this screen is focused (so changes from
  // the Profile editor appear immediately after navigation back)
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const stored = await SecureStore.getItemAsync('user.profile');
          if (stored && mounted) setProfile(JSON.parse(stored));
        } catch (_err) {
          /* ignore */
        }
      })();

      // refresh transactions/summary when screen gains focus
      (async () => {
        try {
          await loadData();
        } catch (_err) {
          // ignore
        }
      })();

      return () => {
        mounted = false;
      };
  }, [loadData])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Transaction", "Are you sure you want to delete this transaction?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await deleteTransaction(id);
        } catch (err) {
          console.warn('Failed to delete transaction', err);
          Alert.alert('Delete failed', 'Unable to delete transaction. Please try again.');
        }
      } },
    ]);
  };

  if (isLoading && !refreshing) return <PageLoader />;

  // Render header and summary as the FlatList header so the entire screen scrolls

  const ListHeader = () => (
    <View style={styles.content}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.welcomeContainer}>
            {profile?.imageUri ? (
             <TouchableOpacity onPress={() => router.push('/profile')}>
               <Image source={{ uri: profile.imageUri }} style={styles.headerAvatar} />
             </TouchableOpacity>
            ) : null}
            <View>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.usernameText}>{profile?.name?.split(' ')[0] || (user ? user.firstName || user.fullName || user?.primaryEmailAddress?.emailAddress?.split("@")[0] : '')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <DateTime syncApi={true} />
          <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}> 
            <Ionicons name="add" size={20} color={theme.white} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

  <BalanceCard summary={summary} onRefresh={refreshRates} />

      {/* lightweight pie: income vs expenses */}
      <View style={{ alignItems: 'center', marginTop: 12 }}>
        {summary && (
          <PieChartInline income={summary.income} expenses={summary.expenses} />
        )}
      </View>

      <View style={styles.transactionsHeaderContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={styles.transactionsList}
      contentContainerStyle={styles.transactionsListContent}
      data={transactions}
      renderItem={({ item }) => <TransactionItem item={item} onDelete={handleDelete} />}
      ListEmptyComponent={<NoTransactionsFound />}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={<ListHeader />}
    />
  );
}

function PieChartInline({ income = 0, expenses = 0 }) {
  const total = Math.max(1, Math.abs(income) + Math.abs(expenses));
  const incomePct = Math.max(0, Math.abs(income) / total);
  const expensesPct = Math.max(0, Math.abs(expenses) / total);

  const size = 120;
  const strokeWidth = 40;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const incomeArc = circumference * incomePct;
  const expensesArc = circumference * expensesPct;

  return (
    <Svg width={size} height={size}>
      <G rotation={-90} originX={size / 2} originY={size / 2}>
        {/* background */}
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#EEE" strokeWidth={strokeWidth} fill="transparent" />
        {/* income slice */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#2ECC71"
          strokeWidth={strokeWidth}
          strokeDasharray={`${incomeArc} ${circumference - incomeArc}`}
          strokeLinecap="round"
          fill="transparent"
        />
        {/* expenses slice */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E74C3C"
          strokeWidth={strokeWidth}
          strokeDasharray={`${expensesArc} ${circumference - expensesArc}`}
          strokeLinecap="round"
          fill="transparent"
          rotation={(incomePct * 360)}
          originX={size / 2}
          originY={size / 2}
        />
      </G>
    </Svg>
  );
}
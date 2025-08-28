import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter } from "expo-router";
import { useSafeUser as useUser } from "../../hooks/useSafeUser";
import useTransactions from '../../hooks/useTransactions';
import { useState } from "react";
import { API_URL } from "../../constants/api";
import { createCreateStyles } from "../../assets/styles/create.styles";
import { useTheme } from "../../context/ThemeContext";
import { useCurrency } from '../../context/CurrencyContext';
import CurrencySwitcher from '../../components/CurrencySwitcher';
import { Ionicons } from "@expo/vector-icons";

const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food" },
  { id: "shopping", name: "Shopping", icon: "cart" },
  { id: "transportation", name: "Transportation", icon: "car" },
  { id: "entertainment", name: "Entertainment", icon: "film" },
  { id: "bills", name: "Bills", icon: "receipt" },
  { id: "income", name: "Income", icon: "cash" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal" },
];

const CreateScreen = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createCreateStyles(theme);
  const { toBase } = useCurrency();
  const { user } = useUser();
  const { transactions, createTransaction, classifyTransaction } = useTransactions(user?.id || null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    // validations
    if (!title.trim()) return Alert.alert("Error", "Please enter a transaction title");
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (!selectedCategory) return Alert.alert("Error", "Please select a category");

    setIsLoading(true);
    try {
  // debug: log user id and API endpoint so we can trace created transactions
  console.log('[DEBUG] CreateScreen user.id ->', user?.id);
  console.log('[DEBUG] CreateScreen API_URL ->', API_URL);
      // Format the amount (negative for expenses, positive for income)
      const parsed = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(parsed) || parsed === 0) {
        throw new Error('Please enter a valid non-zero amount');
      }

      const formattedAmountLocal = isExpense ? -Math.abs(parsed) : Math.abs(parsed);

      // convert the user-entered amount (in selected currency) back to base (USD) for storage
      const formattedAmount = Number(toBase(formattedAmountLocal).toFixed(2));

      // resolve user id (fall back to dev id in non-production to ease local testing)
      const resolvedUserId = user?.id || (process.env.NODE_ENV !== 'production' ? (process.env.EXPO_DEV_USER_ID || 'dev-user-1') : null);
      if (!resolvedUserId) {
        Alert.alert('Error', 'No authenticated user found. Please sign in.');
        setIsLoading(false);
        return;
      }

      // include user email for backend validation (some backends expect email)
      const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

      // compute a small anomaly/good note + classification for UX before confirming save
      const generatedNote = (() => {
        try {
          if (!transactions || transactions.length === 0) return null;
          const same = transactions.filter(t => String(t.category || '').toLowerCase() === String(selectedCategory || '').toLowerCase()).map(t => Number(t.amount || 0));
          if (same.length < 3) return null;
          const mean = same.reduce((s,v)=>s+v,0)/same.length;
          const variance = same.reduce((s,v)=>s+Math.pow(v-mean,2),0)/same.length;
          const std = Math.sqrt(variance);
          const amt = formattedAmount;
          if (std === 0) return null;
          const z = (amt - mean) / std;
          if (Math.abs(z) >= 2) {
            if (amt < mean) return `Unusually low for ${selectedCategory}`;
            return `Unusually high for ${selectedCategory}`;
          }
          if (!isExpense && (amt - mean) / (std||1) > 1.5) return `Good income — higher than usual in ${selectedCategory}`;
          return null;
        } catch (e) {
          return null;
        }
      })();

      // classification using the hook helper (works even with small history)
      let classification = { label: 'normal', note: null };
      try {
        if (classifyTransaction) classification = classifyTransaction(formattedAmount, selectedCategory || '');
      } catch (e) {
        classification = { label: 'unknown', note: null };
      }

      // Ask the user to confirm save, showing the classification/note.
      const messageParts = [];
      if (generatedNote) messageParts.push(generatedNote);
      if (classification && classification.note) messageParts.push(classification.note);
      const message = messageParts.length ? messageParts.join('\n') : 'Save this transaction?';

      // In development, skip the confirmation dialog to make it easy to test
      // whether the client can reach the backend. In production we still show
      // the confirmation modal.
      if (process.env.NODE_ENV !== 'production') {
        setIsLoading(true);
        try {
          const payload = {
            user_id: resolvedUserId,
            email,
            title,
            amount: formattedAmount,
            category: selectedCategory,
            note: generatedNote || classification.note || '',
            created_at: createdAt,
          };
          await createTransaction(payload);
          Alert.alert('Success', generatedNote ? `Transaction created. ${generatedNote}` : 'Transaction created successfully');
          router.push('/');
        } catch (err) {
          console.error('Create error', err);
          Alert.alert('Error', err?.message || 'Failed to create transaction');
        } finally {
          setIsLoading(false);
        }
      } else {
        Alert.alert(
          'Confirm transaction',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Confirm',
              onPress: async () => {
                setIsLoading(true);
                try {
                  const payload = {
                    user_id: resolvedUserId,
                    email,
                    title,
                    amount: formattedAmount,
                    category: selectedCategory,
                    note: generatedNote || classification.note || '',
                    created_at: createdAt,
                  };
                  await createTransaction(payload);
                  Alert.alert('Success', generatedNote ? `Transaction created. ${generatedNote}` : 'Transaction created successfully');
                  router.push('/');
                } catch (err) {
                  console.error('Create error', err);
                  Alert.alert('Error', err?.message || 'Failed to create transaction');
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ],
          { cancelable: true }
        );
      }
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to create transaction");
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      enableOnAndroid
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}
      <View style={styles.header}>
        {/* Left spacer kept so title is centered when SafeScreen renders the back arrow */}
        <View style={{ width: 48 }} />
        <Text style={styles.headerTitle}>New Transaction</Text>
        {/* Right spacer to match left */}
        <View style={{ width: 48 }} />
      </View>

      <View style={styles.card}>
    <View style={styles.typeSelector}>
          {/* EXPENSE SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(true)}
          >
            <Ionicons
              name="arrow-down-circle"
              size={22}
              color={isExpense ? theme.white : theme.expense}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>

          {/* INCOME SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(false)}
          >
            <Ionicons
              name="arrow-up-circle"
              size={22}
              color={!isExpense ? theme.white : theme.income}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        {/* AMOUNT CONTAINER */}
        <View style={styles.amountContainer}>
          <CurrencySwitcher compact />
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={theme.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* DATE/TIME PICKER (simple) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 }}>
          <Text style={{ color: theme.textLight, fontSize: 14 }}>Date</Text>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={createdAt}
            placeholder="YYYY-MM-DDTHH:MM:SS.sssZ"
            onChangeText={setCreatedAt}
          />
          <TouchableOpacity onPress={() => setCreatedAt(new Date().toISOString())} style={{ padding: 8 }}>
            <Text style={{ color: theme.primary }}>Now</Text>
          </TouchableOpacity>
        </View>

        {/* INPUT CONTAINER */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="create-outline"
            size={22}
            color={theme.textLight}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Transaction Title"
            placeholderTextColor={theme.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* TITLE */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="pricetag-outline" size={16} color={theme.text} /> Category
        </Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.name && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selectedCategory === category.name ? theme.white : theme.text}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.name && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
  {/* sticky footer */}
  <View style={[styles.footer, { pointerEvents: isLoading ? 'none' : 'auto' }]}>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={isLoading}
          style={[
            { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
            isLoading && { opacity: 0.6 }
          ]}
        >
          <Text style={{ color: theme.white, fontWeight: '700', marginRight: 8 }}>{isLoading ? 'Saving...' : 'Save Transaction'}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={theme.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
};
export default CreateScreen;
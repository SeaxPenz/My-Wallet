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
      // Format the amount (negative for expenses, positive for income)
      const parsed = parseFloat(amount.replace(/,/g, ''));
      if (isNaN(parsed) || parsed === 0) {
        throw new Error('Please enter a valid non-zero amount');
      }

      const formattedAmountLocal = isExpense ? -Math.abs(parsed) : Math.abs(parsed);

      // convert the user-entered amount (in selected currency) back to base (USD) for storage
      const formattedAmount = Number(toBase(formattedAmountLocal).toFixed(2));

      // include user email for backend validation (some backends expect email)
      const email = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || '';

    const response = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          email,
          title,
          amount: formattedAmount,
          category: selectedCategory,
      created_at: createdAt,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Create failed:', response.status, text);
        // try to parse JSON error body, fallback to raw text
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.error || JSON.stringify(errorData));
        } catch (_parseErr) {
          throw new Error(text || `HTTP ${response.status}`);
        }
      }

      const createdText = await response.text();
      let created = null;
      try {
        created = JSON.parse(createdText);
        console.log('Created transaction:', created);
      } catch (_err) {
        console.warn('Created response was not JSON:', createdText);
      }
  Alert.alert("Success", "Transaction created successfully");
  // Ensure we go to home and trigger its focus effect which reloads data
  router.replace('/');
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
      <View style={styles.footer} pointerEvents={isLoading ? 'none' : 'auto'}>
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
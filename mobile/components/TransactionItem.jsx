import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrency } from "../lib/utils";
import { useRouter } from 'expo-router';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';

const CATEGORY_ICON_MAP = {
	'food': 'fast-food',
	'food & drinks': 'fast-food',
	'groceries': 'cart',
	'shopping': 'cart',
	'salary': 'wallet',
	'income': 'cash',
	'rent': 'home',
	'transportation': 'car',
	'phone': 'call',
	'bills': 'receipt',
	'utilities': 'flash',
	'entertainment': 'film',
	'freelance': 'laptop',
	'other': 'ellipsis-horizontal',
	default: 'receipt'
};

export const TransactionItem = ({ item = {}, onDelete = () => {} }) => {
	const { title = "", category = "", amount = 0, date = "" } = item;
		const { currency, convert } = useCurrency();
	const { theme } = useTheme();
	const styles = createHomeStyles(theme);
		const { visible: showBalance } = useBalanceVisibility();

	 const router = useRouter();

	 const confirmDelete = () => {
			// navigate to a dedicated confirmation page which will call the API
			if (!item || !item.id) {
				if (process.env.NODE_ENV !== 'production') {
					// eslint-disable-next-line no-console
					console.warn('[TransactionItem] blocked delete navigation: missing item.id', item);
				}
				return;
			}
			router.push(`/delete-transaction/${item.id}`);
		};

	const parsedDate = date ? new Date(date) : new Date();
	const weekday = parsedDate.toLocaleDateString(undefined, { weekday: 'short' });

	return (
		<View style={styles.transactionCard}>
			<View style={styles.transactionContent}>
							<View style={styles.categoryIconContainer}>
								<Ionicons
									name={CATEGORY_ICON_MAP[(category || '').toLowerCase().trim()] || CATEGORY_ICON_MAP.default}
									size={20}
									color={theme.primary}
								/>
							</View>
				<View style={styles.transactionLeft}>
					<Text style={styles.transactionTitle}>{title}</Text>
					<Text style={[styles.transactionCategory, { color: amount >= 0 ? (theme.income || '#2ECC71') : (theme.expense || '#E74C3C') }]}>{category}</Text>
					{item.note ? <Text style={[styles.transactionNote, { color: theme.textLight, marginTop: 4 }]} numberOfLines={2}>{item.note}</Text> : null}
				</View>
								<View style={styles.transactionRight}>
													                    <Text style={[styles.transactionAmount, { color: amount >= 0 ? (theme.income || '#2ECC71') : (theme.expense || '#E74C3C') }]}>{showBalance ? formatCurrency(convert(amount), currency) : '•••'}</Text>
													                    <Text style={[styles.transactionDate, { color: theme.textLight }]}>{parsedDate.toLocaleDateString()}</Text>
													                    <Text style={[styles.transactionDate, { fontSize: 11, color: theme.textLight }]}>{weekday}</Text>
								</View>
															</View>
															<Pressable style={({ hovered }) => [styles.deleteButton, hovered && { opacity: 0.8 }]} onPress={confirmDelete}>
																<Ionicons name="trash" size={20} color={'#E74C3C'} />
															</Pressable>
		</View>
	);
};

// NOTE: styles are provided by createHomeStyles(theme) from assets/styles/home.styles

export default TransactionItem;

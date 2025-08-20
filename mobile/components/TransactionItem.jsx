import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrency } from "../lib/utils";

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
										<Text style={[styles.transactionCategory, { color: amount >= 0 ? (theme.income || '#2ECC71') : styles.transactionCategory.color }]}>{category}</Text>
				</View>
								<View style={styles.transactionRight}>
											<Text style={[styles.transactionAmount, { color: amount >= 0 ? (theme.income || '#2ECC71') : (theme.expense || '#E74C3C') }]}>{formatCurrency(convert(amount), currency)}</Text>
										<Text style={styles.transactionDate}>{date ? new Date(date).toLocaleString() : ''}</Text>
										<Text style={[styles.transactionDate, { fontSize: 11, color: theme.textLight }]}>{date ? new Date(date).toLocaleDateString(undefined, { weekday: 'long' }) : ''}</Text>
								</View>
			</View>
			<TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
				<Ionicons name="trash" size={20} color={'#E74C3C'} />
			</TouchableOpacity>
		</View>
	);
};

export default TransactionItem;

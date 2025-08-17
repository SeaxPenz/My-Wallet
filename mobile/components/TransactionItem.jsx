import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrency } from "../lib/utils";

export const TransactionItem = ({ item = {}, onDelete = () => {} }) => {
	const { title = "", category = "", amount = 0, date = "" } = item;
		const { currency, convert } = useCurrency();
	const { theme } = useTheme();
	const styles = createHomeStyles(theme);

	return (
		<View style={styles.transactionCard}>
			<View style={styles.transactionContent}>
				<View style={styles.categoryIconContainer}>
					<Ionicons name="receipt" size={20} color={theme.primary} />
				</View>
				<View style={styles.transactionLeft}>
					<Text style={styles.transactionTitle}>{title}</Text>
					<Text style={styles.transactionCategory}>{category}</Text>
				</View>
				<View style={styles.transactionRight}>
					  <Text style={styles.transactionAmount}>{formatCurrency(convert(amount), currency)}</Text>
					<Text style={styles.transactionDate}>{date}</Text>
				</View>
			</View>
			<TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
				<Ionicons name="trash" size={20} color={theme.textLight} />
			</TouchableOpacity>
		</View>
	);
};

export default TransactionItem;

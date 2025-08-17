import React from "react";
import { View, Text } from "react-native";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { formatCurrency } from "../lib/utils";


export const BalanceCard = ({ summary = { balance: 0, income: 0, expenses: 0 } }) => {
	const { balance, income, expenses } = summary || {};
		const { currency, convert } = useCurrency();
	const { theme } = useTheme();
	const styles = createHomeStyles(theme);

	return (
		<View style={styles.balanceCard}>
			<Text style={styles.balanceTitle}>Total Balance</Text>
			<Text style={styles.balanceAmount}>{formatCurrency(convert(balance), currency)}</Text>

			<View style={styles.balanceStats}>
				<View style={styles.balanceStatItem}>
					<Text style={styles.balanceStatLabel}>Income</Text>
					  <Text style={[styles.balanceStatAmount, { color: theme.income || theme.primary }]}>{formatCurrency(convert(income), currency)}</Text>
				</View>
				<View style={[styles.balanceStatItem, styles.statDivider]}>
					<Text style={styles.balanceStatLabel}>Expenses</Text>
					  <Text style={[styles.balanceStatAmount, { color: theme.expense || '#E74C3C' }]}>{formatCurrency(convert(expenses), currency)}</Text>
				</View>
			</View>
		</View>
	);
};

export default BalanceCard;

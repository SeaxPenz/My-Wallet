import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../lib/utils';

// Now accepts currency and convert so values are displayed in the selected currency
export const BalanceCard = ({ summary = { balance: 0, income: 0, expenses: 0 }, onRefresh = null, theme = null, currency = null, convert = (v)=>v }) => {
	const { balance, income, expenses } = summary || {};

	const refreshColor = theme?.text || '#333';

	// convert stored base values to selected currency for display
	const displayBalance = convert(balance || 0);
	const displayIncome = convert(income || 0);
	const displayExpenses = convert(expenses || 0);

	const balanceColor = theme?.mode === 'dark' ? (theme.white || '#FFFFFF') : (theme?.text || '#111');

	return (
		<View style={[styles.card, { backgroundColor: theme?.card || styles.card.backgroundColor }]}> 
			<TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
				<Ionicons name="refresh" size={18} color={refreshColor} />
			</TouchableOpacity>
			<Text style={[styles.balanceText, { color: balanceColor }]}>{formatCurrency(displayBalance, currency || { code: 'USD', locale: 'en-US', symbol: '$' })}</Text>
			<View style={styles.row}>
				<Text style={[styles.income, { color: 'green' }]}>{formatCurrency(displayIncome, currency || { code: 'USD', locale: 'en-US', symbol: '$' })}</Text>
				<Text style={[styles.expense, { color: '#E53935' }]}>{formatCurrency(Math.abs(displayExpenses), currency || { code: 'USD', locale: 'en-US', symbol: '$' })}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: { padding: 18, borderRadius: 10, backgroundColor: '#fff', minHeight: 160 },
	refreshBtn: { position: 'absolute', right: 12, top: 12 },
	balanceText: { fontSize: 32, fontWeight: '800', marginTop: 8 },
	row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
	income: { fontSize: 14, fontWeight: '700' },
	expense: { fontSize: 14, fontWeight: '700' },
});

export default BalanceCard;

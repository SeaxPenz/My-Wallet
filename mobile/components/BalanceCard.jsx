import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../lib/utils';
import { useBalanceVisibility } from '../context/BalanceVisibilityContext';

// Now accepts currency and convert so values are displayed in the selected currency
export const BalanceCard = ({ summary = { balance: 0, income: 0, expenses: 0 }, onRefresh = null, theme = null, currency = null, convert = (v)=>v }) => {
	const { balance, income, expenses } = summary || {};

	const { visible: showBalance, setVisible: setShowBalance } = useBalanceVisibility();
	const toggleShow = () => setShowBalance(!showBalance);

	const refreshColor = theme?.text || '#333';

	// convert stored base values to selected currency for display
	const displayBalance = convert(balance || 0);
	const displayIncome = convert(income || 0);
	const displayExpenses = convert(expenses || 0);

	const balanceColor = theme?.mode === 'dark' ? (theme.white || '#FFFFFF') : (theme?.text || '#111');

	return (
		<View style={[styles.card, { backgroundColor: theme?.card || '#FFFFFF' }]}> 
			<TouchableOpacity style={styles.eyeBtn} onPress={toggleShow}>
				<Ionicons name={showBalance ? 'eye' : 'eye-off'} size={18} color={refreshColor} />
			</TouchableOpacity>
			<TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
				<Ionicons name="refresh" size={18} color={refreshColor} />
			</TouchableOpacity>
					<Text
						style={[styles.balanceText, { color: balanceColor }]}
						numberOfLines={1}
						ellipsizeMode="tail"
						adjustsFontSizeToFit={true}
						maxFontSizeMultiplier={1.1}
					>{showBalance ? formatCurrency(displayBalance, currency || { code: 'USD', locale: 'en-US', symbol: '$' }) : '•••••'}</Text>
						<View style={styles.row}>
								<View style={{ alignItems: 'flex-start' }}>
									<Text style={[styles.label, { color: theme?.textLight || '#999' }]}>Income</Text>
									<Text style={[styles.income, { color: theme?.income || 'green' }]}>{showBalance ? formatCurrency(displayIncome, currency || { code: 'USD', locale: 'en-US', symbol: '$' }) : '••••'}</Text>
								</View>
								<View style={{ alignItems: 'flex-end' }}>
									<Text style={[styles.label, { color: theme?.textLight || '#999' }]}>Expenses</Text>
									<Text style={[styles.expense, { color: theme?.expense || '#E53935' }]}>{showBalance ? formatCurrency(Math.abs(displayExpenses), currency || { code: 'USD', locale: 'en-US', symbol: '$' }) : '••••'}</Text>
								</View>
						</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: { padding: 18, borderRadius: 10, backgroundColor: '#fff', minHeight: 160 },
	eyeBtn: { position: 'absolute', left: 12, top: 12 },
	refreshBtn: { position: 'absolute', right: 12, top: 12 },
	balanceText: { fontSize: 32, fontWeight: '800', marginTop: 8 },
	row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
	income: { fontSize: 14, fontWeight: '700' },
	expense: { fontSize: 14, fontWeight: '700' },
	 label: { fontSize: 12, fontWeight: '600', opacity: 0.9 }
});

export default BalanceCard;

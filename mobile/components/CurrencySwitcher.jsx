import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable, StyleSheet } from 'react-native';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function CurrencySwitcher({ compact = false }) {
  const { currency, setCurrency, available, refreshRates } = useCurrency();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const items = Object.values(available);
  const themedStyles = StyleSheet.create({
    trigger: { flexDirection: 'row', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingTop: 56, alignItems: 'flex-end' },
  menu: { alignSelf: 'flex-end', marginTop: 8, marginRight: 12, borderRadius: 8, padding: 6, minWidth: 140, elevation: 6, maxHeight: '55%', overflow: 'hidden' },
    menuItem: { padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });

  return (
    <View>
      <TouchableOpacity style={themedStyles.trigger} onPress={() => setOpen(true)}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>{currency.symbol}</Text>
        {!compact && <Text style={{ color: theme.text, marginLeft: 6 }}>{currency.code}</Text>}
        <Ionicons name="chevron-down" size={14} color={theme.text} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[themedStyles.menu, { backgroundColor: theme.card }]}> 
            <FlatList
              data={items}
              keyExtractor={(i) => i.code}
              renderItem={({ item }) => (
                <TouchableOpacity
      style={themedStyles.menuItem}
                  onPress={() => {
                    setCurrency(item.code);
                    // refresh rates in background to ensure freshest rates and update UI instantly
                    try { refreshRates(); } catch (_) { /* ignore */ }
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: theme.text }}>{item.symbol} {item.code}</Text>
                  {currency.code === item.code && <Ionicons name="checkmark" size={16} color={theme.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingTop: 56, alignItems: 'flex-end' },
  menu: { alignSelf: 'flex-end', marginTop: 8, marginRight: 12, borderRadius: 8, padding: 6, minWidth: 140, elevation: 6, maxHeight: '55%', overflow: 'hidden' },
  menuItem: { padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

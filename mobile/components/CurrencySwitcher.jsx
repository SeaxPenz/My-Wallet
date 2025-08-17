import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable, StyleSheet } from 'react-native';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function CurrencySwitcher({ compact = false }) {
  const { currency, setCurrency, available } = useCurrency();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const items = Object.values(available);

  return (
    <View>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)}>
        <Text style={{ color: theme.text, fontWeight: '700' }}>{currency.symbol}</Text>
        {!compact && <Text style={{ color: theme.text, marginLeft: 6 }}>{currency.code}</Text>}
        <Ionicons name="chevron-down" size={14} color={theme.text} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.menu, { backgroundColor: theme.card }]}> 
            <FlatList
              data={items}
              keyExtractor={(i) => i.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setCurrency(item.code);
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menu: { position: 'absolute', right: 12, top: 60, borderRadius: 8, padding: 6, minWidth: 140, elevation: 6 },
  menuItem: { padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

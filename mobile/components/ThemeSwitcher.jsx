import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable, StyleSheet, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme, THEME_LIST } = useTheme();
  const [open, setOpen] = useState(false);
  const items = Object.values(THEME_LIST || {}).filter(t => t.id !== 'vn');

  return (
    <View style={{ alignItems: 'center', marginBottom: 8 }}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={{ padding: 8, borderRadius: 10, backgroundColor: theme.card }}
      >
        <MaterialCommunityIcons name={theme.id === 'dark' ? 'weather-night' : 'white-balance-sunny'} size={20} color={theme.text} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Backdrop closes modal on press */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Menu container: align to top-right and don't close when tapping inside */}
          <View style={[styles.menu, { backgroundColor: theme.card }]}>
            <TouchableWithoutFeedback onPress={() => { /* swallow touch so backdrop doesn't receive it */ }}>
              <ScrollView style={{ maxHeight: '55%' }} contentContainerStyle={{ paddingVertical: 6 }}>
                {items.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setTheme(item.id);
                      setOpen(false);
                    }}
                    style={styles.menuItem}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: item.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#00000010' }}>
                      {/* small swatch, icon uses headerText if provided */}
                      <Ionicons name={item.id === 'dark' ? 'moon' : item.id === 'forest' ? 'leaf' : item.id === 'purple' ? 'color-palette' : 'sunny'} size={16} color={item.headerText || '#fff'} />
                    </View>
                    <View>
                      <Text style={{ color: theme.text, fontWeight: '600' }}>{item.name}</Text>
                      <Text style={{ color: theme.textLight, fontSize: 12 }}>{item.mode === 'dark' ? 'Dark' : 'Light'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableWithoutFeedback>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-start' },
  menu: { marginTop: 56, marginRight: 12, marginLeft: 'auto', borderRadius: 8, padding: 6, minWidth: 140, elevation: 6 },
  menuItem: { padding: 8, flexDirection: 'row', alignItems: 'center' },
});
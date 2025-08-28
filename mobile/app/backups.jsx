import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useSafeUser as useUser } from '../hooks/useSafeUser';

export default function BackupsPage() {
  const { theme } = useTheme();
  const { user } = useUser();

  const handleBackupNow = async () => {
    // Placeholder: call backend backup endpoint or trigger export
    Alert.alert('Backup', 'Backup started (stub).');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ color: theme.headerText || theme.text, fontSize: 20, fontWeight: '700' }}>Backups</Text>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Manage backups of your transactions and settings.</Text>
        <TouchableOpacity onPress={handleBackupNow} style={{ marginTop: 12, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.white }}>Backup Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

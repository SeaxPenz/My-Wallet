import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function TemplatesPage() {
  const { theme } = useTheme();

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <Text style={{ color: theme.headerText || theme.text, fontSize: 20, fontWeight: '700' }}>Templates</Text>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.textLight }}>Create and manage transaction templates for quick entry.</Text>
        <TouchableOpacity onPress={() => Alert.alert('Templates', 'Create new template (stub)')} style={{ marginTop: 12, padding: 12, backgroundColor: theme.primary, borderRadius: 8 }}>
          <Text style={{ color: theme.white }}>New Template</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

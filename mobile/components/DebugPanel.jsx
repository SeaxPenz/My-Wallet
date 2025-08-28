import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import debug from '../lib/requestDebug';
import { API_URL } from '../constants/api';

export default function DebugPanel() {
  const [last, setLast] = useState(debug.get());
  useEffect(() => {
    const id = setInterval(() => setLast(debug.get()), 1000);
    return () => clearInterval(id);
  }, []);

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 8, zIndex: 9999 }}>
      <Text style={{ color: '#fff', fontWeight: '700' }}>API</Text>
      <Text style={{ color: '#fff', fontSize: 12 }}>{API_URL}</Text>
      <Text style={{ color: '#fff', fontWeight: '700', marginTop: 6 }}>DEV_USER</Text>
      <Text style={{ color: '#fff', fontSize: 12 }}>{process.env.EXPO_DEV_USER_ID || 'none'}</Text>
      <Text style={{ color: '#fff', fontWeight: '700', marginTop: 6 }}>Last</Text>
      <Text style={{ color: '#fff', fontSize: 12 }}>{last ? `${last.status || 'unknown'} ${last.msg || ''}` : 'no requests yet'}</Text>
    </View>
  );
}

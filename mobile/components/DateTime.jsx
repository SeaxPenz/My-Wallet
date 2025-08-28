import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DateTime({ syncApi = true, apiUrl }) {
  const { theme } = useTheme();
  apiUrl = apiUrl || process.env.TIMEZONEDB_GATEWAY || 'https://worldtimeapi.org/api/ip';
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!syncApi) return;
    (async () => {
      try {
        const devUserId = process.env.EXPO_DEV_USER_ID;
        const headers = {};
        if (devUserId && apiUrl && apiUrl.includes('my-wallet-bl80.onrender.com')) headers['x-user-id'] = devUserId;
        const resp = await fetch(apiUrl, { headers });
        const json = await resp.json();
        const iso = json?.datetime || json?.formatted || json?.utc_datetime || (json?.unixtime ? new Date(json.unixtime * 1000).toISOString() : null);
        if (iso) {
          const dt = new Date(iso);
          const offset = dt.getTime() - Date.now();
          setNow(new Date(Date.now() + offset));
        }
      } catch (_e) {
        // ignore
      }
    })();
  }, [syncApi, apiUrl]);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <View style={[styles.container, { alignItems: 'flex-start' }]}>
      <Text numberOfLines={1} style={[styles.time, { color: theme.text }]}>{timeStr}</Text>
      <Text numberOfLines={1} style={[styles.date, { color: theme.textLight }]}>{dateStr}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { maxWidth: 260 },
  time: { fontSize: 18, fontWeight: '800' },
  date: { fontSize: 12 },
});

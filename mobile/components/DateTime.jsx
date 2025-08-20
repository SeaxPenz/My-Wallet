import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// DateTime component
// Props:
// - syncApi (bool) : whether to fetch authoritative time from `apiUrl` once on mount
// - apiUrl (string) : URL of time API to use (defaults to worldtimeapi.org)
const TIMEZONEDB_KEY = process.env.TIMEZONEDB_API_KEY;
const TIMEZONEDB_GATEWAY = process.env.TIMEZONEDB_GATEWAY || 'https://api.timezonedb.com';

export default function DateTime({ syncApi = true, apiUrl = 'https://worldtimeapi.org/api/ip' }) {
  const { theme } = useTheme();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // offset in ms to apply to local clock so it matches server time
  const offsetRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date(Date.now() + offsetRef.current));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!syncApi) return;
    let mounted = true;
    setLoading(true);
    setError(null);

    // If TimeZoneDB key exists, prefer using TimeZoneDB endpoint
    const tzdbUrl = TIMEZONEDB_KEY
      ? `${TIMEZONEDB_GATEWAY}/v2.1/get-time-zone?key=${TIMEZONEDB_KEY}&format=json&by=zone&zone=Etc/UTC`
      : null;

    const fetchUrl = tzdbUrl || apiUrl;

    fetch(fetchUrl)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // worldtimeapi returns ISO in `datetime` or `utc_datetime`
        // TimeZoneDB returns `formatted` like '2025-08-20 12:34:56' and `timestamp` (unix)
        let serverMs = null;
        if (data?.datetime || data?.utc_datetime) {
          const iso = data.datetime || data.utc_datetime;
          serverMs = new Date(iso).getTime();
        } else if (data?.formatted) {
          // formatted is 'YYYY-MM-DD HH:MM:SS' in TimeZoneDB (assumed UTC if timezone=UTC)
          serverMs = new Date(data.formatted + 'Z').getTime();
        } else if (typeof data?.timestamp === 'number') {
          serverMs = data.timestamp * 1000;
        }

        if (serverMs) {
          const localMs = Date.now();
          offsetRef.current = serverMs - localMs;
          setNow(new Date(localMs + offsetRef.current));
        } else {
          // fallback: do nothing, keep local time
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || String(err));
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [apiUrl, syncApi]);

  const formatted = now.toLocaleString();

  return (
    <View style={{ alignItems: 'flex-end', maxWidth: 220, marginRight: 6 }}>
      {loading ? <ActivityIndicator size="small" color={theme.primary} /> : null}
      <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{formatted}</Text>
      {error ? (
        <TouchableOpacity onPress={() => { setError(null); /* allow retry by re-mounting if needed */ }}>
          <Text style={{ color: theme.expense || theme.primary, fontSize: 10 }}>{error}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

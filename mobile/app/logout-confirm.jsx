import { View, Text, TouchableOpacity } from 'react-native';
import useSafeClerk from '../hooks/useSafeClerk';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';

export default function LogoutConfirm() {
  const { signOut } = useSafeClerk();
  const { theme } = useTheme();
  const router = useRouter();

  const handleConfirm = async () => {
    try {
  await signOut();
  console.log('signOut: success');
  router.replace('/');
    } catch (err) {
  console.warn('Sign out failed', err);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 20, justifyContent: 'center' }}>
      <Text style={{ color: theme.text, fontSize: 20, marginBottom: 12 }}>Confirm Logout</Text>
      <Text style={{ color: theme.textLight, marginBottom: 20 }}>Are you sure you want to log out?</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.card, alignItems: 'center' }}>
          <Text style={{ color: theme.text }}>No, cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleConfirm} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.primary, alignItems: 'center' }}>
          <Text style={{ color: theme.white }}>Yes, log out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

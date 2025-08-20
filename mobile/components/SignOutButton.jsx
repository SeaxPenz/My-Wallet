import { TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { useRouter } from 'expo-router'

export const SignOutButton = () => {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.push('/logout-confirm')} style={{ padding: 8 }}>
      <Ionicons name="log-out" size={18} color={theme.text} />
    </TouchableOpacity>
  )
}
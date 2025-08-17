import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';

const SafeScreen = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        backgroundColor: theme.background,
      }}
    >
      <View style={{ position: 'absolute', top: insets.top + 12, right: 12, zIndex: 50 }}>
        <ThemeSwitcher />
      </View>
      {children}
    </View>
  );
};

export default SafeScreen;
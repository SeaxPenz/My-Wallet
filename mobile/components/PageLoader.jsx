import { View, ActivityIndicator } from "react-native";
import { createHomeStyles } from "../assets/styles/home.styles";
import { useTheme } from "../context/ThemeContext";

const PageLoader = () => {
  const { theme } = useTheme();
  const styles = createHomeStyles(theme);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
};
export default PageLoader;
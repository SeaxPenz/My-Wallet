import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import SafeScreen from "../components/SafeScreen"; // <-- fixed import
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { CurrencyProvider } from "../context/CurrencyContext";

export default function RootLayout() {
  return (
    <ClerkProvider
      tokenCache={tokenCache}
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
      <ThemeProvider>
        <CurrencyProvider>
          <SafeScreen>
            <Slot />
          </SafeScreen>
        </CurrencyProvider>
      </ThemeProvider>
      <StatusBar style="dark" />
    </ClerkProvider>
  );
}
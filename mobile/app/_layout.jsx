import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import { Slot } from "expo-router";
import SafeScreen from "../components/SafeScreen"; // <-- fixed import
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "../context/ThemeContext";
import { CurrencyProvider } from "../context/CurrencyContext";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  // Detect clearly invalid placeholder values and avoid crashing the app in dev.
  const isValidClerkKey =
    typeof publishableKey === "string" &&
    publishableKey.startsWith("pk_") &&
    !publishableKey.toUpperCase().includes("PLACEHOLDER") &&
    publishableKey !== "";

  if (!isValidClerkKey) {
    console.warn(
      "Clerk publishable key is missing or invalid. Authentication features will be disabled. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env with a valid key from https://dashboard.clerk.com"
    );
    return (
      <ThemeProvider>
        <CurrencyProvider>
          <SafeScreen>
            <Slot />
          </SafeScreen>
        </CurrencyProvider>
        <StatusBar style="dark" />
      </ThemeProvider>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
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
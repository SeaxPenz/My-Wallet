import React from "react";
import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo"; // remove if you don't use Clerk on web
import { tokenCache } from "@clerk/clerk-expo/token-cache";
// Dev helper: create file-backed Errors on runtime errors to aid Metro symbolication
import "../utils/devSymbolicate";
import SafeScreen from "../components/SafeScreen"; // <-- fixed import
import DebugPanel from "../components/DebugPanel";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "../context/ThemeContext";
import { CurrencyProvider } from "../context/CurrencyContext";
import BalanceVisibilityProvider from '../context/BalanceVisibilityContext';

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  // Detect clearly invalid placeholder values and avoid crashing the app in dev.
  const isValidClerkKey =
    typeof publishableKey === "string" &&
    publishableKey.startsWith("pk_") &&
    !publishableKey.toUpperCase().includes("PLACEHOLDER") &&
    !publishableKey.toLowerCase().includes("replace") &&
    publishableKey !== "" &&
    publishableKey !== "pk_test_replace_with_real_key";

  // debug: print effective API URL and basic env info so Expo logs show what the client will call
  console.debug('[App] Using API_URL ->', process.env.EXPO_PUBLIC_API_URL);

  if (!isValidClerkKey) {
    console.warn(
      "Clerk publishable key is missing or invalid. Authentication features will be disabled. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env with a valid key from https://dashboard.clerk.com"
    );
    // Render app without ClerkProvider so app features that don't require auth still work.
    return (
      <ThemeProvider>
        <CurrencyProvider>
          <BalanceVisibilityProvider>
            <SafeScreen>
              <Slot />
              <DebugPanel />
            </SafeScreen>
          </BalanceVisibilityProvider>
        </CurrencyProvider>
        <StatusBar style="dark" />
      </ThemeProvider>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ThemeProvider>
        <CurrencyProvider>
          <BalanceVisibilityProvider>
            <SafeScreen>
              <Slot />
            </SafeScreen>
          </BalanceVisibilityProvider>
        </CurrencyProvider>
        <StatusBar style="dark" />
      </ThemeProvider>
    </ClerkProvider>
  );
}
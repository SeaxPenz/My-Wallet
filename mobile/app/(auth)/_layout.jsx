import { Redirect, Stack } from "expo-router";
import React from "react";
import { View, Text } from 'react-native';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isClerkEnabled = typeof publishableKey === "string" && publishableKey.startsWith("pk_") && !publishableKey.toUpperCase().includes("PLACEHOLDER");

function ClerkWrapper() {
  const { useAuth } = require('@clerk/clerk-expo');
  const { isSignedIn } = useAuth();
  if (isSignedIn) return <Redirect href={'/'} />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function AuthRoutesLayout() {
  if (!isClerkEnabled) {
    // Clerk not configured — render a minimal Stack that shows a helpful message using native components
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="disabled" options={{ headerShown: true, title: "Auth disabled" }}>
          {() => (
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Authentication disabled</Text>
              <Text>Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in mobile/.env to enable sign-in flows.</Text>
            </View>
          )}
        </Stack.Screen>
      </Stack>
    );
  }

  return <ClerkWrapper />;
}
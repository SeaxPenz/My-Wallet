import { Stack } from "expo-router";
import React from "react";

// This layout simply exposes the Stack for auth-related routes.
// Auth-specific components should use Clerk hooks and will operate correctly
// when `ClerkProvider` is present at the app root (`app/_layout.jsx`).
export default function AuthRoutesLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
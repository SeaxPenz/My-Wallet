import { useUser } from "@clerk/clerk-expo";

// Safe wrapper around Clerk's useUser() hook. If ClerkProvider is not present
// (e.g. when the publishable key is invalid and the app renders without Clerk),
// calling useUser() throws — catch that and return a safe fallback so the UI
// can still render in development. Additionally, when running in dev and
// Clerk is not available, return a lightweight stub user so authenticated
// flows can be tested locally.
const DEV_STUB_USER = {
  id: "dev-user-1",
  fullName: "Dev User",
  primaryEmailAddress: { emailAddress: "dev@example.com" },
  emailAddresses: [{ emailAddress: "dev@example.com" }],
};

export function useSafeUser() {
  try {
    return useUser();
  } catch (err) {
    // In development, prefer a stub user to exercise authenticated UI.
    // React Native/MS runtime uses __DEV__ and Expo sets EXPO_DEV in some setups.
    const isDev =
      (typeof __DEV__ !== "undefined" && __DEV__) ||
      process?.env?.NODE_ENV === "development" ||
      process?.env?.EXPO_DEV === "true";
    if (isDev) {
      return { isLoaded: true, isSignedIn: true, user: DEV_STUB_USER };
    }

    // Return the same shape as useUser would, but with no authenticated user.
    return { isLoaded: false, isSignedIn: false, user: null };
  }
}

export default useSafeUser;

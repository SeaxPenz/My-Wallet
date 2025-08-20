import { useSignIn } from "@clerk/clerk-expo";

// Safe wrapper around Clerk's useSignIn hook.
// If Clerk isn't initialized this will return a safe, no-op shaped object so
// components can render without throwing.
export default function useSafeSignIn() {
  try {
    return useSignIn();
  } catch (_err) {
    return {
      isLoaded: false,
      // keep a minimal signIn shape so callers can await methods and handle rejects
      signIn: {
        create: async () => Promise.reject(new Error("Clerk not configured")),
        prepareFirstFactor: async () =>
          Promise.reject(new Error("Clerk not configured")),
        attemptFirstFactor: async () =>
          Promise.reject(new Error("Clerk not configured")),
      },
      setActive: async () => {},
    };
  }
}

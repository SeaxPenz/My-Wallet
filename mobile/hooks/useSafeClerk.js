import { useClerk } from "@clerk/clerk-expo";

// Safe wrapper around useClerk to provide updateUser, signOut and other helpers safely.
export default function useSafeClerk() {
  try {
    return useClerk();
  } catch (_err) {
    return {
      // In dev when Clerk isn't configured we provide no-op implementations
      // so UI can call these without crashing. In production these should
      // be the real Clerk methods.
      updateUser: async () => {
        console.warn(
          "useSafeClerk: updateUser called but Clerk not configured"
        );
        return;
      },
      signOut: async () => {
        console.warn(
          "useSafeClerk: signOut called but Clerk not configured (no-op)"
        );
        return;
      },
      // allow code to check presence
      __isSafeFallback: true,
    };
  }
}

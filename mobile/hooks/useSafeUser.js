import { useUser } from "@clerk/clerk-expo";

// Safe wrapper around Clerk's useUser() hook. If ClerkProvider is not present
// (e.g. when the publishable key is invalid and the app renders without Clerk),
// calling useUser() throws — catch that and return a safe fallback so the UI
// can still render in development.
export function useSafeUser() {
  try {
    return useUser();
  } catch (err) {
    // Return the same shape as useUser would, but with no authenticated user.
    return { isLoaded: false, isSignedIn: false, user: null };
  }
}

export default useSafeUser;

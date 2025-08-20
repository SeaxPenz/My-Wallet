import { useSignUp } from "@clerk/clerk-expo";

// Safe wrapper around Clerk's useSignUp hook.
export default function useSafeSignUp() {
  try {
    return useSignUp();
  } catch (_err) {
    return {
      isLoaded: false,
      signUp: {
        create: async () => Promise.reject(new Error("Clerk not configured")),
        prepareEmailAddressVerification: async () =>
          Promise.reject(new Error("Clerk not configured")),
        attemptEmailAddressVerification: async () =>
          Promise.reject(new Error("Clerk not configured")),
      },
      setActive: async () => {},
    };
  }
}

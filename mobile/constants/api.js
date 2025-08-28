import { Platform } from "react-native";

// Read the configured API URL from env (set via .env or CI). Use it if present.
// Previously we silently fell back to localhost when the value looked like a
// placeholder (e.g. 192.168.x.y). That makes the app ignore a deliberately set
// EXPO_PUBLIC_API_URL used for LAN testing — keep the heuristic warning but
// still use the provided value.
const envUrlRaw = process.env.EXPO_PUBLIC_API_URL;
let validatedEnvUrl = null;

if (envUrlRaw) {
  try {
    // allow the provided URL but trim trailing slashes
    validatedEnvUrl = envUrlRaw.replace(/\/+$/, "");
    const parsed = new URL(validatedEnvUrl);
    const host = parsed.hostname || "";
    if (/\b[xX]|\by\b/.test(host) || /x\.y/.test(validatedEnvUrl)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[api] EXPO_PUBLIC_API_URL looks like a placeholder (${envUrlRaw}). Using it anyway.`
      );
    }
    // If the provided URL mistakenly contains a '/transactions' path (for
    // example: 'https://host/.../api/transactions'), strip that segment so
    // consumers can safely append '/transactions' without duplicating it.
    // Keep other path segments (eg '/api').
    try {
      const pathname = parsed.pathname || "";
      if (/\/transactions(\/.*)?$/.test(pathname)) {
        // remove the trailing '/transactions' and anything after it
        const newPath = pathname.replace(/\/transactions(\/.*)?$/, "");
        // reconstruct validatedEnvUrl without trailing slash
        validatedEnvUrl =
          `${parsed.protocol}//${parsed.host}${newPath}`.replace(/\/+$/, "");
      }
    } catch (e) {
      // ignore normalization errors and use the provided value
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[api] EXPO_PUBLIC_API_URL is not a valid URL (${envUrlRaw}). Falling back to localhost.`,
      err?.message || err
    );
    validatedEnvUrl = null;
  }
}

// For web, prefer the same origin the app is served from so browser fetches go
// to the correct host. For native use localhost/emulator mapping as before.
let defaultUrl;
if (Platform.OS === "web") {
  // In local development, the Expo/webpack dev server origin is not the same
  // as the API backend. Default to localhost:5001 for web so API requests
  // target the local backend unless overridden by EXPO_PUBLIC_API_URL.
  defaultUrl = "http://127.0.0.1:5001/api";
} else {
  const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  defaultUrl = `http://${defaultHost}:5001/api`;
}

export const API_URL = validatedEnvUrl || defaultUrl;

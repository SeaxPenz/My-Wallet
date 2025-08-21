import { Platform } from "react-native";

// Read the configured API URL from env (set via .env or CI). If it's missing or looks
// like a placeholder (for example: http://192.168.x.y:5001), fall back to localhost
// (127.0.0.1) on desktop or the Android emulator mapping (10.0.2.2).
const envUrlRaw = process.env.EXPO_PUBLIC_API_URL;
let validatedEnvUrl = null;

if (envUrlRaw) {
  try {
    const parsed = new URL(envUrlRaw);
    const host = parsed.hostname || "";
    // Quick heuristic to detect the common placeholder pattern used in .env in this
    // workspace (e.g. '192.168.x.y'). If you use a real hostname with letters this
    // will still allow it.
    if (/\b[xX]|\by\b/.test(host) || /x\.y/.test(envUrlRaw)) {
      // eslint-disable-next-line no-console
      console.warn(
        `[api] EXPO_PUBLIC_API_URL looks like a placeholder (${envUrlRaw}). Falling back to localhost.`
      );
    } else {
      // remove any trailing slash so callers can append paths safely
      validatedEnvUrl = envUrlRaw.replace(/\/+$/, "");
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[api] EXPO_PUBLIC_API_URL is not a valid URL (${envUrlRaw}). Falling back to localhost.`,
      err?.message || err
    );
  }
}

const defaultHost = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
// Default to port 5002 if the backend is started on that port during local testing
export const API_URL = validatedEnvUrl || `http://${defaultHost}:5002/api`;

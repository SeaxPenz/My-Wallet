// Dev helper: when a runtime error occurs in the client, log a new Error from this file
// so Metro will try to symbolicate a real file path instead of "<anonymous>".
// This file is intentionally development-only and safe to keep in the repo.

if (
  typeof globalThis !== "undefined" &&
  process.env.NODE_ENV !== "production"
) {
  // Only attach dev symbolication handlers when a global event target exists.
  // In Hermes / some RN runtimes `window` may be undefined or missing addEventListener.
  const maybeWindow =
    typeof window !== "undefined"
      ? window
      : typeof globalThis !== "undefined"
      ? globalThis
      : null;
  if (maybeWindow && typeof maybeWindow.addEventListener === "function") {
    // do not crash the app; just log a file-backed Error for Metro to symbolicate
    maybeWindow.addEventListener("error", (ev) => {
      try {
        const msg = ev?.error?.message || ev?.message || "<unknown error>";
        console.error(new Error(`devSymbolicate caught error: ${msg}`));
      } catch (e) {
        console.error("devSymbolicate failed", e);
      }
    });

    maybeWindow.addEventListener("unhandledrejection", (ev) => {
      try {
        const reason = ev?.reason?.message || String(ev?.reason);
        console.error(
          new Error(`devSymbolicate unhandledrejection: ${reason}`)
        );
      } catch (e) {
        console.error("devSymbolicate failed", e);
      }
    });
  }
}

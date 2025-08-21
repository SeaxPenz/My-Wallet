// Dev helper: when a runtime error occurs in the client, log a new Error from this file
// so Metro will try to symbolicate a real file path instead of "<anonymous>".
// This file is intentionally development-only and safe to keep in the repo.

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  // do not crash the app; just log a file-backed Error for Metro to symbolicate
  window.addEventListener("error", (ev) => {
    try {
      const msg = ev?.error?.message || ev?.message || "<unknown error>";
      // Emit a new Error created here so the stack includes this file's path.
      // Metro's symbolicator will attempt to read this file instead of "<anonymous>".
      console.error(new Error(`devSymbolicate caught error: ${msg}`));
    } catch (e) {
      // best-effort
      console.error("devSymbolicate failed", e);
    }
  });

  window.addEventListener("unhandledrejection", (ev) => {
    try {
      const reason = ev?.reason?.message || String(ev?.reason);
      console.error(new Error(`devSymbolicate unhandledrejection: ${reason}`));
    } catch (e) {
      console.error("devSymbolicate failed", e);
    }
  });
}

// Dev-only preload: monkeypatch path.relative to log when called with undefined 'to'
// This file is intentionally small and safe — it only logs stack traces for diagnostics.
const path = require("path");
const orig = path.relative;

path.relative = function (from, to) {
  try {
    if (typeof to === "undefined") {
      // Print an unmistakable marker so we can find it in Metro/Expo logs.
      console.error(
        "\n===== MONKEYPATCH: path.relative called with undefined `to` ====="
      );
      console.error("from:", from, "to:", to);
      // Print a stack with the first non-node frame highlighted
      const stack = new Error().stack;
      console.error(stack);
      console.error("===== END MONKEYPATCH =====\n");
    }
  } catch (e) {
    // ignore
  }
  return orig.apply(this, arguments);
};

// Export nothing; script only runs for its side-effects.
module.exports = {};

// Dev-only router patch: guard against undefined/invalid navigation targets
// Imported early from the root layout to prevent Metro/Expo web runtime crashes
// where an undefined "to"/href propagates into the linking internals.
try {
  // Import lazily to avoid breaking native bundlers that may not expose same internals
  // eslint-disable-next-line import/no-extraneous-dependencies
  const Router = require("expo-router");
  const router =
    Router && Router.router ? Router.router : Router?.default?.router;

  if (router && !router.__patchedForUndefinedGuard) {
    const methodsToWrap = [
      "push",
      "replace",
      "linkTo",
      "navigate",
      "setParams",
      "goBack",
    ];

    // small helper to get a compact stack trace and calling site
    const getCallerStack = () => {
      try {
        const err = new Error();
        if (!err.stack) return undefined;
        // keep only the top-most app frame lines to avoid huge output
        const lines = err.stack
          .split("\n")
          .slice(2, 8)
          .map((l) => l.trim());
        return lines.join(" | ");
      } catch {
        return undefined;
      }
    };

    // dedupe repeated warnings so console isn't flooded
    const seen = new Set();

    const normalizeTarget = (t) => {
      if (typeof t === "string") return t;
      if (t && typeof t === "object") {
        if (typeof t.href === "string") return `obj[href:${t.href}]`;
        if (typeof t.pathname === "string") return `obj[path:${t.pathname}]`;
        // fallback to object shape
        try {
          return `obj[keys:${Object.keys(t).join(",")}]`;
        } catch {
          return "obj[unknown]";
        }
      }
      return String(t);
    };

    const wrap = (orig, name) => {
      return function (target, ...rest) {
        try {
          // If target is an object with { pathname, params } or similar, allow.
          if (target === undefined || target === null) {
            const stack = getCallerStack();
            const key = `${name}:undefined:${stack}`;
            if (!seen.has(key)) {
              // eslint-disable-next-line no-console
              console.warn(
                `[patchRouter] blocked navigation call to ${name} with invalid target (undefined/null).`,
                { rest, stack }
              );
              seen.add(key);
            }
            return;
          }

          // Accept strings or objects (some router APIs accept location objects)
          if (typeof target !== "string" && typeof target !== "object") {
            const stack = getCallerStack();
            const key = `${name}:badtype:${typeof target}:${stack}`;
            if (!seen.has(key)) {
              // eslint-disable-next-line no-console
              console.warn(
                `[patchRouter] blocked navigation call to ${name} with non-string/object target:`,
                typeof target,
                { target, rest, stack }
              );
              seen.add(key);
            }
            return;
          }

          // If object target but missing href/pathname, warn as this often causes convertRedirect to return undefined
          if (typeof target === "object") {
            const hasHref =
              typeof target.href === "string" && target.href.length > 0;
            const hasPath =
              typeof target.pathname === "string" && target.pathname.length > 0;
            if (!hasHref && !hasPath) {
              const stack = getCallerStack();
              const key = `${name}:objmissing:${normalizeTarget(
                target
              )}:${stack}`;
              if (!seen.has(key)) {
                // eslint-disable-next-line no-console
                console.warn(
                  `[patchRouter] navigation object missing href/pathname for ${name}. This can produce undefined hrefs downstream.`,
                  { target, rest, stack }
                );
                seen.add(key);
              }
              // still allow the call to proceed in case router accepts this shape, but log for debugging
            }
          }

          return orig.call(this, target, ...rest);
        } catch (e) {
          // Catch and log to avoid crashing the bundler/runtime.
          // eslint-disable-next-line no-console
          console.error("[patchRouter] navigation wrapper caught error", e);
        }
      };
    };

    for (const name of methodsToWrap) {
      if (typeof router[name] === "function") {
        const orig = router[name];
        router[name] = wrap(orig, name);
      }
    }

    // mark as patched so the module is idempotent
    router.__patchedForUndefinedGuard = true;

    // expose a small dev-only checker so other modules can validate targets
    // Usage: global.__patchRouterCheckTarget(target, callerName)
    try {
      global.__patchRouterCheckTarget = (target, caller = "unknown") => {
        if (process.env.NODE_ENV === "production") return true;
        if (target === undefined || target === null) return false;
        if (typeof target === "string") return true;
        if (typeof target === "object") {
          if (
            typeof target.href === "string" ||
            typeof target.pathname === "string"
          )
            return true;
          return false;
        }
        return false;
      };
    } catch (e) {
      // ignore
    }
  }
} catch (err) {
  // eslint-disable-next-line no-console
  console.error("[patchRouter] failed to patch router:", err?.message || err);
}

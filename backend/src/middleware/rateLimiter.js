import ratelimit from "../config/upstash.js";

// Rate limiter middleware. In production we apply Upstash limits globally,
// but allow requests that present an authenticated header (Authorization or
// x-user-id) to bypass the IP based limit to avoid rate limiting legitimate
// app clients (for example Expo Go / mobile apps). This keeps prod safety in
// place for anonymous endpoints while preventing spurious 429s for auth'd
// clients. If you want stricter behavior, remove the header bypass.
const rateLimiter = async (req, res, next) => {
  try {
    // Bypass the IP-based rate limit for authenticated requests. We treat
    // presence of an Authorization header or an x-user-id header as a signal
    // that the client is a real user agent and should not be subject to the
    // same anonymous throttling.
    const hasAuthHeader = !!(
      req.headers["authorization"] ||
      req.headers["x-user-id"] ||
      req.headers["x-dev-user-id"]
    );
    if (hasAuthHeader) {
      return next();
    }

    const { success, limit, reset } = await ratelimit.limit(req.ip);
    if (!success) {
      // Inform clients how long to wait before retrying when possible.
      // Upstash may provide a `reset` timestamp or seconds; fall back to 10s.
      const retryAfterSeconds = (reset && Number(reset)) || 10;
      res.setHeader("Retry-After", String(retryAfterSeconds));
      return res
        .status(429)
        .json({ error: "Too many requests, please try again later." });
    }
    next();
  } catch (error) {
    console.error("Rate limiter error:", error);
    // If the rate limiter service itself fails, allow the request through to
    // avoid blocking all traffic (fail open). Log the error for investigation.
    next();
  }
};

export default rateLimiter;

export function wrapError(context, err) {
  const message =
    err && err.message
      ? `${context}: ${err.message}`
      : `${context}: ${String(err)}`;
  // Create a new Error inside this file so the stack includes this filepath.
  const e = new Error(message);
  // Attach original error for inspection
  try {
    e.original = err;
  } catch {}
  return e;
}

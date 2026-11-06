/**
 * Which API routes the browser may reach through /api/bff.
 * The login, verify-email, refresh and logout endpoints are deliberately NOT here: they return or take
 * tokens (verify-email signs the person in), and tokens must never be visible to JavaScript.
 * They have their own handlers.
 */
const PUBLIC_AUTH_ACTIONS = new Set([
  "register",
  "email-status",
  "resend-verification",
  "forgot-password",
  "reset-password",
]);

const ALLOWED_ROOTS = new Set(["me", "merchants", "merchant", "admin", "offers", "reservations"]);

const SEGMENT = /^[A-Za-z0-9_-]+$/;

/** Returns the API path for the URL segments after /api/bff, or null if the route is not allowed. */
export function resolveBackendPath(segments: string[]): string | null {
  if (segments.length === 0 || !segments.every((segment) => SEGMENT.test(segment))) return null;
  const [root, action] = segments;
  if (root === "auth") {
    return segments.length === 2 && PUBLIC_AUTH_ACTIONS.has(action) ? `/api/v1/auth/${action}` : null;
  }
  return ALLOWED_ROOTS.has(root) ? `/api/v1/${segments.join("/")}` : null;
}

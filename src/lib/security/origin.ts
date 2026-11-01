/**
 * CSRF protection for the cookie-based web session.
 * A browser always sends the Origin header on a POST/PUT/PATCH/DELETE. We accept the request only if
 * it comes from our own address. If there is no Origin, Sec-Fetch-Site must say "same-origin".
 * Anything else (another site, a missing header) is refused. SameSite=Lax cookies are a second defence.
 */
export function isTrustedMutation(headers: Headers, appOrigin: string): boolean {
  const origin = headers.get("origin");
  if (origin !== null) return origin === appOrigin;
  return headers.get("sec-fetch-site") === "same-origin";
}

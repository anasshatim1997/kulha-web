export function securityHeaders(environment: string, protocol: string, pathname: string): Record<string, string> {
  const development = environment !== "production";
  const scriptPolicy = development ? "'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com" : "'self' 'unsafe-inline' https://accounts.google.com";
  const connectPolicy = ["'self'", "https://accounts.google.com", "https://oauth2.googleapis.com", "https://nominatim.openstreetmap.org", ...(development ? ["ws:"] : [])].join(" ");
  const headers: Record<string, string> = {
    "Content-Security-Policy": `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://accounts.google.com; img-src 'self' data: blob: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src ${scriptPolicy}; connect-src ${connectPolicy}; worker-src 'self'; frame-src https://accounts.google.com`,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": /\/(?:verify-email|reset-password)(?:\/|$)/.test(pathname) ? "no-referrer" : "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  };
  if (environment === "production" && protocol === "https:") headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  if (/\/(?:verify-email|reset-password)(?:\/|$)/.test(pathname)) headers["Cache-Control"] = "no-store, max-age=0";
  return headers;
}

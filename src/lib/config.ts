/**
 * Server-side settings, read when needed so tests can change them.
 * API_BASE_URL: where the Spring Boot API listens. APP_ORIGIN: the public address of this web app
 * (used to check that mutating requests really come from our own pages).
 */
export function getConfig() {
  return {
    apiBaseUrl: (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, ""),
    appOrigin: (process.env.APP_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, ""),
    bffSharedSecret: process.env.KULHA_BFF_SHARED_SECRET ?? "",
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? `${(process.env.APP_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, "")}/api/auth/google/callback`,
    secureCookies: process.env.NODE_ENV === "production",
  };
}

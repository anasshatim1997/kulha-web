/**
 * Server-side settings, read when needed so tests can change them.
 * API_BASE_URL: where the Spring Boot API listens. APP_ORIGIN: the public address of this web app
 * (used to check that mutating requests really come from our own pages).
 */
export function getConfig() {
  return {
    apiBaseUrl: (process.env.API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, ""),
    appOrigin: (process.env.APP_ORIGIN ?? "http://localhost:3000").replace(/\/+$/, ""),
    secureCookies: process.env.NODE_ENV === "production",
    googleOAuthAuthorizationPath: (() => {
      const configured = process.env.GOOGLE_OAUTH2_AUTHORIZATION_PATH ?? "/oauth2/authorization/google";
      return configured.startsWith("/") && !configured.startsWith("//") && !configured.includes("\\")
        ? configured
        : "/oauth2/authorization/google";
    })(),
  };
}

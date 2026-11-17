import { describe, expect, it } from "vitest";
import { securityHeaders } from "@/lib/security/headers";

describe("security response headers", () => {
  it("sets the core browser security policies", () => {
    const headers = securityHeaders("production", "https:", "/offers");
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["Content-Security-Policy"]).toContain("worker-src 'self'");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
  });

  it("prevents token-page referrer and caching", () => {
    const headers = securityHeaders("production", "https:", "/reset-password");
    expect(headers["Referrer-Policy"]).toBe("no-referrer");
    expect(headers["Cache-Control"]).toBe("no-store, max-age=0");
  });

  it("does not set HSTS outside production HTTPS", () => {
    expect(securityHeaders("development", "http:", "/offers")["Strict-Transport-Security"]).toBeUndefined();
  });
});

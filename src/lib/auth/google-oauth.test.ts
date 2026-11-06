import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { createOAuthState, readOAuthState } from "./google-oauth";

afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("Google OAuth transient state", () => {
  it("signs the state cookie and derives an S256 PKCE challenge", () => {
    vi.stubEnv("GOOGLE_OAUTH_STATE_SECRET", "test-only-long-secret");
    const result = createOAuthState("/account/orders");
    expect(readOAuthState(result.cookie)).toEqual(result.state);
    expect(result.challenge).toBe(createHash("sha256").update(result.state.verifier).digest("base64url"));
  });

  it("rejects a tampered state cookie", () => {
    vi.stubEnv("GOOGLE_OAUTH_STATE_SECRET", "test-only-long-secret");
    const result = createOAuthState("/account");
    expect(readOAuthState(`${result.cookie}x`)).toBeNull();
  });

  it("rejects expired state cookies", () => {
    vi.stubEnv("GOOGLE_OAUTH_STATE_SECRET", "test-only-long-secret");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-01T12:00:00Z"));
    const result = createOAuthState("/account");
    vi.setSystemTime(new Date("2026-11-01T12:11:00Z"));
    expect(readOAuthState(result.cookie)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { trustedProxyClientIp } from "./client-ip";

describe("trustedProxyClientIp", () => {
  it("accepts a single valid IPv4 or IPv6 address from X-Real-IP", () => {
    expect(trustedProxyClientIp(new Headers({ "x-real-ip": "203.0.113.7" }))).toBe("203.0.113.7");
    expect(trustedProxyClientIp(new Headers({ "x-real-ip": "2001:db8::7" }))).toBe("2001:db8::7");
  });

  it("ignores missing, malformed, and comma-separated values", () => {
    expect(trustedProxyClientIp(new Headers())).toBeUndefined();
    expect(trustedProxyClientIp(new Headers({ "x-real-ip": "attacker.example" }))).toBeUndefined();
    expect(trustedProxyClientIp(new Headers({ "x-real-ip": "203.0.113.7, 198.51.100.2" }))).toBeUndefined();
  });
});

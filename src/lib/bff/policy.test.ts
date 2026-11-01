import { describe, expect, it } from "vitest";
import { resolveBackendPath } from "./policy";

describe("resolveBackendPath", () => {
  it("maps allowed routes to the API", () => {
    expect(resolveBackendPath(["me"])).toBe("/api/v1/me");
    expect(resolveBackendPath(["merchants", "me"])).toBe("/api/v1/merchants/me");
    expect(resolveBackendPath(["admin", "merchants"])).toBe("/api/v1/admin/merchants");
    expect(resolveBackendPath(["admin", "merchants", "7a0d9a2a-a968-4320-910d-61483becfcde", "approve"])).toBe(
      "/api/v1/admin/merchants/7a0d9a2a-a968-4320-910d-61483becfcde/approve",
    );
  });

  it("allows the public auth actions", () => {
    for (const action of ["register", "verify-email", "resend-verification", "forgot-password", "reset-password"]) {
      expect(resolveBackendPath(["auth", action])).toBe(`/api/v1/auth/${action}`);
    }
  });

  it("never exposes the endpoints that carry tokens", () => {
    expect(resolveBackendPath(["auth", "login"])).toBeNull();
    expect(resolveBackendPath(["auth", "refresh"])).toBeNull();
    expect(resolveBackendPath(["auth", "logout"])).toBeNull();
  });

  it("refuses unknown roots and nested auth paths", () => {
    expect(resolveBackendPath(["actuator", "health"])).toBeNull();
    expect(resolveBackendPath(["auth"])).toBeNull();
    expect(resolveBackendPath(["auth", "register", "extra"])).toBeNull();
    expect(resolveBackendPath([])).toBeNull();
  });

  it("refuses path traversal and odd characters", () => {
    expect(resolveBackendPath(["me", ".."])).toBeNull();
    expect(resolveBackendPath(["admin", "..", "actuator"])).toBeNull();
    expect(resolveBackendPath(["me", "a/b"])).toBeNull();
    expect(resolveBackendPath(["me", "a%2Fb"])).toBeNull();
    expect(resolveBackendPath(["me", ""])).toBeNull();
  });
});

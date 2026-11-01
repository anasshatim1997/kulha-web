import { describe, expect, it } from "vitest";
import { ApiError } from "./client";
import { describeError } from "./errors";

describe("describeError", () => {
  it("explains a network failure", () => {
    expect(describeError(new ApiError(0, "Network error"))).toContain("joindre le serveur");
  });

  it("uses the override for a given status, such as a wrong password on login", () => {
    expect(describeError(new ApiError(401, "Authentication failed"), { 401: "Mot de passe incorrect." })).toBe(
      "Mot de passe incorrect.",
    );
  });

  it("turns Retry-After into minutes", () => {
    expect(describeError(new ApiError(429, "Too many", undefined, 30))).toBe("Trop de tentatives. Réessayez dans une minute.");
    expect(describeError(new ApiError(429, "Too many", undefined, 600))).toBe("Trop de tentatives. Réessayez dans 10 minutes.");
    expect(describeError(new ApiError(429, "Too many"))).toBe("Trop de tentatives. Réessayez dans une minute.");
  });

  it("never shows the server's technical text", () => {
    expect(describeError(new ApiError(500, "Internal Server Error", "NullPointerException at Foo.java:12"))).not.toContain(
      "NullPointer",
    );
    expect(describeError(new Error("boom"))).toBe("Une erreur est survenue. Réessayez.");
  });

  it("maps the common statuses", () => {
    expect(describeError(new ApiError(400, "x"))).toContain("invalides");
    expect(describeError(new ApiError(403, "x"))).toContain("pas accès");
    expect(describeError(new ApiError(404, "x"))).toContain("introuvable");
    expect(describeError(new ApiError(409, "x"))).toContain("pas possible");
    expect(describeError(new ApiError(502, "x"))).toContain("indisponible");
  });
});

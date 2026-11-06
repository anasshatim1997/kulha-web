import { describe, expect, it } from "vitest";
import { getPasswordStrength, isGoodPassword } from "./password-strength";

describe("password strength", () => {
  it("accepts Good without requiring Excellent", () => {
    const strength = getPasswordStrength("GoodPass1!");

    expect(strength.good).toBe(true);
    expect(strength.excellent).toBe(false);
    expect(strength.score).toBe(4);
    expect(isGoodPassword("GoodPass1!")).toBe(true);
  });

  it("marks a 14-character password with the required character groups as Excellent", () => {
    const strength = getPasswordStrength("GoodPassword1!");

    expect(strength.good).toBe(true);
    expect(strength.excellent).toBe(true);
    expect(strength.score).toBe(5);
  });

  it("does not call a long password Good when a required character group is missing", () => {
    const strength = getPasswordStrength("GoodPassword123");

    expect(strength.good).toBe(false);
    expect(strength.excellent).toBe(false);
    expect(strength.score).toBeLessThan(4);
  });

  it("rejects passwords shorter than 10 characters or longer than 128 characters", () => {
    expect(isGoodPassword("Good1!")).toBe(false);
    expect(isGoodPassword(`${"A".repeat(126)}1!`)).toBe(false);
  });
});

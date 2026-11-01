import { describe, expect, it } from "vitest";
import { parseTokens } from "./tokens";

describe("parseTokens", () => {
  it("accepts a complete token response", () => {
    expect(parseTokens({ accessToken: "a", refreshToken: "r", tokenType: "Bearer", expiresIn: 600 })).toEqual({
      accessToken: "a",
      refreshToken: "r",
      expiresIn: 600,
    });
  });

  it("refuses anything incomplete or malformed", () => {
    expect(parseTokens(null)).toBeNull();
    expect(parseTokens("text")).toBeNull();
    expect(parseTokens({})).toBeNull();
    expect(parseTokens({ accessToken: "a", refreshToken: "", expiresIn: 600 })).toBeNull();
    expect(parseTokens({ accessToken: "a", refreshToken: "r", expiresIn: "600" })).toBeNull();
    expect(parseTokens({ accessToken: "a", refreshToken: "r", expiresIn: 0 })).toBeNull();
  });
});

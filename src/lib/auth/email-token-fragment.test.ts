import { describe, expect, it } from "vitest";
import { parseEmailTokenFragment } from "./use-email-token-fragment";

describe("parseEmailTokenFragment", () => {
  it("reads a one-time token from a URL fragment", () => {
    expect(parseEmailTokenFragment("#token=Abcdefghijklmnopqrstuvwxyz_0123456789-"))
      .toBe("Abcdefghijklmnopqrstuvwxyz_0123456789-");
  });

  it("does not accept a token in the query string", () => {
    expect(parseEmailTokenFragment("")).toBeNull();
    expect(parseEmailTokenFragment("?token=Abcdefghijklmnopqrstuvwxyz_0123456789-")).toBeNull();
  });

  it("rejects missing, short or malformed tokens", () => {
    expect(parseEmailTokenFragment("#next=%2Fmerchant%2Fapply")).toBeNull();
    expect(parseEmailTokenFragment("#token=short")).toBeNull();
    expect(parseEmailTokenFragment("#token=bad.token.value.with.dots.long-enough-1234567890")).toBeNull();
  });
});

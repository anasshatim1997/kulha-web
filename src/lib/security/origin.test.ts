import { describe, expect, it } from "vitest";
import { isTrustedMutation } from "./origin";

const APP = "http://localhost:3000";

describe("isTrustedMutation", () => {
  it("accepts our own origin", () => {
    expect(isTrustedMutation(new Headers({ origin: APP }), APP)).toBe(true);
  });

  it("refuses another site", () => {
    expect(isTrustedMutation(new Headers({ origin: "https://evil.example" }), APP)).toBe(false);
  });

  it("refuses a look-alike origin", () => {
    expect(isTrustedMutation(new Headers({ origin: "http://localhost:3000.evil.example" }), APP)).toBe(false);
    expect(isTrustedMutation(new Headers({ origin: "http://localhost:3001" }), APP)).toBe(false);
  });

  it("refuses the opaque 'null' origin", () => {
    expect(isTrustedMutation(new Headers({ origin: "null" }), APP)).toBe(false);
  });

  it("without Origin, accepts only Sec-Fetch-Site same-origin", () => {
    expect(isTrustedMutation(new Headers({ "sec-fetch-site": "same-origin" }), APP)).toBe(true);
    expect(isTrustedMutation(new Headers({ "sec-fetch-site": "cross-site" }), APP)).toBe(false);
    expect(isTrustedMutation(new Headers({ "sec-fetch-site": "same-site" }), APP)).toBe(false);
  });

  it("refuses a request with neither header", () => {
    expect(isTrustedMutation(new Headers(), APP)).toBe(false);
  });
});

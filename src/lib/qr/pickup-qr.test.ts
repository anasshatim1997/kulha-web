import { describe, expect, it } from "vitest";
import { encodePickupQr, pickupQrPath } from "@/lib/qr/pickup-qr";

describe("pickup QR credential rendering", () => {
  it("creates a deterministic version-4 QR matrix for the opaque API token", () => {
    const payload = "KULHA1:" + "a".repeat(43);
    const first = encodePickupQr(payload);
    const second = encodePickupQr(payload);
    expect(first).toHaveLength(33);
    expect(first.every((row) => row.length === 33)).toBe(true);
    expect(first.flat().some(Boolean)).toBe(true);
    expect(pickupQrPath(first)).toBe(pickupQrPath(second));
  });

  it("rejects credentials that exceed the supported QR payload capacity", () => {
    expect(() => encodePickupQr("KULHA1:" + "x".repeat(80))).toThrow();
  });
});

import { describe, expect, it, vi } from "vitest";
import { idempotencyEntry } from "@/lib/offers/idempotency";

describe("idempotencyEntry", () => {
  it("reuses the key for an identical payload fingerprint", () => {
    const previous = { fingerprint: "same-payload", key: "key-one" };
    const createKey = vi.fn(() => "key-two");
    expect(idempotencyEntry("same-payload", previous, createKey)).toBe(previous);
    expect(createKey).not.toHaveBeenCalled();
  });

  it("creates a new key when the payload changes", () => {
    const previous = { fingerprint: "old-payload", key: "key-one" };
    const createKey = vi.fn(() => "key-two");
    expect(idempotencyEntry("new-payload", previous, createKey)).toEqual({
      fingerprint: "new-payload",
      key: "key-two",
    });
    expect(createKey).toHaveBeenCalledOnce();
  });

  it("creates a key for the first request", () => {
    expect(idempotencyEntry("payload", null, () => "first-key")).toEqual({
      fingerprint: "payload",
      key: "first-key",
    });
  });
});

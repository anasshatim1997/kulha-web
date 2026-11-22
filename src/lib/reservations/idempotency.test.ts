import { describe, expect, it } from "vitest";
import { clearReservationAttempt, getOrCreateReservationAttempt } from "./idempotency";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, String(value)); },
  } as Storage;
}

describe("reservation idempotency attempt", () => {
  it("reuses the same key for a retry with an identical request fingerprint", () => {
    const storage = memoryStorage();
    let generated = 0;
    const createKey = () => "key-" + ++generated;

    const first = getOrCreateReservationAttempt(storage, "offer-1", "fingerprint-a", createKey);
    const retry = getOrCreateReservationAttempt(storage, "offer-1", "fingerprint-a", createKey);

    expect(first).toEqual({ fingerprint: "fingerprint-a", key: "key-1" });
    expect(retry).toEqual(first);
    expect(generated).toBe(1);
  });

  it("rotates the key when quantity or pickup window changes the fingerprint", () => {
    const storage = memoryStorage();
    let generated = 0;
    const createKey = () => "key-" + ++generated;

    const first = getOrCreateReservationAttempt(storage, "offer-1", "quantity-1", createKey);
    const changed = getOrCreateReservationAttempt(storage, "offer-1", "quantity-2", createKey);

    expect(changed.key).not.toBe(first.key);
    expect(changed.fingerprint).toBe("quantity-2");
    expect(generated).toBe(2);
  });

  it("recovers from malformed session storage and clears a completed attempt", () => {
    const storage = memoryStorage();
    storage.setItem("kulha:reservation-idempotency:offer-1", "{bad json");

    const attempt = getOrCreateReservationAttempt(storage, "offer-1", "fingerprint", () => "fresh-key");

    expect(attempt.key).toBe("fresh-key");
    clearReservationAttempt(storage, "offer-1");
    expect(storage.getItem("kulha:reservation-idempotency:offer-1")).toBeNull();
  });
});

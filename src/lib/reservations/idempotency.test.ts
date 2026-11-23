import { describe, expect, it } from "vitest";
import { clearReservationAttempt, getOrCreateReservationAttempt } from "./idempotency";

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => { values.delete(key); },
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
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

  it("reuses the same attempt after a quota error on storage writes", () => {
    const quotaStorage = {
      getItem: () => null,
      setItem: () => { throw new Error("quota exceeded"); },
      removeItem: () => undefined,
    };
    let generated = 0;
    const createKey = () => "quota-key-" + ++generated;
    const first = getOrCreateReservationAttempt(quotaStorage, "offer-2", "same-request", createKey);
    const retry = getOrCreateReservationAttempt(quotaStorage, "offer-2", "same-request", createKey, first);

    expect(retry).toEqual(first);
    expect(generated).toBe(1);
  });

  it("reuses an in-memory attempt when accessing session storage itself is unavailable", () => {
    let generated = 0;
    const createKey = () => "no-storage-key-" + ++generated;
    const first = getOrCreateReservationAttempt(null, "offer-3", "same-request", createKey);
    const retry = getOrCreateReservationAttempt(null, "offer-3", "same-request", createKey, first);

    expect(retry).toEqual(first);
    expect(generated).toBe(1);
  });

  it("continues checkout when session storage cannot persist a new attempt", () => {
    const unavailableStorage = {
      getItem: () => { throw new Error("storage disabled"); },
      setItem: () => { throw new Error("storage quota exceeded"); },
      removeItem: () => { throw new Error("storage disabled"); },
    };

    let generated = 0;
    const createKey = () => "memory-key-" + ++generated;
    const first = getOrCreateReservationAttempt(unavailableStorage, "offer-1", "fingerprint", createKey);
    const retry = getOrCreateReservationAttempt(unavailableStorage, "offer-1", "fingerprint", createKey, first);

    expect(first).toEqual({ fingerprint: "fingerprint", key: "memory-key-1" });
    expect(retry).toEqual(first);
    expect(generated).toBe(1);
  });

});

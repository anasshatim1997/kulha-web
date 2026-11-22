export type ReservationAttempt = { fingerprint: string; key: string };

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function storageKey(offerId: string): string {
  return "kulha:reservation-idempotency:" + offerId;
}

export function getOrCreateReservationAttempt(
  storage: StorageLike,
  offerId: string,
  fingerprint: string,
  createKey: () => string = () => crypto.randomUUID(),
): ReservationAttempt {
  const key = storageKey(offerId);
  try {
    const raw = storage.getItem(key);
    if (raw) {
      const saved: unknown = JSON.parse(raw);
      if (typeof saved === "object" && saved !== null) {
        const attempt = saved as Partial<ReservationAttempt>;
        if (attempt.fingerprint === fingerprint && typeof attempt.key === "string" && attempt.key.length > 0) {
          return { fingerprint, key: attempt.key };
        }
      }
    }
  } catch {
    // A malformed or unavailable session entry must not block checkout.
  }

  const attempt = { fingerprint, key: createKey() };
  try {
    storage.setItem(key, JSON.stringify(attempt));
  } catch {
    // Storage may be disabled or full. Continue this checkout attempt in memory.
  }
  return attempt;
}

export function clearReservationAttempt(storage: StorageLike, offerId: string): void {
  storage.removeItem(storageKey(offerId));
}

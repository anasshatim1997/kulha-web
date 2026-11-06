export type IdempotencyEntry = { fingerprint: string; key: string };

export function idempotencyEntry(
  fingerprint: string,
  previous: IdempotencyEntry | null,
  createKey: () => string = () => crypto.randomUUID(),
): IdempotencyEntry {
  if (previous?.fingerprint === fingerprint) return previous;
  return { fingerprint, key: createKey() };
}

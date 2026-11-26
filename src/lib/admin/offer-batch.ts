export const MAX_OFFER_BATCH_SIZE = 20;

export function toggleBatchSelection<T extends { id: string }>(
  current: Record<string, T>,
  item: T,
  limit = MAX_OFFER_BATCH_SIZE,
): Record<string, T> {
  if (current[item.id]) {
    const next = { ...current };
    delete next[item.id];
    return next;
  }
  if (Object.keys(current).length >= limit) return current;
  return { ...current, [item.id]: item };
}

export function eligibleOfferBatchItems<T extends { status: string }>(
  items: T[],
  action: "suspend" | "request-edit" | "reinstate",
): T[] {
  return action === "reinstate" ? items.filter(item => item.status === "SUSPENDED") : items;
}

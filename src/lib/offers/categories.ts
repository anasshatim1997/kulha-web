export const API_OFFER_CATEGORIES = [
  "BREAD_PASTRY",
  "PREPARED_MEALS",
  "GROCERIES",
  "FRUIT_VEG",
  "DRINKS",
  "SURPRISE_BASKET",
  "OTHER",
] as const;

export type ApiOfferCategory = (typeof API_OFFER_CATEGORIES)[number];

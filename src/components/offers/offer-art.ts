export type OfferArt = { image?: string; glyph: string; className: string };

export const offerArt: Record<string, OfferArt> = {
  BREAD_PASTRY: { image: "/kulha-loader/baguette.webp", glyph: "🥐", className: "is-bakery" },
  PREPARED_MEALS: { glyph: "🍲", className: "is-meals" },
  GROCERIES: { image: "/kulha-loader/greens-front.webp", glyph: "🛍️", className: "is-grocery" },
  FRUIT_VEG: { image: "/kulha-loader/tomato.webp", glyph: "🥬", className: "is-produce" },
  DRINKS: { glyph: "🧃", className: "is-drinks" },
  SURPRISE_BASKET: { glyph: "🧺", className: "is-surprise" },
  OTHER: { image: "/kulha-loader/leaf.webp", glyph: "✳", className: "is-other" },
};

export function getOfferArt(category: string): OfferArt {
  return offerArt[category] ?? offerArt.OTHER;
}

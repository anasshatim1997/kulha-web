export type OfferDraftInput = {
  title: string;
  description: string;
  price: string;
  originalPrice: string;
  quantity: string;
};

export type OfferDraftError = "required" | "invalidPrice" | "invalidOriginalPrice" | "originalPriceBelowPrice" | "invalidQuantity";

export function validateOfferDraft(input: OfferDraftInput): Partial<Record<keyof OfferDraftInput, OfferDraftError>> {
  const errors: Partial<Record<keyof OfferDraftInput, OfferDraftError>> = {};
  if (!input.title.trim() || input.title.length > 120) errors.title = "required";
  if (!input.description.trim() || input.description.length > 1000) errors.description = "required";

  const moneyPattern = /^\d{1,4}(?:\.\d{1,2})?$/;
  const price = moneyPattern.test(input.price) ? Number(input.price) : Number.NaN;
  if (!Number.isFinite(price) || price < 1 || price > 2000) errors.price = "invalidPrice";

  if (input.originalPrice.trim()) {
    const originalPrice = moneyPattern.test(input.originalPrice) ? Number(input.originalPrice) : Number.NaN;
    if (!Number.isFinite(originalPrice) || originalPrice < 1 || originalPrice > 2000) {
      errors.originalPrice = "invalidOriginalPrice";
    } else if (Number.isFinite(price) && originalPrice < price) {
      errors.originalPrice = "originalPriceBelowPrice";
    }
  }

  if (!/^\d+$/.test(input.quantity) || Number(input.quantity) < 1 || Number(input.quantity) > 500) {
    errors.quantity = "invalidQuantity";
  }
  return errors;
}

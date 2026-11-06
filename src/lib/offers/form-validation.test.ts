import { describe, expect, it } from "vitest";
import { validateOfferDraft } from "@/lib/offers/form-validation";

describe("validateOfferDraft", () => {
  it("accepts a valid MAD offer draft", () => {
    expect(validateOfferDraft({
      title: "Fresh bread",
      description: "End-of-day bread basket",
      price: "12.50",
      originalPrice: "20.00",
      quantity: "4",
    })).toEqual({});
  });

  it("requires nonblank title and description", () => {
    expect(validateOfferDraft({ title: "   ", description: "", price: "1.00", originalPrice: "", quantity: "1" })).toEqual({
      title: "required",
      description: "required",
    });
  });

  it("rejects price outside the supported MAD range or with more than two decimals", () => {
    expect(validateOfferDraft({ title: "A", description: "B", price: "0.99", originalPrice: "", quantity: "1" }).price).toBe("invalidPrice");
    expect(validateOfferDraft({ title: "A", description: "B", price: "1.001", originalPrice: "", quantity: "1" }).price).toBe("invalidPrice");
    expect(validateOfferDraft({ title: "A", description: "B", price: "2000.01", originalPrice: "", quantity: "1" }).price).toBe("invalidPrice");
  });

  it("requires an original price to be valid and at least the offer price", () => {
    expect(validateOfferDraft({ title: "A", description: "B", price: "10.00", originalPrice: "9.99", quantity: "1" }).originalPrice).toBe("originalPriceBelowPrice");
    expect(validateOfferDraft({ title: "A", description: "B", price: "10.00", originalPrice: "bad", quantity: "1" }).originalPrice).toBe("invalidOriginalPrice");
  });

  it("requires an integer quantity from 1 through 500", () => {
    expect(validateOfferDraft({ title: "A", description: "B", price: "1", originalPrice: "", quantity: "1.5" }).quantity).toBe("invalidQuantity");
    expect(validateOfferDraft({ title: "A", description: "B", price: "1", originalPrice: "", quantity: "501" }).quantity).toBe("invalidQuantity");
  });
});

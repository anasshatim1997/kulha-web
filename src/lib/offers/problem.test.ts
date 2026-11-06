import { describe, expect, it } from "vitest";
import { parseOfferProblem } from "@/lib/offers/problem";

describe("parseOfferProblem", () => {
  it("keeps field errors from RFC 9457 Problem Details extensions", () => {
    expect(parseOfferProblem({
      title: "Unprocessable entity",
      detail: "One or more offer fields are invalid.",
      fieldErrors: { pickupStart: "Must be in the future", ignored: 12 },
    })).toEqual({
      detail: "One or more offer fields are invalid.",
      fieldErrors: { pickupStart: "Must be in the future" },
    });
  });

  it("handles a problem with only a detail", () => {
    expect(parseOfferProblem({ detail: "Offer is suspended" })).toEqual({
      detail: "Offer is suspended",
      fieldErrors: {},
    });
  });

  it("handles invalid JSON values safely", () => {
    expect(parseOfferProblem(null)).toEqual({ fieldErrors: {} });
    expect(parseOfferProblem("bad response")).toEqual({ fieldErrors: {} });
  });
});

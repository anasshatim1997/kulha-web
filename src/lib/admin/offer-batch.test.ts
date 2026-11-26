import { describe, expect, it } from "vitest";
import { eligibleOfferBatchItems, MAX_OFFER_BATCH_SIZE, toggleBatchSelection } from "./offer-batch";

describe("offer batch selection", () => {
  it("keeps selections when an item is toggled off", () => {
    const first = { id: "a", status: "PUBLISHED" };
    const second = { id: "b", status: "SUSPENDED" };
    const selected = toggleBatchSelection(toggleBatchSelection({}, first), second);
    expect(toggleBatchSelection(selected, first)).toEqual({ b: second });
  });

  it("does not exceed the configured batch limit", () => {
    const selected = Array.from({ length: MAX_OFFER_BATCH_SIZE }, (_, index) => ({ id: String(index), status: "PUBLISHED" }))
      .reduce((current, item) => toggleBatchSelection(current, item), {} as Record<string, { id: string; status: string }>);
    expect(Object.keys(toggleBatchSelection(selected, { id: "overflow", status: "PUBLISHED" }))).toHaveLength(MAX_OFFER_BATCH_SIZE);
  });

  it("allows only suspended offers to be reinstated", () => {
    const items = [{ id: "live", status: "PUBLISHED" }, { id: "hidden", status: "SUSPENDED" }];
    expect(eligibleOfferBatchItems(items, "reinstate")).toEqual([items[1]]);
    expect(eligibleOfferBatchItems(items, "suspend")).toEqual(items);
  });
});

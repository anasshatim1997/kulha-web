import { describe, expect, it } from "vitest";
import { searchFromParams } from "@/lib/offers/search-params";
import { casablancaLocalToUtc } from "@/lib/time/casablanca";

describe("public offer URL filters", () => {
  it("maps URL search parameters to the API query model", () => {
    expect(searchFromParams({ q: "msemen", category: "BREAD_PASTRY", city: "Casablanca", page: "2", size: "20", sort: "price" })).toEqual({
      q: "msemen", category: "BREAD_PASTRY", city: "Casablanca", page: "2", size: "20", sort: "price",
    });
  });

  it("does not assume a city before the visitor shares their location", () => {
    expect(searchFromParams({}).city).toBeUndefined();
  });

  it("keeps checkbox false when unchecked and true when selected", () => {
    expect(searchFromParams({ availableOnly: "false" }).availableOnly).toBe("false");
    expect(searchFromParams({ availableOnly: ["false", "true"] }).availableOnly).toBe("true");
  });

  it("keeps the first repeated scalar filter value", () => {
    expect(searchFromParams({ district: ["Maarif", "Gauthier"] }).district).toBe("Maarif");
  });

  it("normalizes common Casablanca and Maarif aliases to the configured filter values", () => {
    expect(searchFromParams({ city: "Casa", district: "Ma3rif" })).toMatchObject({ city: "Casablanca", district: "Maarif" });
    expect(searchFromParams({ city: "الدار البيضاء", district: "المعاريف" })).toMatchObject({ city: "Casablanca", district: "Maarif" });
  });

  it("keeps legacy duplicate availability query parameters compatible", () => {
    expect(searchFromParams({ availableOnly: ["false", "true"] }).availableOnly).toBe("true");
    expect(searchFromParams({ availableOnly: ["false"] }).availableOnly).toBe("false");
  });

  it("normalizes custom local pickup fields from native GET forms to UTC", () => {
    const localFrom = "2026-11-10T18:30";
    const localTo = "2026-11-10T20:00";
    expect(searchFromParams({ pickupFromLocal: localFrom, pickupToLocal: localTo })).toMatchObject({
      pickupFrom: casablancaLocalToUtc(localFrom),
      pickupTo: casablancaLocalToUtc(localTo),
    });
  });

  it("lets an empty native local field clear an older hidden UTC value", () => {
    expect(searchFromParams({ pickupFrom: "2026-11-10T17:30:00.000Z", pickupFromLocal: "" }).pickupFrom).toBeUndefined();
  });
});

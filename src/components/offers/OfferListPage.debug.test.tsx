import { describe, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferListPage } from "@/components/offers/OfferListPage";

const { listPublicOffersMock, routerPushMock } = vi.hoisted(() => ({ listPublicOffersMock: vi.fn(), routerPushMock: vi.fn() }));

vi.mock("@/lib/offers/public-api", () => ({ listPublicOffers: listPublicOffersMock }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
  usePathname: () => "/en/offers",
  useSearchParams: () => new URLSearchParams(),
}));

describe("DEBUG where the error escapes", () => {
  it("traces every call to the API mock and where the error surfaces", async () => {
    // Print a stack trace every time the mocked API is called, so we see ALL callers.
    listPublicOffersMock.mockImplementation(() => {
      console.log("MOCK CALLED FROM:\n" + new Error("trace").stack);
      return Promise.reject(new Error("private upstream error"));
    });

    let page: Awaited<ReturnType<typeof OfferListPage>>;
    try {
      page = await OfferListPage({ locale: "en", params: { q: "bread" } });
      console.log("STEP 1 OK: OfferListPage resolved");
    } catch (e) {
      console.log("STEP 1 FAILED: OfferListPage rejected with:\n" + (e as Error).stack);
      return;
    }

    console.log("mock call count after OfferListPage:", listPublicOffersMock.mock.calls.length);

    try {
      renderToStaticMarkup(page);
      console.log("STEP 2 OK: render finished without throwing");
    } catch (e) {
      console.log("STEP 2 FAILED: render threw:\n" + (e as Error).stack);
    }

    console.log("mock call count after render:", listPublicOffersMock.mock.calls.length);
  });
});

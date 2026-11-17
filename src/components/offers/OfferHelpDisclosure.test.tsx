import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { OfferHelpDisclosure } from "@/components/offers/OfferHelpDisclosure";
import { publicOfferCopy } from "@/lib/offers/public-copy";

describe("KULHA guide disclosure", () => {
  it("renders a secondary help entry with the guide behind it", () => {
    const html = renderToStaticMarkup(<OfferHelpDisclosure copy={publicOfferCopy("fr")} />);
    expect(html).toContain('class="rescue-help-disclosure rescue-help-floating"');
    expect(html).toContain('data-offers-floating-help="true"');
    expect(html).toContain("<summary");
    expect(html).toContain("Besoin d’aide ?");
    expect(html).toContain("LE GUIDE KULHA!");
    expect(html).toContain("Par où commencer ?");
    expect(html).toContain("Découvrez");
    expect(html).toContain("Vérifiez");
    expect(html).toContain("Récupérez");
    expect(html).not.toContain('<details class="rescue-help-disclosure rescue-help-floating" open');
  });

  it("keeps the help control in document flow so it cannot cover offers or the keyboard", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    const finalHelpRules = css.slice(css.lastIndexOf(".kulha-offers-help .rescue-help-disclosure.rescue-help-floating"));
    expect(finalHelpRules).toContain("position: static !important");
    expect(finalHelpRules).toContain(".kulha-offers-help .rescue-help-floating .rescue-help-panel");
    expect(finalHelpRules).toContain("max-height: min(55dvh, 55svh)");
  });

  it("localizes the help control and guide for English and Arabic", () => {
    const english = renderToStaticMarkup(<OfferHelpDisclosure copy={publicOfferCopy("en")} />);
    const arabic = renderToStaticMarkup(<OfferHelpDisclosure copy={publicOfferCopy("ar")} />);
    expect(english).toContain("Need help?");
    expect(english).toContain("YOUR KULHA! GUIDE");
    expect(arabic).toContain("هل تحتاج إلى مساعدة؟");
    expect(arabic).toContain("دليل KULHA!");
  });
});

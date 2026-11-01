# SEO, localization and RTL handoff

## Home metadata

| Locale | Title | Description | H1 |
|---|---|---|---|
| fr | Kulha! — Vos courses du marché à votre porte | Une marque marocaine de courses en ligne. Commandez auprès des commerces et marchés de proximité et recevez vos essentiels chez vous. | Le marché jusqu’à votre porte. |
| en | Kulha! — From the market to your door | A Moroccan grocery brand connecting residents with nearby shops and markets, with home delivery where available. | The market to your doorstep. |
| ary | Kulha! — من السوق حتى لباب دارك | ماركة مغربية للقضا أونلاين من الحوانت والأسواق القريبة، والتوصيل حسب المنطقة. | من السوق حتى لباب دارك. |
| ary-Latn | Kulha! — Mn sou9 7tta lbab dark | Marque maghribiya dyal l9da online mn l7wanet w l'aswa9 qrabin, w twsil 7sab zone. | Mn sou9 7tta lbab dark. |

Keep titles under 60 characters and descriptions under 155 characters after native-speaker review. These localized home variants are a starting point; each secondary route needs its own title and description before launch.

## URL and language behaviour

- `/` defaults to French; `/fr`, `/en`, `/ary`, `/ary-latn` are explicit home-language paths.
- Keep a visible manual language switcher. Do not force language based only on IP.
- Add `hreflang` alternates after the canonical domain is known. Use `fr-MA`, `en`, and the correct accepted language tags for Darija variants after an SEO specialist confirms tag support.
- Localize article slugs when translated articles are published; do not serve different languages from one ambiguous URL.
- Preserve the user’s manual choice with a first-party preference only after deciding the privacy implementation.

## RTL rules

- Arabic-script Darija is RTL; Arabizi remains LTR.
- Set `dir="rtl"` on the document for Arabic script and mirror directional UI. Keep logos and brand wordmarks visually unchanged.
- Use logical CSS properties (`margin-inline`, `padding-inline`, `inset-inline`) and avoid left/right assumptions.
- Use Latin digits for phone numbers, amounts, order IDs and dates initially; confirm with native-speaker usability testing.
- Currency display: MAD or DH, with spacing / separators tested in checkout. Do not mix MAD and DH formats within one flow.
- Morocco phone entry: +212 with a country-code control; define normalization on the backend. Do not add an OTP flow until the API supports it.
- Use locale-aware dates; determine whether the product uses Gregorian only or offers another calendar choice.
- Allow French copy to expand by about 20%; allow Arabic lines to use more generous line height and avoid hard-coded single-line button widths.

## JSON resources

`locales/fr.json`, `locales/en.json`, `locales/ary.json`, `locales/ary-latn.json` contain the starter nested keys. The home page has a richer in-app dictionary at `src/lib/i18n/site-copy.ts`. Keep both in sync as the translation system is consolidated.

## Accessibility and consent

The current cookie notice says necessary cookies only; non-essential analytics are not installed. Add a consent-management implementation before deploying any non-essential tracker. Keep the language choice keyboard accessible and announce changes to screen readers.

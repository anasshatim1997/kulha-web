# Before opening Kulha! to real customers

This ZIP is a testable front-end foundation, not a declaration that the service is operational. Complete and verify the following before public launch.

## Product and operations

- [ ] Confirm the cities, neighbourhoods and delivery boundaries.
- [ ] Confirm delivery days, windows, cut-off times and operational capacity per zone.
- [ ] Set delivery fees, minimum order, any thresholds and all customer-facing charges.
- [ ] Confirm payment methods, cash/card rules, collection timing and payment failure handling.
- [ ] Agree product selection, quality checks, substitutions, unavailable-item handling and refunds with each shop.
- [ ] Confirm customer support hours and publish official email, phone and WhatsApp details.
- [ ] Confirm the customer web experience is ready; publish app-store links only after release.
- [ ] Replace the illustrative product UI and planned features with verified product screenshots and functionality.

## Business and trust

- [ ] Confirm the legal company name, registered address and public company details.
- [ ] Replace the neutral team note only with an approved founder/team introduction.
- [ ] Add partner names or logos only after signed permission and an active relationship.
- [ ] Add ratings, testimonials, statistics and press only when real, attributable and permissioned.
- [ ] Decide whether a launch promotion exists; do not imply one until approved.

## Engineering and QA

- [ ] Install dependencies using Node.js 20.9+ and run `npm run typecheck`, `npm test` and `npm run build`.
- [ ] Set `API_BASE_URL` and `APP_ORIGIN` in `.env.local`; verify the Spring Boot API and all authentication flows end to end.
- [ ] Test registration, OTP / email verification, sign-in, recovery, expired tokens, rate limits, offline state and logout.
- [ ] Test at 320px, 360px, 390px, 768px, 1024px, 1440px and ultrawide widths.
- [ ] Test keyboard-only navigation, visible focus, screen-reader names, zoom, contrast and reduced motion.
- [ ] Verify hero video poster fallback, data usage, loading behaviour and mobile performance on a real device.
- [ ] Configure canonical URLs, localized metadata, `hreflang`, sitemap and robots rules for the chosen domain.
- [ ] Add analytics only after the consent model and event taxonomy are approved.

## Localization and legal

- [ ] Have native Moroccan Darija reviewers from the actual launch cities review Arabic script and Arabizi.
- [ ] Have Amazigh-language speakers review the name and phonetics for the relevant communities; do not infer a universal Amazigh response.
- [ ] Translate and review secondary pages and authentication messages in all launch languages.
- [ ] Validate locale tags, localized URL slugs, currency and number/date formats with an SEO/localization specialist.
- [ ] Have a qualified Moroccan lawyer review privacy, terms, delivery, refund and consumer-facing policies.
- [ ] Confirm all data collection, cookie behaviour, retention, processors and data transfers with legal counsel.

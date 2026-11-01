# KULHA! — Next.js module factory runtime recovery · 1 November 2026

- Changed the default development command to clear generated Next.js caches and run `next dev --webpack`, avoiding the Turbopack runtime implicated in the reported `Module factory is not available` error.
- Added `dev:webpack` and `clean:next` scripts.
- Changed the production build command to `next build --webpack` for a consistent bundler path while the issue is being avoided.
- Added a cross-platform Node script that deletes only `.next` and `node_modules/.cache/next`; installed packages and source files are untouched.
- Documented Windows/pnpm/npm recovery commands and hard-refresh steps.
- Confirmed the app does not register a service worker or override static Next.js chunk cache headers.

# KULHA! — hero canvas, logo visibility, and navigation spacing fix · 1 November 2026

## Hero animation and background

- Replaced the cropped foreground video, `mix-blend-mode: screen`, and radial mask with the supplied original 16:9 `hero1-split-logo-only` animation as a full-bleed hero background. This eliminates the visible rectangular video tile and the second-colour seam.
- Created a settled loop from the original source beginning after the bag wordmark has assembled, so the logo remains fully readable throughout the loop.
- Added a full-resolution poster frame for immediate display and reduced-motion fallback.
- Added a transparent static bag illustration for narrow/mobile layouts where the desktop background animation is hidden.

## Stable copy layout

- Reserved a fixed three-line desktop headline area and a larger mobile headline area so the rotating typewriter phrase cannot move the lead copy, buttons, or trust cues up and down.
- Removed arbitrary `overflow-wrap: anywhere` from the typewriter so words do not split mid-word.

## Navigation spacing

- Rebuilt the desktop navbar shell with explicit brand / navigation / actions columns, predictable gaps, and no squeezed link text.
- Moved to the mobile drawer at 1180px, before the desktop navigation becomes cramped.

## Validation

- Confirmed the new MP4 and WebM files are 1920×1080, 2.4 seconds, muted video-only assets.
- Confirmed the poster frame contains the complete, correctly coloured KULHA! wordmark.
- Source syntax, JSON, and CSS parser checks are run as part of this pass. A full Next.js build and live-browser check remain separate gates because app dependencies are not installed in this environment.

# KULHA! — Moroccan customer-trust pass · 31 October 2026

## Languages

- Reduced the active language switcher to exactly three options: Arabic (AR), French (FR), and English (EN).
- Arabic is written in Modern Standard Arabic and keeps right-to-left layout throughout the landing, information, and account copy.
- Reordered the selector AR · FR · EN to match the requested language set.
- Kept redirects from retired locale prefixes for old links; those prefixes are not exposed as language options.

## What a first-time Moroccan customer needs to know

- Added a focused "Before you reserve" trust section explaining MAD pricing, declared basket contents, stock checks, reviewed shop accounts, shop address and collection window, and payment terms.
- Added a transparent pilot-status panel. Launch neighbourhoods and participating shops are only announced after confirmation; no locations or partner names are fabricated.
- Prioritised the homepage FAQ around the product, what is visible before booking, payment, unavailable baskets, and pilot coverage.
- Clarified that food information and allergens are never guessed when the shop has not provided confirmation.
- Kept basket offers and availability conditional on what each participating shop actually publishes.

## Product and brand

- Kept KULHA! positioned as a Moroccan surplus-food marketplace: discounted baskets, online reservation, and collection at the participating shop.
- Retained the neighbourhood slogan cards, hero bag artwork and its lightweight animation, as well as the existing responsive layout.
- Avoided invented discounts, impact statistics, locations, shop partners, ratings, contact details, or availability claims.

## Validation

- Parsed all 78 TypeScript/TSX source files with the installed TypeScript compiler API: no syntax diagnostics.
- Parsed all three locale JSON files and confirmed the active locale set is AR, FR, and EN.
- Parsed `globals.css` with `tinycss2`: no CSS parse errors.
- Confirmed the locale selector exposes only AR, FR, and EN; checked the localized copy, five priority FAQ entries, trust-card counts, and Arabic RTL metadata.
- A full Next.js build and Vitest run remain unverified because project dependencies are not installed in this environment.


# KULHA! — brand marketing and hero animation pass · 31 October 2026

## Hero and campaign

- Replaced the CSS float/tilt bag artwork with a cropped version of the original supplied `hero1-split-logo-only` animation, with WebM and MP4 sources plus a poster fallback.
- Removed the generic static hero headline in favour of a localized typewriter headline that rotates through neighbourhood, value and less-waste campaign lines.
- Updated the hero kicker, supporting line and first-screen value cues to focus on nearby shops, fair prices and available surplus baskets.

## Customer and shop-owner marketing

- Expanded the desktop/mobile navigation to expose customer discovery, how it works, FAQ and the shop-owner space as distinct destinations.
- Added two prominent audience cards near the top of the homepage: a customer discovery path and a merchant onboarding path.
- Reworked the neighbourhood slogan cards to sound more like customer-facing campaigns rather than generic sustainability statements.
- Rewrote the “why KULHA!” proposition around useful customer benefits: clear MAD prices, shop-declared contents, local commerce and transparency.

## Footer

- Removed the generic “Une marque marocaine” / “A Moroccan brand” label from the footer. The footer now keeps the product promise, useful links and language choices.

## Validation

- Parsed 79 TypeScript/TSX source files with the TypeScript compiler API: no syntax diagnostics.
- Parsed the three locale JSON files.
- Parsed `globals.css` with tinycss2: no CSS parse errors.
- Verified both hero animation encodes are valid 930×760 video streams with a 5.23-second duration.
- A full Next.js build, Vitest run, and actual browser rendering remain unverified because dependencies are not installed and the headless browser attempt did not complete.


## Hero animation correction — supplied bundle (2026-11-01)
- Selected `hero-1-split/hero1-split-logo-only` because the supplied README identifies Hero 1 Split as the main-hero layout and recommends logo-only video with live HTML copy.
- Replaced the custom generated loop with the original supplied MP4/WebM/poster, without looping; the supplied 5.2-second animation holds on its completed logo frame.
- Matched the stage fallback to the source background `#073324`, removed the extra video shade, and synchronized live copy entrances with the bundle timeline.
- Kept the title typewriter while delaying its start until the bag/wordmark animation begins to land.

## Interactive customer and merchant playground
- Kept the supplied Hero 1 logo-only animation on autoplay and enabled looping as requested.
- Added a three-language interactive customer journey: choose an illustrative basket category, compare a regular indicative value with a simulated KULHA! price, review collection details, and continue to account creation.
- Added a merchant journey with editable basket value, selling price, and quantity; the preview calculates discount and potential gross sales from the user's inputs.
- Added a dual-audience mobile-app showcase with distinct customer and merchant app concepts. It clearly states that dedicated apps are in preparation and that the current website is mobile-ready.
- All example amounts and interface mockups are labeled as illustrative; no real listings, merchant partners, stock, or prices are implied.


## Marketplace discovery section
- Added an interactive basket discovery catalogue to the home page in French, Arabic and English.
- Added category chips, sample-area filtering, max-price filtering, free-text search, sort-by-price/reduction, listing details modal, and no-results/reset state.
- Basket cards show illustrative prices in MAD, estimated usual value, example quantity remaining, shop type, area and sample collection window.
- Added visible sample-data disclaimers throughout the catalogue and detail modal; no live shops, inventory, reviews or prices are claimed.
- Kept sample listing data isolated in `BasketDiscovery.tsx` with a documented replacement point for `GET /api/v1/offers` once the approved merchant API is connected.
- Added responsive card layouts, RTL support, keyboard Escape handling and modal scroll locking.

- Added licensed Unsplash stock photography to the illustrative listing cards, with credits recorded in README. Photos remain explicitly illustrative and are not represented as KULHA! partner-shop photography.
- Made the categories page open directly into the basket-discovery experience for FR, AR and EN.
- Kept the live API integration point contract-driven; no offers endpoint or response schema is assumed before it exists in OpenAPI.

- Replaced the generic Souk Al Baraka sample listing with a Moroccan restaurant example, Restaurant Dar Zayna; added a dedicated Restaurants filter in French, English and Arabic. Clearly documented as fictional sample content.

## Login and registration polish — 1 November 2026
- Refined the split account layout with a clearer 50/50 customer-facing panel and focused form card.
- Added a segmented sign-in / create-account switch at the top of the form so users can move between flows without hunting at the bottom.
- Added distinct login and registration welcome copy in French, English and Arabic, plus a clear merchant onboarding link to the shops page.
- Improved field labels, placeholders, email autofill behavior, focus states, password toggle, password recovery placement and terms consent styling.
- Added a restrained reassurance line without introducing unsupported social-login, remember-me, or account-role behaviors.
- Kept the desktop form viewport-constrained without an inner scroll container; mobile uses a natural single-column page scroll.
- Updated all changes without changing the auth API payload or validation requirements.

## Validation
- Parsed all 81 TS/TSX files with the TypeScript transpiler: no syntax diagnostics.
- Parsed French, English and Arabic locale JSON files.
- Parsed the complete global stylesheet with PostCSS.
- Full Next.js typecheck/build and Vitest remain unverified because project dependencies are not installed in this environment.

## Auth form and brand placement refinement — 1 November 2026
- Lifted the desktop login/register form card by approximately 28px (with smaller adjustments for compact heights and tablet widths) to match the supplied visual reference.
- Relocated the auth-page brand lockup to the marked position in the header, centered over the form-side column; the duplicate left-aligned header logo is hidden on desktop auth routes.
- Kept the regular left-aligned header logo on mobile, where the split layout collapses to one column.
- Kept the existing equal-width split and desktop no-inner-scroll behavior unchanged.


## Google OAuth sign-in button
- Added a shared Google authorization button to login and registration in AR/FR/EN.
- Added a same-origin `/api/auth/google` redirect to the Spring Security Google authorization endpoint.
- Added a server-only configurable `GOOGLE_OAUTH2_AUTHORIZATION_PATH`; backend remains responsible for OAuth state/callback validation and session handoff.

## Auth layout correction
- Removed the incorrectly relocated brand mark from the auth navbar; the standard header logo stays at the left.
- Moved the KULHA! bag artwork into the left 50% benefit panel, alongside the four account benefits.
- Rebalanced desktop auth form positioning using natural vertical centering and breathing room below the navbar; removed negative vertical transforms.
- Preserved the mobile stacked layout and responsive artwork placement.


## Password guidance and branded submit feedback — 1 November 2026
- Added a live password-strength meter on registration with an accessible progressbar and a five-point scale.
- Shows each password check as it changes: minimum 10 characters (the API requirement), maximum 128 characters (the API limit), at least one number, a symbol, and a 14-character recommendation.
- Clearly separates backend-required length limits from optional strength recommendations; did not tighten the backend password schema.
- Localized password guidance and strength labels in French, English and Arabic.
- Added a branded KULHA! bag progress indicator and indeterminate horizontal loading sweep on sign-in and registration submission; no fabricated percentage is shown.
- Added a visible loading spinner, disabled submit state, Google button disable state during submission, and a synchronous ref guard against repeated form submissions.
- Added reduced-motion behavior and RTL-friendly styling.

## Authentication flow — two-step registration and visible request progress
- Split account creation into two guided steps: profile details, then password/confirmation and consent.
- Added a two-step progress indicator and preserved entered details when navigating back.
- Added password confirmation validation and immediate match/mismatch feedback before sending the registration request.
- Replaced the small inline pending indicator with a blocking KULHA-branded loading overlay for sign-in, registration, and Google OAuth redirect.
- Added a 30-second request timeout for login and registration so an unresponsive request releases the form with an error instead of leaving it stuck indefinitely.
- Added a timeout regression test for the API client.

## Route progress and contained registration scrolling — 1 November 2026
- Added a global App Router navigation indicator: a thin KULHA saffron progress rail at the top of the viewport plus a compact animated bag/wordmark loader in the cream-and-forest palette.
- Starts feedback for same-origin link navigation, browser back/forward, locale switching, sign-out redirects and post-login redirects; completes when the path/query changes and has an 18-second recovery timeout for cancelled/stalled transitions.
- Uses an indeterminate sweep rather than a fabricated percentage because route/server progress is not exposed to the frontend.
- Locked the auth page shell to the viewport and hid the site footer on auth routes so the document itself cannot scroll.
- Made only the registration content region vertically scrollable, with a custom saffron thumb on a soft-green track; login remains non-scrollable and compact.
- Preserved the 50/50 desktop split; mobile auth uses a fixed stacked viewport with the registration content—not the page—providing the scroll surface.
- Added reduced-motion behavior and kept all auth API/OAuth contracts unchanged.

## Validation
- TypeScript compiler API parsed 85 TS/TSX files without syntax diagnostics.
- PostCSS parsed the full global stylesheet.
- French, English and Arabic locale JSON files parsed successfully.
- A full dependency-backed Next.js build and browser interaction test remain unverified because `node_modules` is not present in this environment.

## Auth surface + original KULHA logo loader
- Replaced the tiny top progress rail and static bag badge with the supplied layered `KulhaLoader` animation (CSS + WebP sprites) as a full-screen route transition treatment.
- Reused the same animated logo loader for login, registration, and Google OAuth submission feedback.
- Added locale-aware loader messages for French, English, and Arabic.
- Reworked auth surfaces from stark white to warm almond paper, cream input surfaces, and KULHA forest/saffron accents.
- Increased typography for auth headings, labels, fields, helper text, and action buttons while retaining compact-height overrides and signup-only inner scrolling.

## Auth surface and account-type choice

- Made the outer sign-in/sign-up card transparent so the warm auth-page background shows through; white is reserved for editable form inputs.
- Added a required account-intent choice to registration: Customer or Shop owner, localized in Arabic, French, and English.
- Customer selection reveals the standard customer registration fields and Google OAuth option.
- Shop-owner selection routes to the merchant onboarding information page. Merchant access remains subject to business review; the browser does not assign privileged roles or send a client-controlled role to the registration API.
- Corrected the `/for-shops` page CTA destination so it leads to the contact information rather than looping back to customer registration.

## Auth visual refinement — body-matched surfaces and professional account selector
- Matched the authentication form shell and card backgrounds to the global page/body cream token (`--cream`, `#fcf4e7`); removed the separate auth gradient and card treatment.
- Kept white exclusively on editable input fields.
- Increased authentication headings, labels, input text, helper copy, buttons, password guidance, and role-choice text for readability.
- Replaced emoji-based customer/merchant tiles with restrained line icons, clean outlines, subtle selected state, and consistent typography.
- Preserved customer/merchant selection behavior, merchant onboarding routing, two-step registration, and the existing backend auth contract.

# KULHA! — Moroccan surplus-food marketplace

KULHA! connects people with Moroccan neighbourhood shops offering surplus food in discounted baskets. Customers browse an offer, reserve available stock online, then collect the basket from the shop during its stated pickup window.

## Product scope represented in this web project

- Customer-facing responsive web/PWA experience in Arabic (RTL), French, and English.
- Merchant-facing messaging for bakeries, cafés, restaurants, grocery shops, and supermarkets.
- Discounted surplus-food baskets, clear MAD prices, quantities, shop address, and collection windows.
- Reservation-first customer journey with clear shop details and collection windows.
- One-time pickup code concept and payment instructions shown before confirmation; pay-at-pickup remains the fallback if an online payment provider is not approved for the pilot.
- No unsupported claims about launch cities, partner shops, customer counts, savings, or availability.

## Requirements

- Node.js 20.9+ (Node.js 22 LTS recommended)
- pnpm 10.11.0 (pinned in `package.json`)
- API environment for authenticated actions (see `.env.example`)

## Run locally

```bash
cp .env.example .env.local
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000.

## Validation commands

```bash
pnpm typecheck
pnpm test
pnpm build
```

The test script uses Vitest. Add feature tests as the API and product flows are connected. A successful frontend build does not replace backend authorization, stock concurrency, payment webhook, or pickup-token tests.

## Visual layout

- Homepage: a viewport-height first-screen hero with the supplied full-canvas 1920×1080 KULHA! animation (settled loop, no cropped video tile or blend mask), a fixed-height typewriter campaign headline, neighbourhood slogan cards, two clear customer/shop-owner entry cards, a customer trust checklist, and a transparent pilot-status panel.
- Header: compact, non-sticky navigation with breathing room for the customer area, how it works, FAQ, and the shop-owner space; switches to a drawer before desktop links become cramped.
- Sign in / sign up: true 50/50 split-screen layout on desktop; stacked responsive layout on narrow screens. The form never uses an internal scroll area.
- Arabic: MSA Arabic copy, explicit RTL column placement and Arabic typography spacing to keep the heading separate from the brand artwork.
- Brand system: deep market green, warm cream, saffron, tomato accents, and a restrained zellige-inspired geometric motif.

## Locales and RTL

- `/ar` — Arabic (RTL, Modern Standard Arabic)
- `/` — French
- `/en` — English

The language switcher offers exactly AR, FR and EN, preserves the current page where a translated route exists, and keeps Arabic right-to-left. Retired locale URLs redirect to the Arabic experience for link compatibility; they are not shown as language options.
## Product and launch safeguards

- Collection is confirmed at the participating shop using a one-time code.
- Stock and prices must be authoritative on the backend. The UI must not imply a reservation until the server confirms it.
- Food contents and allergen information must come from the merchant or a verified source. Unknown information must remain clearly marked as unknown.
- The Moroccan data-protection, commercial, payment, and food-safety requirements need review by qualified local advisers before launch. This repository is not legal advice.

## Main folders

- `src/app` — routes and metadata
- `src/components` — landing, account, navigation, and UI components
- `src/lib/i18n` — localized product and account copy
- `public/brand` — KULHA! identity assets
- `public` — media and static assets


### Landing hero animation
The desktop hero uses the original supplied `kulha-landing-animations/hero-1-split/hero1-split-logo-only` MP4/WebM files. This is the bundle's recommended main-hero option. It plays once and holds on the completed logo; live localized HTML copy remains selectable and the CTA buttons remain real links. The baked-in delivery slogans are intentionally not used.

## Interactive homepage experiences
The homepage includes a client-side playground for both customers and shop owners.

- Customer simulation: select an illustrative basket category, step through discovery, indicative price comparison, collection details, and an account-creation CTA.
- Merchant simulation: edit an example reference value, basket price, and quantity to preview a simulated discount and potential gross sales before following the merchant information/onboarding path.
- Mobile app showcase: separate customer and merchant concepts. Dedicated native apps are labeled as in preparation; the responsive website remains usable on mobile.

All playground prices, basket mockups, and merchant calculations are illustrative only, not active offers or guaranteed commercial terms. The supplied Hero 1 split logo-only animation is set to loop in the landing hero at the current request.


## Homepage basket discovery
The home page includes a localized basket-discovery preview with category, area, price and text filters, sorting, and an offer-detail dialog. The current listings are illustrative fixtures only. They must not be presented as live inventory. Replace `SAMPLE_OFFERS` in `src/components/landing/BasketDiscovery.tsx` with the public-offers endpoint and response DTO defined in the backend OpenAPI contract, after merchant verification, inventory, price, area and pickup-window data are available. Until then, the sample-data labels are intentional.


### Illustrative catalogue photography credits
The basket preview uses generic stock photographs from Unsplash. They are visual examples only and do not depict KULHA! partner stores or verified live baskets. Credits and source pages:
- Bakery: Stephanie LeBlanc — https://unsplash.com/photos/baked-pastries-on-brown-wicker-basket-NZH0p2_2kMo
- Produce: Katelyn G — https://unsplash.com/photos/a-basket-filled-with-lots-of-different-types-of-fruits-and-vegetables-BqN1yRSKCCA
- Café: Mathias Reding — https://unsplash.com/photos/a-cup-of-coffee-and-a-croissant-on-a-table-RJCODpGceTQ
- Grocery: Tanya Barrow — https://unsplash.com/photos/wicker-basket-filled-with-goods-in-a-store-LfXqsVC9IOw


### Basket discovery sample merchants

The restaurant example is named **Restaurant Dar Zayna**. This is fictional sample content for the UI only, not a real partner or merchant. Replace its name, image, menu contents, price, stock and collection window with approved merchant data before launch.

## Latest UI pass: authentication

The login and registration pages now share a clear sign-in/create-account switch, improved field hierarchy and focus states, localized welcome messaging in French/English/Arabic, and a merchant onboarding link. Desktop remains a 50/50 split with a viewport-constrained layout; mobile becomes a natural single-column page. The auth request payloads and server validation were not changed.

### Auth layout adjustment
On desktop login/register routes, the KULHA! lockup is centered in the header over the form-side column, and the form card is raised slightly to align with the supplied reference. On mobile, the standard left-aligned header brand remains in place.


## BFF client IP rate limiting

The Next.js server reads the client address only from `X-Real-IP`, which must be set by the trusted reverse proxy. Configure the proxy to strip any incoming client-supplied `X-Real-IP` and overwrite it with the actual connecting client IP; do not expose Next.js directly in a way that bypasses this proxy. The BFF forwards the validated address to the API using `X-Kulha-Client-IP` and `X-Kulha-Bff-Secret`. Set the same long random `KULHA_BFF_SHARED_SECRET` in the web and API environments. The browser-supplied `X-Forwarded-For` and `X-Kulha-*` headers are never forwarded or trusted.

## Google sign-in

Google sign-in uses the OIDC authorization-code flow with PKCE (S256). The Next.js BFF creates and signs a short-lived state cookie, validates the callback state, exchanges the authorization code server-side, and forwards the ID token plus nonce to the API. The API verifies Google's signature/JWKS, issuer, audience, expiry and nonce, requires `email_verified`, links the stable Google subject to a KULHA account, and returns the normal KULHA access/refresh pair. Tokens remain in HttpOnly cookies; Google tokens are never returned to browser JavaScript. Existing email/password login remains available.

Configure the same Google OAuth Web client ID in `GOOGLE_CLIENT_ID` (web) and `GOOGLE_OAUTH_CLIENT_ID` (API), the client secret only in the web server environment, and the same long random `KULHA_BFF_SHARED_SECRET` in both services. Register `http://localhost:3000/api/auth/google/callback` (or the exact production callback) as an authorized redirect URI in Google Cloud. Google sign-in remains unavailable until all required settings are present.

A verified Google email may be linked to an existing active KULHA account with the same normalized email. A disabled account is never reactivated by Google sign-in. New Google accounts receive the standard CUSTOMER role.

### Authentication layout
The auth header keeps the normal KULHA! lockup at the far left. The illustrated KULHA! bag sits inside the left benefit panel next to the four benefit statements. On desktop the two auth columns remain 50/50, with the form naturally centered in the available viewport height; mobile stacks both panels and allows normal document scrolling (no nested form scroller).


### Authentication feedback
- Registration provides live password guidance in French, English and Arabic. The API-required rules remain 10–128 characters; number/symbol/14-character checks are presented as strength recommendations, not server requirements.
- Login and registration display a KULHA!-branded indeterminate progress sweep while requests are pending. The UI does not invent a completion percentage.

### Authentication UX
- Registration is a two-step flow: name/email/optional phone, then password + confirmation + terms.
- Login and registration show a KULHA-branded blocking progress overlay.
- Login and registration requests time out after 30 seconds and return the form to an actionable error state.
- The progress bar is intentionally indeterminate: the browser cannot know the backend's exact percentage, so it never displays a fabricated completion percentage.

### Route loading and registration scrolling
- Internal route navigation, browser back/forward, locale changes and auth redirects show a KULHA-branded top progress rail and a small animated bag mark.
- The route indicator is indeterminate: it does not claim a percentage the browser cannot know. It completes on route/query change and clears after a safety timeout if navigation stalls.
- Auth pages lock the document to the viewport and hide the global footer. The registration panel's content area is the only scroll container; login remains non-scrollable. Desktop remains 50/50, and mobile keeps the header/benefit panel fixed while the registration content scrolls inside its own panel.
- The route and auth loaders use KULHA forest green, cream and saffron, with reduced-motion support.

## Branded route and authentication loading

The global App Router navigation feedback and auth submission overlay use the shared `KulhaLoader` component at `src/components/KulhaLoader`. Its 14 lightweight WebP logo sprites live in `public/kulha-loader/`. The loader uses the supplied KULHA bag/produce/wordmark artwork and CSS-only animation, with a dark forest-green full-screen treatment. Route loading is locale-aware (French, English, Arabic).

Authentication surfaces use warm almond/cream paper tones and pale saffron input surfaces rather than stark white, with larger labels and field typography. Registration retains its dedicated inner scroll area; the document and left brand panel remain locked.

## Fixing a stale Next.js / Turbopack module-factory error

This project uses Next.js 16. In Next.js 16, Turbopack is the default development bundler. If the browser reports an error such as `Module factory is not available` or references `segment-explorer-node.js`, it can be caused by stale generated chunks or an inconsistent Turbopack module graph after dependency or source changes.

The development script intentionally clears only generated Next.js caches and starts the app with Webpack:

```bash
# Stop any running dev server first (Ctrl+C), then:
pnpm dev
```

The same command works with npm:

```bash
npm run dev
```

The scripts are configured as follows:

- `dev`: clear `.next` and `node_modules/.cache/next`, then start Next.js with Webpack.
- `dev:webpack`: start Webpack without clearing caches (use only when you intentionally want to preserve the dev cache).
- `clean:next`: clear generated Next.js caches without starting the server.
- `build`: use Webpack for a consistent production build path while this runtime issue is being avoided.

After the server starts, close stale localhost tabs and hard-refresh the page (`Ctrl+Shift+R`). Do not delete `node_modules` as the first step; the cache reset is much less disruptive.

If the error persists after a clean Webpack start, inspect the local dependency graph with `pnpm why next` and `pnpm list next --depth 10`, then reinstall from the project's lockfile. Do not manually edit files inside `node_modules/.pnpm`. This app does not register a service worker or override Next.js static chunk cache headers, so no service-worker or custom static-cache rule needs to be changed for this fix.

### Authentication role selection

Registration asks users whether they are joining as a customer or representing a shop. Customer registration uses the existing `/api/v1/auth/register` request contract. Shop owners are directed to the merchant onboarding information flow; merchant access is reviewed and approved by the KULHA! team. The frontend intentionally does not submit a self-assigned privileged role to the API.

The auth card surface is transparent; editable input fields are white.

### Latest authentication styling
The auth page and form surfaces use the same `--cream` background token as the page body (`#fcf4e7`). White is reserved for editable input fields. Customer and shop-owner selection uses neutral line icons, understated borders, and a forest-green selected state. Auth typography has been increased for readability.

## Customer and shop-owner onboarding

- Customers and shop owners create the same secure KULHA! identity account. A shop-owner selection changes the post-signup journey; it never grants merchant permissions by itself.
- The user confirms their email address, signs in, then submits the shop profile at `/merchant/apply` (or the localized `/en/merchant/apply` and `/ar/merchant/apply` routes).
- The API creates the merchant application as `PENDING`. The owner can follow its status; a rejected application can be corrected and resubmitted. The API only grants `MERCHANT` after an administrator approves the shop.
- Existing email/password and Google sign-in both use the same post-login route. Google-created accounts are email-verified by the identity provider before the merchant application step.

## Transactional email and in-app feedback

- Verification and password-reset emails are multipart HTML/text messages using the KULHA! forest-green and saffron brand palette. Action links appear as buttons in the HTML email; one-time tokens are carried in URL fragments, never printed in the text alternative, and are removed from the browser address bar as soon as the confirmation page reads them.
- In-app notifications use the project-owned `ToastProvider` and KULHA! styling. No third-party React toast package is used.

## Post-sign-in customer and shop-owner screens

The authentication flow now lands on role-appropriate account screens after email verification and sign-in:

- **Customer:** `/account` (also `/en/account` and `/ar/account`) is the customer home. It shows the signed-in profile, email verification state, launch information, and links to basket discovery and the KULHA! how-it-works page. Reservation functionality is not presented as live before the pilot is opened.
- **Shop owner:** `/merchant/dashboard` (also `/en/merchant/dashboard` and `/ar/merchant/dashboard`) is the shop workspace and application entry point. An owner without an application can submit one; a pending owner sees the review status; a rejected owner can correct and resubmit; an approved owner sees the verified business profile and the state of the tools.
- **Role-based return:** a normal password sign-in sends an approved `MERCHANT` role to the shop dashboard and other accounts to the customer home. A validated `next` destination supplied by the signup/verification flow is preserved.

Basket publishing, reservation management, and pickup confirmation are still future product phases. The approved shop workspace labels these tools as not yet released rather than displaying nonfunctional controls.

### Smoke-test paths

1. Register as **Customer**, verify the email from the message, use the sign-in button, and confirm that `/account` opens.
2. Register as **Shop owner**, verify the email, use the shop-owner sign-in button, complete the business application, and confirm that the application status is shown on `/merchant/dashboard`.
3. Approve the application through the existing administrator workflow. On the owner's next sign-in, confirm that the shop dashboard shows the approved business workspace.
4. Repeat using `/en` and `/ar` paths to verify localized account and shop-owner screens.

These flows require the API, database, email provider, and (for Google sign-in) Google OAuth credentials to be configured. The UI screens do not bypass API verification or merchant approval.

# Technical handoff

## Stack

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS 4 for existing utility-driven auth/UI elements; authored CSS for the art-directed marketing landing page.
- Existing backend integration: Next.js BFF routes proxy to a Spring Boot API using `API_BASE_URL`.
- The blog is currently static MDX-like page content in route files; move to MDX or a headless CMS when editorial publishing needs a non-developer workflow.
- Locale paths: `/fr`, `/en`, `/ary`, `/ary-latn`. Root `/` is French default.

## Component map

- `SiteHeader`: sticky desktop navigation, locale links, accessible mobile drawer.
- `LandingPage`: localized landing composition, hero, steps, feature showcase, categories, Moroccan brand story, delivery transparency, comparison, founder note, blog cards, FAQ, final CTA, cookie notice and mobile sticky CTA.
- `Logo`: supplied bag mark plus live wordmark.
- `SiteFooter`: localized brand statement and navigation columns; no fake contact details.
- `AuthCard`: responsive split panel and preserved auth forms.
- `InfoPage` / `ContentTile`: secondary-page layout.
- Existing auth components, session provider, API client, validation and BFF utilities remain in place.

## Design tokens

| Token | Value |
|---|---|
| Forest / hero | `#073324` |
| Text green | `#06482F` |
| Sun yellow | `#FDBE2E` |
| Cream | `#FCF4E7` |
| Tomato | `#EE3F29` |
| Leaf | `#7EC34A` |
| Card radius | 18–26px |
| Pill radius | 999px |
| Content max width | 1240–1380px |
| Body | Nunito 600–700 |
| Headline | Nunito 800–1000 |

Spacing follows a 4px base rhythm. Main sections use generous 76–112px desktop padding and 65–76px mobile padding.

## Responsive breakpoints

- `≤390px`: narrow-phone refinements.
- `≤700px`: mobile layout, stacked CTAs, category two-column grid, mobile hero still, sticky CTA and compact footer.
- `≤980px`: mobile navigation drawer, condensed hero and intermediate grids.
- `≤1180px`: tablet / small laptop adaptations.
- `≥1600px`: extra-wide hero composition.

Use logical properties (`padding-inline`, `margin-inline`, `inset-inline`) for RTL-safe layout. Avoid fixed-width text containers; the French, Darija and Arabic lines differ significantly in length and line-height.

## Animation behaviour

- Hero 1 Split logo-only MP4 / WebM runs once; live text is regular HTML and real links.
- Keep the poster to avoid a blank first frame.
- The mobile view does not crop the landscape video; it uses the transparent bag artwork.
- `prefers-reduced-motion: reduce` hides motion video and uses a poster background.
- Small card reveals and hover lifts should stay subtle. Keep entrance effects to 600–700ms maximum and use a restrained ease-out-back curve; never delay CTA availability.

## Performance

- Current hero MP4 is about 0.5 MB and WebM is about 0.3 MB. Keep `preload="metadata"`; test whether `preload="auto"` improves perceived quality on target devices before increasing bandwidth.
- Keep poster on all video elements; use the poster for reduced motion.
- Convert large non-animated photos to AVIF/WebP and use responsive `sizes` through `next/image`.
- Add font subsets for Latin and Arabic if self-hosting; don't load unused glyph sets.
- Lazy-load below-the-fold images; hero mark and poster may be prioritized.
- Measure LCP, INP and CLS on real mid-range Android devices and slow mobile networks.

## Accessibility

- WCAG 2.2 AA target: test actual contrast for cream on green, green on yellow, grey supporting text and focus indicators.
- All navigation is keyboard-operable, visible focus is retained, and the menu button exposes `aria-expanded`.
- FAQ controls use native buttons with `aria-expanded`.
- Respect reduced motion; do not communicate state by colour alone.
- Keep meaningful bag alt text where the logo communicates content; decorative logo images use empty alt.
- Verify Darija RTL with a native speaker and keyboard users; test punctuation, digits and phone fields in both directions.

## Analytics events to instrument only after consent and configuration

`signup_start`, `signup_complete`, `login_success`, `app_download_click`, `language_switch`, `blog_cta_click`, `delivery_zone_check`, `checkout_start`, `order_complete`.

No analytics vendor is installed in this package. The cookie notice currently states that only necessary cookies are used and non-essential measurement remains off. Add a real consent manager before enabling non-essential tracking.

## Structured data / SEO to finish at launch

Use Organization, WebSite, FAQPage, Article, BreadcrumbList and MobileApplication schema where factual data exists. Set a real canonical base URL and `NEXT_PUBLIC_SITE_URL`. Do not mark the mobile application as available until store listings are live. Keep city coverage, telephone and physical address out of structured data until confirmed.

## Current delivery scope

- The home page is translated across four locales. Secondary content pages and auth forms are currently French; locale JSON files are starter resources, not a fully wired i18n system.
- Four short French blog samples are included. They are placeholders for the full editorial programme, not 700–900-word articles in all locales.
- The API-backed auth flow is carried over from the supplied project and still requires the matching Spring Boot backend.
- See `docs/LAUNCH-CHECKLIST.md` before any public release.

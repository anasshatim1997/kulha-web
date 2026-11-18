# KULHA! Web

The Next.js frontend for **KULHA!**, a Moroccan surplus-food marketplace. Customers discover discounted food offers from local merchants, reserve online, and collect them in person during the merchant's pickup window. The current product scope is pickup-first; do not add delivery flows without an explicit product decision.

## Product and localization

- Supported locales: **French (fr), Arabic (ar), and English (en)**.
- Arabic pages must support correct RTL layout, including navigation, forms, icons, spacing, and mixed-direction values.
- Do not introduce Darija as a separate locale.
- Keep customer and merchant journeys distinct where their permissions or tasks differ.
- Use Moroccan context, MAD pricing, and realistic local merchant examples.
- Keep user-facing claims aligned with implemented backend behavior.

## Stack

| Area | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript |
| Styling | Tailwind CSS 4 and CSS Modules |
| Tests | Vitest |
| Linting | ESLint |
| Maps | MapLibre GL / PMTiles |
| Package manager | pnpm 10 |
| Runtime | Node.js 22 or newer |

Exact versions are pinned in `package.json` and the lockfile.

## Prerequisites

- Node.js 22+
- pnpm 10+
- Git
- A running KULHA API for authenticated and data-backed flows

Check versions:

```bash
node --version
pnpm --version
```

## Local development

1. Install dependencies:

   ```bash
   pnpm install --frozen-lockfile
   ```

2. Create a local `.env.local` from the environment template if one is provided. Never commit local environment files or secrets.

3. Configure the API base URL and the server-side BFF/OAuth settings required by the flows you are testing. Keep server secrets server-only; never prefix secrets with `NEXT_PUBLIC_`.

4. Start the development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

The frontend uses server-side BFF routes for sensitive authentication operations. The API and web app must use the same configured BFF shared secret. Google OAuth also requires matching client configuration and an exact registered callback URL in Google Cloud.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start local development |
| `pnpm build` | Create a production build |
| `pnpm start` | Run the production server |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm test` | Run Vitest |
| `pnpm lint` | Run ESLint |

Run the relevant checks before opening a pull request:

```bash
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Do not report a check as passing unless the command was run and its result was observed.

## Architecture and conventions

- Use the Next.js App Router and keep server-only code out of client bundles.
- Route sensitive auth operations through the BFF. Do not expose access tokens, refresh tokens, OAuth client secrets, or the BFF secret to browser JavaScript.
- Session cookies are managed server-side; preserve their HttpOnly, Secure (outside local development), and SameSite protections.
- Validate request origins for state-changing BFF operations. Do not weaken CSRF/origin checks to make a request work.
- Keep API communication centralized in the existing API/auth helpers. Respect their timeout, no-store, and error-handling behavior.
- Keep role/ownership decisions on the API. Frontend route guards are UX, not authorization.
- Keep locale routing consistent. Preserve the supported `/fr`, `/ar`, and `/en` experiences and test Arabic RTL at mobile and desktop breakpoints.
- Use accessible labels, keyboard navigation, visible focus, useful validation, and loading/error/empty states.
- Avoid fake inventory, fabricated merchant details, or price/discount claims not returned by the API.

## Authentication and API integration

The frontend implements customer and merchant onboarding, email verification, password reset, login/session handling, and Google sign-in through server-side BFF routes.

Important integration rules:

- The API is the source of truth for identity, roles, merchant approval, offer availability, pricing, and reservations.
- Never infer that an email address is available or disclose whether an account exists through a public pre-registration lookup.
- Treat registration and resend-verification responses as neutral where the API is designed to prevent account enumeration.
- Do not store session tokens in localStorage or sessionStorage.
- Google OAuth must use authorization code flow with PKCE, validated state, and the configured callback. Never send the Google client secret to the browser.

## Maps and offer discovery

Offer discovery is API-backed. Keep search filters, location, pagination, sorting, and map/list state synchronized without silently dropping offers. Do not replace real offers with placeholder data when a request fails. Preserve a useful error or empty state and surface diagnostics without exposing personal data.

MapLibre and PMTiles are used for map experiences. Keep map loading resilient and avoid blocking the offer list on nonessential map assets.

## Repository structure

The source is organized under `src/app`, `src/components`, and `src/lib`. Follow the existing feature and route organization rather than introducing a parallel architecture. Tests live alongside the relevant source or in the existing test locations.

## Pull request checklist

- [ ] Customer and merchant journeys remain correct.
- [ ] French, Arabic (RTL), and English are checked for changed UI.
- [ ] Mobile and desktop layouts are checked.
- [ ] Loading, error, empty, and success states are covered.
- [ ] No account enumeration or client-side secret/token exposure is introduced.
- [ ] API contract changes are coordinated with `kulha-api`.
- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint`, and `pnpm build` pass.
- [ ] No local environment files, credentials, or generated secrets are committed.

## Working agreements

Prefer focused branches and small commits. Add regression tests for fixed bugs. Do not bypass failing checks, disable tests, or broaden API permissions to make the UI appear functional. When a change affects an API contract, document the contract and coordinate the backend change in the same delivery.

# Code Review #1 follow-ups

These items are intentionally not part of the R1–R4 fixes. Track them before the public-launch gate or resolve the product decisions with the owner.

## Web repository hygiene to verify in the full Git checkout

- [ ] Remove committed `.idea/` and `*.tsbuildinfo` artifacts from Git history/index if still tracked. `.gitignore` now excludes both; the supplied source ZIP did not contain those files or Git metadata, so their tracked status could not be changed here.
- [ ] Confirm `package-lock.json` is absent from the full repository; the supplied ZIP contained the pnpm lockfile but no npm lockfile.
- [ ] Confirm only `vitest.config.ts` remains in the full repository; no duplicate `.mts` config was present in the supplied ZIP.
- [ ] Resolve the ESLint config/dependency/CI mismatch in the full checkout. The supplied ZIP did not contain `eslint.config.mjs`.
- [ ] Move the large `kulha-landing-animations/` assets to a design/assets repository or Git LFS, and ensure they are excluded from deployed build context where possible.
- [ ] Self-host the Noto Sans Arabic and Nunito font files with `next/font/local` to make production builds independent of Google Fonts availability.

## Web security and CI

- [ ] Add and test CSP, `X-Content-Type-Options`, `Referrer-Policy`, frame-ancestor protection, and HSTS. Use `no-referrer` on verification/reset pages because one-time tokens appear in URLs.
- [ ] Add lint, dependency scanning, secret scanning (for example gitleaks), and container/image scanning to CI before release.
- [ ] Document that the refresh single-flight cache is per BFF instance and does not coordinate across multiple instances.

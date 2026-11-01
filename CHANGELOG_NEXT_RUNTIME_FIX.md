# KULHA! — Next.js module factory runtime recovery

- Changed `dev` to clear generated Next.js caches and run `next dev --webpack`, avoiding the Turbopack dev runtime implicated by the reported module-factory error.
- Added `dev:webpack` and `clean:next` scripts for explicit control.
- Changed `build` to `next build --webpack` for a consistent bundler path while the issue is being avoided.
- Added a cross-platform Node cache-cleaner that removes only `.next` and `node_modules/.cache/next`; it does not remove installed dependencies, source files, environment files, or application data.
- Documented the recovery procedure for Windows/pnpm/npm and post-restart hard refresh.
- Confirmed there is no app-registered service worker and no custom static asset cache header override in the source tree.

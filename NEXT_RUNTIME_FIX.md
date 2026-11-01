# KULHA! Next.js runtime recovery

The reported `Module factory is not available` error is being avoided by opting out of Turbopack for local development and clearing generated Next.js cache output before the dev server starts.

## Windows / PowerShell

1. Stop the current dev server with `Ctrl+C`.
2. Extract the fix patch into the project root (`C:\dev\kulha-web`) and overwrite `package.json`.
3. Run:

   ```powershell
   pnpm dev
   ```

4. Close old tabs for the local site, reopen it, and hard-refresh with `Ctrl+Shift+R`.

The `dev` script clears `.next` and `node_modules/.cache/next`, then starts `next dev --webpack`.

## If the error persists

Inspect the dependency graph:

```powershell
pnpm why next
pnpm list next --depth 10
```

Do not hand-edit anything under `node_modules/.pnpm`. Preserve the existing `pnpm-lock.yaml` and reinstall from it only if the graph shows duplicate or inconsistent Next.js installations.

## What this patch changes

- `dev`: clear generated Next.js caches and use Webpack.
- `dev:webpack`: run Webpack without clearing cache.
- `clean:next`: clear generated Next.js caches only.
- `build`: build with Webpack as well, for a consistent bundler path while avoiding the reported Turbopack runtime failure.

The cache-cleaning script verifies that it is running in the KULHA! project root before deleting anything. It does not delete `node_modules`, application files, `.env` files, or user data.

No service worker or custom static chunk cache header override was found in the supplied project source.

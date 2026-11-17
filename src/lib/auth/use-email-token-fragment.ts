"use client";

import { useEffect, useState } from "react";

export function parseEmailTokenFragment(hash: string): string | null {
  // Only a real URL fragment counts. URLSearchParams silently drops a leading "?", so without this
  // check "?token=..." (a query string, which is sent to servers and logged) would be accepted.
  if (!hash.startsWith("#")) return null;
  const candidate = new URLSearchParams(hash.slice(1)).get("token");
  return candidate && /^[A-Za-z0-9_-]{24,200}$/.test(candidate) ? candidate : null;
}

/** Reads a one-time token from the URL fragment, then immediately removes it from the address bar. */
export function useEmailTokenFragment(): { token: string | null; ready: boolean } {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Syncing from the URL (an external system that is unavailable during SSR/hydration) on mount is
    // the intended use of an effect here. Reading it in the initial state would cause a hydration mismatch.
    const candidate = parseEmailTokenFragment(window.location.hash);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (candidate) setToken(candidate);
    if (window.location.hash) {
      // Fragments are not sent in HTTP requests; clearing this also keeps the bearer token out of
      // the visible address bar and subsequent browser history entries.
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return { token, ready };
}

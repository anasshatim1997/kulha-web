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
    const candidate = parseEmailTokenFragment(window.location.hash);
    if (candidate) setToken(candidate);
    if (window.location.hash) {
      // Fragments are not sent in HTTP requests; clearing this also keeps the bearer token out of
      // the visible address bar and subsequent browser history entries.
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    }
    setReady(true);
  }, []);

  return { token, ready };
}

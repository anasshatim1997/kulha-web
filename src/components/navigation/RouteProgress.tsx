"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { KulhaLoader } from "@/components/KulhaLoader";
import { localeFromPath } from "@/lib/navigation";

type LoadingCopy = { message: string; label: string };

const LOADING_COPY: Record<"fr" | "en" | "ar", LoadingCopy> = {
  fr: { message: "On prépare la suite…", label: "Chargement de la page" },
  en: { message: "Getting things ready…", label: "Loading page" },
  ar: { message: "نجهّز الصفحة التالية…", label: "جارٍ تحميل الصفحة" },
};

/** Full-screen KULHA! branded route feedback. The loader appears for real navigation events only. */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [loading, setLoading] = useState(false);
  const routeKeyRef = useRef(routeKey);
  const startedAtRef = useRef(0);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    finishTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!startedAtRef.current) {
      setLoading(false);
      clearTimers();
      return;
    }
    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(0, 420 - elapsed);
    clearTimers();
    finishTimer.current = setTimeout(() => {
      startedAtRef.current = 0;
      setLoading(false);
    }, remaining);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    setLoading(true);
    // Never trap someone behind the overlay if a navigation is interrupted.
    safetyTimer.current = setTimeout(() => {
      startedAtRef.current = 0;
      setLoading(false);
      clearTimers();
    }, 18000);
  }, [clearTimers]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return;
      start();
    };
    const onPopState = () => start();
    const onProgrammaticNavigation = () => start();

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("kulha:navigation-start", onProgrammaticNavigation);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("kulha:navigation-start", onProgrammaticNavigation);
      clearTimers();
    };
  }, [clearTimers, start]);

  useEffect(() => {
    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey;
      finish();
    }
  }, [routeKey, finish]);

  if (!loading) return null;
  const copy = LOADING_COPY[localeFromPath(pathname)];

  return <KulhaLoader fullscreen theme="dark" size={236} message={copy.message} label={copy.label} />;
}

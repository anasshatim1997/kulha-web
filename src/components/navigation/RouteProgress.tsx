"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { KulhaCurtain } from "@/components/navigation/KulhaCurtain";
import { localeFromPath } from "@/lib/navigation";

type LoadingCopy = { preparing: string; loading: string; finishing: string; label: string };

const LOADING_COPY: Record<"fr" | "en" | "ar", LoadingCopy> = {
  fr: { preparing: "On prépare la page…", loading: "Chargement du contenu…", finishing: "Finalisation…", label: "Chargement de la page" },
  en: { preparing: "Preparing your page…", loading: "Loading content…", finishing: "Finishing up…", label: "Loading page" },
  ar: { preparing: "نحضّر صفحتك…", loading: "جارٍ تحميل المحتوى…", finishing: "اللمسات الأخيرة…", label: "جارٍ تحميل الصفحة" },
};

const MIN_VISIBLE_MS = 850;
const SAFETY_TIMEOUT_MS = 12000;

export function RouteProgress() {
  const pathname = usePathname();
  const routePathRef = useRef(pathname);
  const startedAtRef = useRef(0);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const clearTimers = useCallback(() => {
    if (finishTimer.current) clearTimeout(finishTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    finishTimer.current = null;
    safetyTimer.current = null;
    progressTimers.current.forEach((timer) => clearTimeout(timer));
    progressTimers.current = [];
  }, []);

  const finish = useCallback(() => {
    if (!startedAtRef.current) {
      setLoading(false);
      setProgress(0);
      clearTimers();
      return;
    }

    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - startedAtRef.current));
    setProgress(100);
    clearTimers();
    finishTimer.current = setTimeout(() => {
      startedAtRef.current = 0;
      setLoading(false);
      setProgress(0);
    }, remaining);
  }, [clearTimers]);

  const start = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    setProgress(7);
    setLoading(true);
    const milestones = [
      [90, 22],
      [260, 39],
      [620, 58],
      [1150, 72],
      [2100, 82],
      [3800, 88],
    ] as const;
    progressTimers.current = milestones.map(([delay, value]) => setTimeout(() => {
      setProgress((current) => Math.max(current, value));
    }, delay));
    safetyTimer.current = setTimeout(() => {
      setProgress(100);
      finish();
    }, SAFETY_TIMEOUT_MS);
  }, [clearTimers, finish]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      if (anchor.hasAttribute("data-skip-route-progress") || anchor.getAttribute("aria-disabled") === "true") return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      start();
    };

    const onPopState = () => {
      if (window.location.pathname !== routePathRef.current) start();
    };

    const onProgrammaticNavigation = () => start();
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      startedAtRef.current = 0;
      clearTimers();
      setLoading(false);
      setProgress(0);
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("kulha:navigation-start", onProgrammaticNavigation);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("kulha:navigation-start", onProgrammaticNavigation);
      window.removeEventListener("pageshow", onPageShow);
      clearTimers();
    };
  }, [clearTimers, start]);

  useEffect(() => {
    if (routePathRef.current === pathname) return;
    routePathRef.current = pathname;
    finish();
  }, [pathname, finish]);

  const copy = LOADING_COPY[localeFromPath(pathname)];
  const message = progress >= 94 ? copy.finishing : progress >= 39 ? copy.loading : copy.preparing;
  return <KulhaCurtain active={loading} message={message} label={copy.label} progress={progress} />;
}

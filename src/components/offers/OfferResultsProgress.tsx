"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function OfferResultsProgress({ label }: { label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const routeKey = `${pathname}?${search}`;
  const previousRouteKey = useRef(routeKey);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (previousRouteKey.current === routeKey) return;
    previousRouteKey.current = routeKey;
    if (showTimer.current) clearTimeout(showTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    showTimer.current = null;
    safetyTimer.current = null;
    setPending(false);
  }, [routeKey]);

  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".kulha-offers-page");
    if (!page) return;

    const start = () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      showTimer.current = setTimeout(() => setPending(true), 160);
      safetyTimer.current = setTimeout(() => {
        showTimer.current = null;
        safetyTimer.current = null;
        setPending(false);
      }, 12000);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const element = event.target instanceof Element ? event.target : null;
      const anchor = element?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname !== pathname) return;
      if (destination.search === window.location.search) return;
      start();
    };

    const onSubmit = (event: Event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const destination = new URL(form.action || window.location.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname !== pathname) return;
      const nextSearch = new URLSearchParams();
      new FormData(form).forEach((value, key) => {
        if (typeof value === "string" && value !== "") nextSearch.append(key, value);
      });
      if (nextSearch.toString() !== search) start();
    };

    const onProgrammaticFilter = () => start();
    const onPopState = () => {
      if (window.location.pathname === pathname && window.location.search !== (search ? `?${search}` : "")) start();
    };

    page.addEventListener("click", onClick, true);
    page.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("kulha:offers-filter-start", onProgrammaticFilter);

    return () => {
      page.removeEventListener("click", onClick, true);
      page.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("kulha:offers-filter-start", onProgrammaticFilter);
      if (showTimer.current) clearTimeout(showTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      showTimer.current = null;
      safetyTimer.current = null;
    };
  }, [pathname, search]);

  if (!pending) return null;
  return (
    <span className="kulha-results-progress" role="status" aria-live="polite">
      <span className="kulha-results-progress-indicator" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

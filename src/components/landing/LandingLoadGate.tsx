"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { KulhaLoader } from "@/components/KulhaLoader/KulhaLoader";

/**
 * Full-screen loader for the landing page's FIRST visit in a tab.
 *
 * Why: the hero runs CSS animations on fixed delays and plays a video, the offers use remote photos and
 * the title typewriter needs hydration. Started at first paint, those drift out of sync with whatever
 * has (or hasn't) loaded yet, so some animations looked broken until a manual reload.
 *
 * How: the server renders this overlay, so it covers the page from the very first paint. The landing
 * root starts with `data-landing-ready="false"` (CSS keeps every animation paused), and once the page,
 * fonts, hero video and images are ready we flip it to "true": every animation starts together from
 * frame zero and the hero video restarts in step with them. A hard timeout means a slow or blocked
 * asset can never trap the visitor behind the loader.
 */

const MAX_WAIT_MS = 8000;
/** Remote offer photos sit below the fold, so they only get a short extra window on top of the critical assets. */
const PHOTO_WAIT_MS = 2500;
const MIN_VISIBLE_MS = 700;
const FADE_MS = 450;

/** Set once the gate has finished in this tab, so client-side navigations back to "/" skip it. */
let gateFinishedInThisTab = false;

type Phase = "loading" | "leaving" | "done";

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function once(target: EventTarget, events: string[]): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      for (const name of events) target.removeEventListener(name, finish);
      resolve();
    };
    for (const name of events) target.addEventListener(name, finish, { once: true });
  });
}

function waitForImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    if (image.complete) resolve();
  });
}

function waitForVideo(video: HTMLVideoElement): Promise<void> {
  // 2 = HAVE_CURRENT_DATA: the first frame can be painted.
  if (video.readyState >= 2) return Promise.resolve();
  const sources = video.querySelectorAll("source").length;
  // Every source already failed before we got here (e.g. file missing/unsupported): nothing to wait for.
  if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) return Promise.resolve();
  return new Promise((resolve) => {
    let failedSources = 0;
    const finish = () => {
      for (const name of ["loadeddata", "canplay", "abort"]) video.removeEventListener(name, finish);
      video.removeEventListener("error", onError, true);
      resolve();
    };
    // <source> errors don't bubble, so listen in the capture phase; once every source failed there is nothing to wait for.
    const onError = (event: Event) => {
      if (event.target === video || ++failedSources >= sources) finish();
    };
    for (const name of ["loadeddata", "canplay", "abort"]) video.addEventListener(name, finish);
    video.addEventListener("error", onError, true);
  });
}

function waitForPageAssets(root: HTMLElement): Promise<void> {
  const tasks: Promise<unknown>[] = [];

  tasks.push(document.readyState === "complete" ? Promise.resolve() : once(window, ["load"]));
  if (document.fonts?.ready) tasks.push(document.fonts.ready.catch(() => undefined));

  // Skip a video that CSS hides at this breakpoint: it will never be shown, so don't wait for it.
  for (const video of root.querySelectorAll("video")) {
    if (getComputedStyle(video).display !== "none") tasks.push(waitForVideo(video));
  }

  for (const image of root.querySelectorAll("img")) {
    if (image.complete) continue;
    if (image.loading === "lazy") continue;
    tasks.push(once(image, ["load", "error"]));
  }

  // Remote photos used as CSS backgrounds (the example offers) are not <img> tags, so preload them too,
  // but never let a slow photo host hold the whole page for long.
  const photos: Promise<void>[] = [];
  for (const element of root.querySelectorAll<HTMLElement>('[style*="url("]')) {
    for (const match of element.style.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
      photos.push(waitForImage(match[1]));
    }
  }
  tasks.push(Promise.race([
    Promise.all(photos),
    new Promise<void>((resolve) => window.setTimeout(resolve, PHOTO_WAIT_MS)),
  ]));

  return Promise.all(tasks).then(() => undefined);
}

/** The gate is rendered right before the `.landing` root (as a sibling), so the marker's next element is it. */
function landingRoot(marker: HTMLElement | null): HTMLElement | null {
  const next = marker?.nextElementSibling;
  return next instanceof HTMLElement && next.classList.contains("landing") ? next : null;
}

export function LandingLoadGate({ message, label }: { message: string; label: string }) {
  const [phase, setPhase] = useState<Phase>(() => (gateFinishedInThisTab ? "done" : "loading"));
  const markerRef = useRef<HTMLSpanElement>(null);

  // Returning to the landing page by client-side navigation: nothing to wait for, run animations at once.
  useIsomorphicLayoutEffect(() => {
    if (phase !== "done") return;
    landingRoot(markerRef.current)?.setAttribute("data-landing-ready", "true");
  }, [phase]);

  useEffect(() => {
    if (phase !== "loading") return;
    const root = landingRoot(markerRef.current);
    if (!root) {
      gateFinishedInThisTab = true;
      setPhase("done");
      return;
    }

    let cancelled = false;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const timeout = new Promise<void>((resolve) => window.setTimeout(resolve, MAX_WAIT_MS));
    const minimum = new Promise<void>((resolve) => window.setTimeout(resolve, MIN_VISIBLE_MS));

    void Promise.all([Promise.race([waitForPageAssets(root), timeout]), minimum]).then(() => {
      if (cancelled) return;
      // Two frames so the browser has painted the final layout before animations begin.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cancelled) return;
        root.setAttribute("data-landing-ready", "true");
        for (const video of root.querySelectorAll("video")) {
          video.currentTime = 0;
          void video.play().catch(() => undefined);
        }
        gateFinishedInThisTab = true;
        setPhase("leaving");
      }));
    });

    return () => {
      cancelled = true;
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    document.body.style.overflow = "";
    const timer = window.setTimeout(() => setPhase("done"), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <>
      {phase !== "done" && (
        <div className="landing-gate" data-phase={phase} aria-hidden={phase === "leaving" ? true : undefined}>
          <KulhaLoader fullscreen theme="dark" size={220} message={message} label={label} />
        </div>
      )}
      <span ref={markerRef} hidden />
    </>
  );
}

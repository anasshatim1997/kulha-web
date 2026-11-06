"use client";

import { useEffect, useRef, useState } from "react";
import { KulhaLoader } from "@/components/KulhaLoader";
import styles from "./KulhaCurtain.module.css";

type Phase = "hidden" | "preparing" | "entering" | "shown" | "leaving";
type Props = { active: boolean; message: string; label: string };

export function KulhaCurtain({ active, message, label }: Props) {
  const [phase, setPhase] = useState<Phase>("hidden");
  const phaseRef = useRef<Phase>("hidden");
  const exitAfterEnter = useRef(false);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useRef(false);
  const set = (next: Phase) => { phaseRef.current = next; setPhase(next); };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reducedMotion.current = media.matches; };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (active) {
      exitAfterEnter.current = false;
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      if (phaseRef.current === "leaving") set("entering");
      if (phaseRef.current === "hidden") {
        delayTimer.current = setTimeout(() => {
          set("preparing");
          requestAnimationFrame(() => { if (active && phaseRef.current === "preparing") set("entering"); });
        }, 150);
      }
    } else {
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (phaseRef.current === "preparing") set("hidden");
      if (phaseRef.current === "entering") exitAfterEnter.current = true;
      if (phaseRef.current === "shown") set("leaving");
    }
    return () => {
      if (delayTimer.current) clearTimeout(delayTimer.current);
    };
  }, [active]);

  useEffect(() => {
    if (phase === "preparing" || phase === "entering" || phase === "shown" || phase === "leaving") {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = previous; };
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "entering" && phase !== "leaving") return;
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = setTimeout(() => {
      if (phaseRef.current === "entering") {
        if (active || !exitAfterEnter.current) set("shown");
        else set("leaving");
      } else if (phaseRef.current === "leaving") {
        set("hidden");
      }
    }, phase === "entering" ? 410 : 460);
    return () => { if (fallbackTimer.current) clearTimeout(fallbackTimer.current); };
  }, [phase, active]);

  function onTransitionEnd(event: React.TransitionEvent<HTMLDivElement>) {
    if (!(event.target instanceof HTMLElement) || !event.target.classList.contains(styles.panel)) return;
    const expectedProperty = reducedMotion.current ? "opacity" : "transform";
    if (event.propertyName !== expectedProperty) return;
    if (phaseRef.current === "entering") {
      if (active || !exitAfterEnter.current) set("shown");
      else set("leaving");
    } else if (phaseRef.current === "leaving") {
      set("hidden");
    }
  }

  if (phase === "hidden") return null;
  return <div className={`${styles.curtain} ${styles[phase]}`} onTransitionEnd={onTransitionEnd} aria-hidden="false">
    <KulhaLoader fullscreen theme="dark" size={236} message={message} label={label} panelClassName={styles.panel}/>
  </div>;
}

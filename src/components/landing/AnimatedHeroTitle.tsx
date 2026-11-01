"use client";

import { useEffect, useState } from "react";

export function AnimatedHeroTitle({ phrases }: { phrases: readonly string[] }) {
  const [visibleText, setVisibleText] = useState("");

  useEffect(() => {
    if (!phrases.length) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || phrases.length === 1) {
      setVisibleText(phrases[0]);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let phraseIndex = 0;
    let characterIndex = 0;
    let deleting = false;
    const segment = (value: string) => Array.from(value);

    function typeNext() {
      const chars = segment(phrases[phraseIndex]);
      characterIndex = Math.min(chars.length, characterIndex + 1);
      setVisibleText(chars.slice(0, characterIndex).join(""));

      if (characterIndex === chars.length) {
        deleting = true;
        timer = setTimeout(tick, 2600);
      } else {
        timer = setTimeout(typeNext, 36);
      }
    }

    function tick() {
      const chars = segment(phrases[phraseIndex]);
      if (!deleting) {
        typeNext();
        return;
      }

      characterIndex = Math.max(0, characterIndex - 1);
      setVisibleText(chars.slice(0, characterIndex).join(""));
      if (characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        timer = setTimeout(typeNext, 260);
      } else {
        timer = setTimeout(tick, 25);
      }
    }

    // Hero 1 lands its wordmark at ~1.6s; the headline starts writing at ~1.85s.
    timer = setTimeout(typeNext, 1850);
    return () => { if (timer) clearTimeout(timer); };
  }, [phrases]);

  return (
    <>
      <span className="sr-only">{phrases[0] ?? "KULHA!"}</span>
      <span className="hero-typewriter" aria-hidden="true" dir="auto">
        {visibleText}<span className="hero-typewriter-cursor" />
      </span>
    </>
  );
}

"use client";

import { useEffect, useState } from "react";

export function AnimatedHeroTitle({ phrases }: { phrases: readonly string[] }) {
  const initialPhrase = phrases[0] ?? "KULHA!";
  const [visibleText, setVisibleText] = useState(initialPhrase);

  useEffect(() => {
    if (!phrases.length) {
      setVisibleText("KULHA!");
      return;
    }

    const firstPhrase = phrases[0];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || phrases.length === 1) {
      setVisibleText(firstPhrase);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let phraseIndex = 0;
    let characterIndex = Array.from(firstPhrase).length;
    let deleting = true;
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
        phraseIndex = (phraseIndex + 1) % phrases.length;
        deleting = false;
        timer = setTimeout(typeNext, 260);
      } else {
        timer = setTimeout(tick, 25);
      }
    }

    setVisibleText(firstPhrase);
    timer = setTimeout(tick, 2600);
    return () => { if (timer) clearTimeout(timer); };
  }, [phrases]);

  return (
    <>
      <span className="sr-only">{initialPhrase}</span>
      <span className="hero-typewriter" aria-hidden="true" dir="auto">
        {visibleText}<span className="hero-typewriter-cursor" />
      </span>
    </>
  );
}

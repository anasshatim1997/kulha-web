"use client";

import { useEffect, useState } from "react";
import { KulhaCurtain } from "@/components/navigation/KulhaCurtain";

export function SubmitProgress({ title, detail, active }: { title: string; detail: string; active: boolean }) {
  const [safetyExpired, setSafetyExpired] = useState(false);
  useEffect(() => {
    if (!active) {
      setSafetyExpired(false);
      return;
    }
    setSafetyExpired(false);
    const timeout = setTimeout(() => setSafetyExpired(true), 18000);
    return () => clearTimeout(timeout);
  }, [active]);
  return <KulhaCurtain active={active && !safetyExpired} message={`${title} ${detail}`} label={title}/>;
}

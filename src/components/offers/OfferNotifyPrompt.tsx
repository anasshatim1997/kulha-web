"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";

export function OfferNotifyPrompt({ locale, title, body, cta }: { locale: SiteLocale; title: string; body: string; cta: string }) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 7200);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!visible || engaged || closing) return;
    hideTimer.current = setTimeout(() => setClosing(true), 8500);
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [visible, engaged, closing]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setVisible(false), 360);
    return () => clearTimeout(timer);
  }, [closing]);

  if (!visible) return null;
  const dismiss = () => setClosing(true);
  return (
    <aside className={"kulha-notify-prompt" + (closing ? " is-closing" : "")} role="complementary" aria-label={title} onPointerEnter={() => setEngaged(true)} onFocusCapture={() => setEngaged(true)}>
      <div className="kulha-notify-prompt-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-2.5 7-2.5 9h17C20.5 16 18 16 18 9ZM10 21h4" /></svg></div>
      <div className="kulha-notify-prompt-copy"><h2>{title}</h2><p>{body}</p><Link href={locale === "fr" ? "/register" : "/" + locale + "/register"}>{cta}</Link></div>
      <button type="button" className="kulha-notify-prompt-close" aria-label={locale === "fr" ? "Fermer" : locale === "ar" ? "إغلاق" : "Dismiss"} onClick={dismiss}><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg></button>
    </aside>
  );
}
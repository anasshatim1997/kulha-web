"use client";

import { useState } from "react";
import { SubmitProgress } from "@/components/auth/SubmitProgress";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";

export function GoogleOAuthButton({ locale = "fr", disabled = false }: { locale?: SiteLocale; disabled?: boolean }) {
  const t = authCopy[locale];
  const [redirecting, setRedirecting] = useState(false);

  return (
    <div className="auth-google-auth">
      {redirecting && <SubmitProgress title={t.googleContinue} detail={t.googleRedirect} />}
      <a
        className={`auth-google-button${disabled || redirecting ? " is-disabled" : ""}`}
        href="/api/auth/google"
        aria-disabled={disabled || redirecting || undefined}
        tabIndex={disabled || redirecting ? -1 : 0}
        onClick={(event) => {
          if (disabled || redirecting) { event.preventDefault(); return; }
          setRedirecting(true);
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20" focusable="false">
          <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z" />
          <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44Z" />
          <path fill="#FBBC05" d="M12.8 27.7a12 12 0 0 1 0-7.4V15H5.9a20 20 0 0 0 0 18l6.9-5.3Z" />
          <path fill="#EA4335" d="M24 12.1c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.9 15l6.9 5.3c1.6-4.7 6-8.2 11.2-8.2Z" />
        </svg>
        <span>{t.googleContinue}</span>
      </a>
      <div className="auth-social-divider" aria-hidden="true"><span>{t.orEmail}</span></div>
    </div>
  );
}

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";

type AuthMode = "login" | "register";

/** Split account surface: a clear KULHA! welcome on one half and a focused form on the other. */
export function AuthCard({
  title,
  lead,
  children,
  locale = "fr",
  mode,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
  locale?: SiteLocale;
  mode?: AuthMode;
}) {
  const copy = authCopy[locale];
  const direction = locale === "ar" ? "rtl" : "ltr";
  const panelTitle = mode === "login" ? copy.panelLoginTitle : mode === "register" ? copy.panelRegisterTitle : copy.panelTitle;
  const panelLead = mode === "login" ? copy.panelLoginLead : mode === "register" ? copy.panelRegisterLead : copy.panelLead;

  return (
    <div className="content-page auth-layout" dir={direction} lang={locale === "ar" ? "ar-MA" : locale}>
      <aside className={`auth-benefit-panel${mode ? ` auth-benefit-panel-${mode}` : ""}`}>
        <div className="auth-panel-main">
          <span className="auth-eyebrow">KULHA! <span aria-hidden="true">·</span> {copy.eyebrow}</span>
          <h2>{panelTitle}</h2>
          <p>{panelLead}</p>
          <div className="auth-benefit-showcase">
            <div className="auth-benefit-points">
              {copy.points.map((point) => <span key={point}><i aria-hidden="true">✓</i>{point}</span>)}
            </div>
            <Image
              src="/brand/kulha-bag.png"
              alt=""
              width={300}
              height={275}
              priority
              className="auth-benefit-logo"
            />
          </div>
        </div>
        <div className="auth-panel-bottom">
          <div className="auth-merchant-invite">
            <span>{copy.merchantPrompt}</span>
            <Link href={localePath(locale, "/for-shops")}>{copy.merchantCta}<span aria-hidden="true"> ↗</span></Link>
          </div>
        </div>
      </aside>

      <section className="auth-form-shell" aria-labelledby="auth-title">
        <div className="auth-form-wrap">
          <Card className={`auth-form-card${mode === "register" ? " auth-register-card" : " auth-login-card"}`}>
            {mode && (
              <nav className="auth-mode-switch" aria-label={locale === "ar" ? "نوع الوصول" : locale === "en" ? "Account access" : "Accès au compte"}>
                <Link href={localePath(locale, "/login")} aria-current={mode === "login" ? "page" : undefined} className={mode === "login" ? "is-active" : ""}>{copy.modeLogin}</Link>
                <Link href={localePath(locale, "/register")} aria-current={mode === "register" ? "page" : undefined} className={mode === "register" ? "is-active" : ""}>{copy.modeRegister}</Link>
              </nav>
            )}
            <p className="section-kicker auth-form-kicker">{copy.eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            {lead && <p className="auth-form-lead">{lead}</p>}
            <div className={`auth-form-content${mode === "register" ? " auth-register-scroll" : ""}`}>{children}</div>
            <p className="auth-security-note"><span aria-hidden="true">✓</span>{copy.secureNote}</p>
          </Card>
        </div>
      </section>
    </div>
  );
}

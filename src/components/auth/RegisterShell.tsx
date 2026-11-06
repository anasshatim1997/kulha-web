import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { authCopy } from "@/lib/i18n/auth-copy";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";
import type { Audience } from "./register/useRegistration";
import styles from "./Register.module.css";

type Props = { audience: Audience; locale?: SiteLocale; title: string; lead?: string; children: ReactNode };

const tick = (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);

/**
 * Sign-up page frame, split 50 / 50: welcome panel on one half, the form on the other.
 * The customer and the shop owner each get their own welcome message and a link to the other path.
 */
export function RegisterShell({ audience, locale = "fr", title, lead, children }: Props) {
  const copy = authCopy[locale];
  const merchant = audience === "MERCHANT";
  const direction = locale === "ar" ? "rtl" : "ltr";
  const panel = merchant
    ? { badge: copy.merchantBadge, title: copy.merchantPanelTitle, lead: copy.merchantPanelLead, points: copy.merchantPoints, prompt: copy.customerPrompt, cta: copy.customerCta, href: "/register" }
    : { badge: copy.customerBadge, title: copy.panelRegisterTitle, lead: copy.panelRegisterLead, points: copy.points, prompt: copy.merchantPrompt, cta: copy.merchantCta, href: "/register/merchant" };

  return (
    <div className={`${styles.page} kulha-fill`} dir={direction} lang={locale === "ar" ? "ar-MA" : locale}>
      <aside className={styles.aside}>
        <p className={styles.badge}>{panel.badge}</p>
        <h2 className={styles.asideTitle}>{panel.title}</h2>
        <p className={styles.asideLead}>{panel.lead}</p>
        <ul className={styles.points}>
          {panel.points.map((point, index) => (
            <li key={point}>
              <span aria-hidden="true">{merchant ? index + 1 : tick}</span>
              {point}
            </li>
          ))}
        </ul>
        <div className={styles.bagWrap}>
          <Image src="/brand/kulha-bag.png" alt="" fill priority sizes="(max-width: 900px) 0px, 40vw" className={styles.bag} />
        </div>
        <div className={styles.invite}>
          <span>{panel.prompt}</span>
          <Link href={localePath(locale, panel.href)}>{panel.cta}</Link>
        </div>
      </aside>

      <section className={styles.formSide} aria-labelledby="auth-title">
        <div className={styles.card}>
          <h1 id="auth-title" className={styles.cardTitle}>{title}</h1>
          {lead && <p className={styles.cardLead}>{lead}</p>}
          <div className={styles.body}>{children}</div>
          <p className={styles.switch}>{copy.haveAccount} <Link href={localePath(locale, "/login")}>{copy.loginSubmit}</Link></p>
          <p className={styles.secure}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6l-7-3Z" /><path d="m9 12 2.2 2.2L15.5 10" /></svg>
            <span>{copy.secureNote}</span>
          </p>
        </div>
      </section>
    </div>
  );
}

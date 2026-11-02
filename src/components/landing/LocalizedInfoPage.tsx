import Link from "next/link";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { InfoPageCopy } from "@/lib/i18n/page-copy";
import { localePath } from "@/lib/navigation";

export function LocalizedInfoPage({ locale, page, slug }: { locale: SiteLocale; page: InfoPageCopy; slug?: string }) {
  const direction = locale === "ar" ? "rtl" : "ltr";
  const ctaHref = slug === "for-shops" ? "/register?accountType=merchant" : "/register";
  return (
    <div className="content-page locale-info" dir={direction} lang={locale === "ar" ? "ar-MA" : locale}>
      <p className="section-kicker">{page.eyebrow}</p>
      <h1>{page.title}</h1>
      <p className="page-lead">{page.lead}</p>
      {page.faq?.length ? (
        <div className="content-panel info-faq-list">
          {page.faq.map(([question, answer], index) => (
            <details key={question} className="info-faq-item" open={index === 0}>
              <summary>{question}<b aria-hidden="true">＋</b></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      ) : (
        <div className="content-list info-sections">
          {page.sections.map((section) => (
            <article className="content-tile" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.bullets?.length ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            </article>
          ))}
        </div>
      )}
      <div className="content-panel info-cta">
        <h2>{page.ctaTitle}</h2>
        <p>{page.ctaBody}</p>
        <Link href={localePath(locale, ctaHref)} className="button button-yellow">{page.cta}<span aria-hidden="true">↗</span></Link>
      </div>
    </div>
  );
}

import type { SiteLocale } from "@/lib/i18n/site-copy";
import type { LegalDocumentCopy } from "@/lib/i18n/legal-copy";
import styles from "./LegalPolicyPage.module.css";

export function LegalPolicyPage({ locale, document }: { locale: SiteLocale; document: LegalDocumentCopy }) {
  const direction = locale === "ar" ? "rtl" : "ltr";
  const language = locale === "ar" ? "ar-MA" : locale === "fr" ? "fr-MA" : "en";

  return (
    <article className={`content-page ${styles.page}`} dir={direction} lang={language}>
      <p className="section-kicker">{document.eyebrow}</p>
      <h1>{document.title}</h1>
      <p className="page-lead">{document.lead}</p>

      <aside className={styles.draftNotice} role="note" aria-label={document.draftNoticeTitle}>
        <strong>{document.draftNoticeTitle}</strong>
        <p>{document.draftNotice}</p>
      </aside>

      <p className={styles.version}>
        {document.versionLabel}: 0.9 <span aria-hidden="true">·</span> {document.updatedLabel}: {document.updatedDate}
      </p>

      <div className={`content-list info-sections ${styles.sections}`}>
        {document.sections.map((section, index) => (
          <section className="content-tile" key={`${index}-${section.title}`}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p key={paragraphIndex}>{paragraph}</p>
            ))}
            {section.bullets?.length ? (
              <ul>
                {section.bullets.map((bullet, bulletIndex) => <li key={bulletIndex}>{bullet}</li>)}
              </ul>
            ) : null}
          </section>
        ))}
      </div>

      <section className={`content-panel ${styles.references}`}>
        <h2>{document.referencesTitle}</h2>
        <ul>
          {document.references.map((reference) => (
            <li key={reference.url}>
              <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.label}</a>
            </li>
          ))}
        </ul>
      </section>

      <aside className={styles.completion}>
        <h2>{document.completionTitle}</h2>
        <p>{document.completionBody}</p>
      </aside>
    </article>
  );
}

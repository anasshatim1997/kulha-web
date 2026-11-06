"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import { localePath } from "@/lib/navigation";
import styles from "./PolicyAcknowledgementModal.module.css";

type PolicyAcknowledgementModalProps = {
  locale: SiteLocale;
  title: string;
  body: string;
  termsSummaryTitle: string;
  termsSummary: string[];
  privacySummaryTitle: string;
  privacySummary: string[];
  draftNotice: string;
  readMoreLabel: string;
  requiredNote: string;
  checkboxLabel: string;
  termsLabel: string;
  privacyLabel: string;
  acceptLabel: string;
  cancelLabel: string;
  closeLabel: string;
  onAccept: () => void;
  onClose: () => void;
};

export function PolicyAcknowledgementModal({
  locale,
  title,
  body,
  termsSummaryTitle,
  termsSummary,
  privacySummaryTitle,
  privacySummary,
  draftNotice,
  readMoreLabel,
  requiredNote,
  checkboxLabel,
  termsLabel,
  privacyLabel,
  acceptLabel,
  cancelLabel,
  closeLabel,
  onAccept,
  onClose,
}: PolicyAcknowledgementModalProps) {
  const [checked, setChecked] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const checkboxId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const noteId = useId();
  const rtl = locale === "ar";

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    checkboxRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], summary, input:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0); // skip links inside collapsed summaries
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} dir={rtl ? "rtl" : "ltr"}>
      <section
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={`${descriptionId} ${noteId}`}
        tabIndex={-1}
      >
        <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
          ×
        </button>
        <div className={styles.icon} aria-hidden="true">!</div>
        <p className={styles.eyebrow}>KULHA!</p>
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <p id={descriptionId} className={styles.body}>{body}</p>

        <div className={styles.summaryGrid}>
          <details className={styles.disclosure}>
            <summary>{termsSummaryTitle}</summary>
            <div className={styles.disclosureBody}>
              <ul>
                {termsSummary.map((item, index) => <li key={`terms-${index}`}>{item}</li>)}
              </ul>
              <Link className={styles.readMore} href={localePath(locale, "/terms")} target="_blank" rel="noopener noreferrer">
                {readMoreLabel}: {termsLabel}<span aria-hidden="true"> ↗</span>
              </Link>
            </div>
          </details>
          <details className={styles.disclosure}>
            <summary>{privacySummaryTitle}</summary>
            <div className={styles.disclosureBody}>
              <ul>
                {privacySummary.map((item, index) => <li key={`privacy-${index}`}>{item}</li>)}
              </ul>
              <Link className={styles.readMore} href={localePath(locale, "/privacy")} target="_blank" rel="noopener noreferrer">
                {readMoreLabel}: {privacyLabel}<span aria-hidden="true"> ↗</span>
              </Link>
            </div>
          </details>
        </div>

        <p className={styles.draftNotice}>{draftNotice}</p>
        <div className={styles.consent}>
          <input
            ref={checkboxRef}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <label htmlFor={checkboxId}>{checkboxLabel}</label>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onClose}>{cancelLabel}</button>
          <button type="button" className={styles.acknowledge} disabled={!checked} onClick={onAccept}>
            {acceptLabel}
          </button>
        </div>
        <p id={noteId} className={styles.note}>{requiredNote}</p>
      </section>
    </div>
  );
}

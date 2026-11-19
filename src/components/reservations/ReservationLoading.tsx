"use client";

import styles from "./ReservationScreens.module.css";

export function ReservationLoading({ label }: { label: string }) {
  return (
    <section className={styles.availabilityLoading} role="status" aria-live="polite">
      <div className={styles.availabilityLoaderMark} aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none">
          <path d="M13 17h22l-2 24H15l-2-24Z" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M18 17v-4a6 6 0 0 1 12 0v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M24 24c-4 1-6 4-6 8 4 0 7-2 8-6 1 3 3 4 6 4 0-4-3-6-8-6Z" fill="#ee3f29" />
        </svg>
        <span />
      </div>
      <div className={styles.availabilityLoaderCopy}>
        <strong className={styles.availabilityBrandWord}>KULHA<span>!</span></strong>
        <p>{label}</p>
        <div className={styles.availabilityLoaderTrack} aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}

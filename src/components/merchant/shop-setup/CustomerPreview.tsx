import { groupWeek, type DayKey, type WeekSchedule } from "@/lib/merchant/opening-hours";
import type { ShopSetupCopy } from "@/lib/i18n/shop-setup-copy";
import styles from "./ShopSetup.module.css";

/** `Mon–Fri 08:00–19:00 · Sat 09:00–14:00 · Sun closed` */
export function formatPreviewHours(week: WeekSchedule, daysShort: Record<DayKey, string>, closedLabel: string): string {
  return groupWeek(week)
    .map((group) => {
      const days = group.from === group.to ? daysShort[group.from] : `${daysShort[group.from]}–${daysShort[group.to]}`;
      return group.open ? `${days} ${group.opens}–${group.closes}` : `${days} ${closedLabel.toLocaleLowerCase()}`;
    })
    .join(" · ");
}

type Props = {
  copy: ShopSetupCopy;
  name: string;
  namePlaceholder: string;
  meta: string;
  hours: string | null;
};

/** The "What customers will see" card and the note under it. Fills in live as the owner types. */
export function CustomerPreview({ copy, name, namePlaceholder, meta, hours }: Props) {
  const trimmed = name.trim();
  return (
    <aside className={styles.aside} aria-label={copy.previewLabel}>
      <div className={styles.preview}>
        <p className={styles.previewEyebrow}>{copy.previewLabel}</p>
        <div className={styles.previewShop}>
          <span className={styles.avatar} aria-hidden="true">{trimmed ? Array.from(trimmed)[0]?.toLocaleUpperCase() : "K"}</span>
          <div className={styles.previewId}>
            <strong className={trimmed ? undefined : styles.isEmpty}>{trimmed || namePlaceholder}</strong>
            {meta && <span>{meta}</span>}
          </div>
        </div>
        <div className={styles.previewHours}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5V12l3 2" />
          </svg>
          <div>
            <span>{copy.previewHours}</span>
            <strong className={hours ? undefined : styles.isEmpty}>{hours ?? "—"}</strong>
          </div>
        </div>
      </div>
      <p className={styles.previewNote}>{copy.reviewNote}</p>
    </aside>
  );
}

import type { ReactNode } from "react";
import styles from "./ShopSetup.module.css";

type Props = {
  label: string;
  steps: readonly string[];
  current: number;
  onGoTo: (index: number) => void;
};

function CheckIcon(): ReactNode {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

/** Three numbered steps joined by lines. Finished steps can be reopened; later ones stay locked. */
export function SetupStepper({ label, steps, current, onGoTo }: Props) {
  return (
    <ol className={styles.stepper} aria-label={label}>
      {steps.map((title, index) => {
        const done = index < current;
        const active = index === current;
        const state = done ? styles.stepDone : active ? styles.stepActive : "";
        return (
          <li key={title} className={`${styles.step} ${state}`} aria-current={active ? "step" : undefined}>
            <button type="button" className={styles.stepButton} disabled={index >= current} onClick={() => onGoTo(index)}>
              <span className={styles.stepDot} aria-hidden="true">{done ? <CheckIcon /> : index + 1}</span>
              <span className={styles.stepLabel}>{title}</span>
            </button>
            {index < steps.length - 1 && <span className={styles.stepLine} aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

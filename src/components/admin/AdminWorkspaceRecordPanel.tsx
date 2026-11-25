"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./AdminWorkspaceRecordPanel.module.css";

type Props = {
  open: boolean;
  title: string;
  closeLabel: string;
  direction?: "ltr" | "rtl";
  dirty?: boolean;
  confirmDiscard: string;
  onClose: () => void;
  children: ReactNode;
};

/** Inline record panel for the tabbed workspace; it is deliberately non-modal. */
export function AdminWorkspaceRecordPanel({
  open, title, closeLabel, direction = "ltr", dirty = false, confirmDiscard, onClose, children,
}: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const dirtyRef = useRef(dirty);
  const confirmRef = useRef(confirmDiscard);

  useEffect(() => {
    onCloseRef.current = onClose;
    dirtyRef.current = dirty;
    confirmRef.current = confirmDiscard;
  }, [onClose, dirty, confirmDiscard]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;
  return (
    <section className={styles.panel} dir={direction} aria-label={title} data-testid="workspace-record-panel">
      <header className={styles.header}>
        <h2>{title}</h2>
        <button ref={closeRef} type="button" className={styles.close} aria-label={closeLabel}
          onClick={() => {
            if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
            onCloseRef.current();
          }}>×</button>
      </header>
      <div className={styles.content}>{children}</div>
    </section>
  );
}

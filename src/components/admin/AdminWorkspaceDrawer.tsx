"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./AdminWorkspaceDrawer.module.css";

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

export function AdminWorkspaceDrawer({ open, title, closeLabel, direction = "ltr", dirty = false, confirmDiscard, onClose, children }: Props) {
  const panelRef = useRef<HTMLElement>(null);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
        onCloseRef.current();
      }
      if (event.key === "Tab" && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
        if (!nodes.length) { event.preventDefault(); panelRef.current.focus(); return; }
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className={styles.backdrop} data-testid="workspace-drawer-backdrop" onMouseDown={event => {
      if (event.target !== event.currentTarget) return;
      if (dirty && !window.confirm(confirmDiscard)) return;
      onCloseRef.current();
    }}>
      <aside dir={direction} ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={styles.drawer} data-testid="workspace-drawer">
        <header className={styles.header}>
          <h2>{title}</h2>
          <button ref={closeRef} type="button" className={styles.close} aria-label={closeLabel} onClick={() => {
            if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
            onClose();
          }}>×</button>
        </header>
        <div className={styles.content}>{children}</div>
      </aside>
    </div>,
    document.body
  );
}

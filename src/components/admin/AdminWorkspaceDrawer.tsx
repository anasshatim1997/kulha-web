"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./AdminWorkspaceDrawer.module.css";

type Props = {
  open: boolean;
  title: string;
  closeLabel: string;
  direction?: "ltr" | "rtl";
  dirty?: boolean;
  confirmDiscard: string;
  modalBreakpoint?: number;
  rtlSide?: "left" | "right";
  presentation?: "responsive" | "drawer" | "modal";
  onClose: () => void;
  children: ReactNode;
};

export function AdminWorkspaceDrawer({ open, title, closeLabel, direction = "ltr", dirty = false, confirmDiscard, modalBreakpoint = 700, rtlSide = "right", presentation = "responsive", onClose, children }: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const dirtyRef = useRef(dirty);
  const confirmRef = useRef(confirmDiscard);
  const [viewportModal, setViewportModal] = useState(false);
  const modalPresentation = presentation === "modal" || (presentation === "responsive" && viewportModal);

  useEffect(() => {
    onCloseRef.current = onClose;
    dirtyRef.current = dirty;
    confirmRef.current = confirmDiscard;
  }, [onClose, dirty, confirmDiscard]);

  useEffect(() => {
    if (presentation !== "responsive") return;
    const media = window.matchMedia("(max-width: " + modalBreakpoint + "px)");
    const update = () => setViewportModal(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [modalBreakpoint, presentation]);

  useEffect(() => {
    if (!open) return;
    const previousRootOverflow = document.documentElement.style.overflow;
    if (modalPresentation) document.documentElement.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
        onCloseRef.current();
        return;
      }
      if (modalPresentation && event.key === "Tab" && panelRef.current) {
        const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
        if (!nodes.length) { event.preventDefault(); panelRef.current.focus(); return; }
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (modalPresentation) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target || panelRef.current?.contains(target)) return;
      if (target.closest('[data-testid="merchant-review-list"],[data-testid="offer-queue"],[data-testid="support-case-list"]')) return;
      if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
      onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onDocumentPointerDown, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onDocumentPointerDown, true);
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [open, modalPresentation]);

  const requestClose = () => {
    if (dirtyRef.current && !window.confirm(confirmRef.current)) return;
    onCloseRef.current();
  };

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      className={modalPresentation ? styles.modalBackdrop : styles.backdrop + " " + styles.desktop + (direction === "rtl" && rtlSide === "left" ? " " + styles.rtlLeft : "")}
      data-testid={modalPresentation ? "workspace-modal-backdrop" : "workspace-drawer-backdrop"}
      onClick={event => { if (modalPresentation && event.target === event.currentTarget) requestClose(); }}
    >
      <aside
        dir={direction}
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal={modalPresentation ? true : undefined}
        aria-labelledby="admin-workspace-dialog-title"
        className={modalPresentation ? styles.drawer + " " + styles.modalPanel : styles.drawer}
        data-testid={modalPresentation ? "workspace-modal" : "workspace-drawer"}
        onClick={event => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="admin-workspace-dialog-title">{title}</h2>
          <button ref={closeRef} type="button" className={styles.close} aria-label={closeLabel} onClick={requestClose}>×</button>
        </header>
        <div className={styles.content}>{children}</div>
      </aside>
    </div>,
    document.body
  );
}

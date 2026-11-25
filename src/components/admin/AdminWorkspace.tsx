"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/session/SessionProvider";
import type { SiteLocale } from "@/lib/i18n/site-copy";
import {
  closeWorkspaceTab, createWorkspaceTab, emptyAdminWorkspaceState, persistableWorkspace,
  restoreWorkspace, upsertWorkspaceTab, workspaceStorageKey,
  type AdminWorkspaceState, type AdminWorkspaceTab,
} from "./admin-workspace-state";
import styles from "./AdminWorkspace.module.css";

type WorkspaceContextValue = {
  state: AdminWorkspaceState;
  openTab: (href: string, title?: string) => void;
  closeTab: (id: string) => void;
  setDraft: (tabId: string, key: string, value: unknown) => void;
  clearDraft: (tabId: string, key?: string) => void;
};
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function routeTab(href: string, locale: SiteLocale, title?: string): AdminWorkspaceTab | null {
  const url = new URL(href, window.location.origin);
  const tab = createWorkspaceTab(url.pathname, url.search, locale);
  return tab && title ? { ...tab, title } : tab;
}

export function useAdminWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useAdminWorkspace must be used inside AdminWorkspaceProvider");
  return value;
}

export function AdminWorkspaceProvider({ locale, children }: { locale: SiteLocale; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state: session } = useSession();
  const userId = session.status === "authenticated" ? session.user.id : null;
  const [state, setState] = useState<AdminWorkspaceState>(emptyAdminWorkspaceState);
  const [readyUser, setReadyUser] = useState<string | null>(null);
  const visibleState = readyUser === userId ? state : emptyAdminWorkspaceState;

  useEffect(() => {
    if (!userId) {
      setState(emptyAdminWorkspaceState);
      setReadyUser(null);
      return;
    }
    let restored = emptyAdminWorkspaceState;
    try {
      const raw = window.sessionStorage.getItem(workspaceStorageKey(userId));
      if (raw) restored = restoreWorkspace(JSON.parse(raw));
    } catch {
      // Storage can be unavailable in hardened browser contexts; keep the workspace usable in memory.
    }
    const current = createWorkspaceTab(window.location.pathname, window.location.search, locale);
    if (current) restored = upsertWorkspaceTab(restored, current);
    setState(restored);
    setReadyUser(userId);
  }, [userId, locale]);

  useEffect(() => {
    if (!userId || readyUser !== userId) return;
    try {
      window.sessionStorage.setItem(workspaceStorageKey(userId), JSON.stringify(persistableWorkspace(state)));
    } catch {
      // Quota and privacy-mode failures must not interrupt admin work.
    }
  }, [state, userId, readyUser]);

  useEffect(() => {
    if (!userId || readyUser !== userId || !pathname) return;
    const tab = createWorkspaceTab(pathname, window.location.search, locale);
    if (tab) setState(current => upsertWorkspaceTab(current, tab));
  }, [pathname, locale, userId, readyUser]);

  const openTab = useCallback((href: string, title?: string) => {
    const tab = routeTab(href, locale, title);
    if (!tab) return;
    setState(current => upsertWorkspaceTab(current, tab));
    router.push(tab.href);
  }, [locale, router]);

  const closeTab = useCallback((id: string) => {
    const next = closeWorkspaceTab(visibleState, id);
    setState(next);
    if (visibleState.activeTabId === id) {
      const target = next.tabs.find(tab => tab.id === next.activeTabId);
      if (target) router.push(target.href);
    }
  }, [router, visibleState]);

  const setDraft = useCallback((tabId: string, key: string, value: unknown) => {
    setState(current => ({ ...current, drafts: { ...current.drafts, [tabId]: { ...current.drafts[tabId], [key]: value } } }));
  }, []);
  const clearDraft = useCallback((tabId: string, key?: string) => {
    setState(current => {
      const drafts = { ...current.drafts };
      if (!key) delete drafts[tabId];
      else if (drafts[tabId]) {
        drafts[tabId] = { ...drafts[tabId] };
        delete drafts[tabId][key];
        if (!Object.keys(drafts[tabId]).length) delete drafts[tabId];
      }
      return { ...current, drafts };
    });
  }, []);

  const value = useMemo(() => ({ state: visibleState, openTab, closeTab, setDraft, clearDraft }), [visibleState, openTab, closeTab, setDraft, clearDraft]);
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function AdminWorkspaceTabs({ page, locale, children }: { page: string; locale: SiteLocale; children: ReactNode }) {
  const { state, openTab, closeTab } = useAdminWorkspace();
  const labels = locale === "fr"
    ? { close: "Fermer l’onglet", workspace: "Espace de travail" }
    : locale === "ar"
      ? { close: "إغلاق علامة التبويب", workspace: "مساحة العمل" }
      : { close: "Close tab", workspace: "Workspace" };

  return (
    <div className={styles.workspace} data-admin-workspace={page}>
      {state.tabs.length > 0 && (
        <nav className={styles.tabBar} aria-label={labels.workspace} role="tablist">
          {state.tabs.map(tab => (
            <div className={styles.tabItem} key={tab.id}>
              <button type="button" role="tab" aria-selected={state.activeTabId === tab.id}
                aria-controls="admin-workspace-panel"
                className={state.activeTabId === tab.id ? styles.activeTab : styles.tab}
                onClick={() => openTab(tab.href)}>
                <span>{tab.title}</span>
              </button>
              {state.tabs.length > 1 && (
                <button type="button" className={styles.closeTab} aria-label={labels.close + ": " + tab.title}
                  onClick={() => closeTab(tab.id)}>×</button>
              )}
            </div>
          ))}
        </nav>
      )}
      <div id="admin-workspace-panel" role={state.tabs.length ? "tabpanel" : undefined} tabIndex={state.tabs.length ? 0 : undefined}>
        {children}
      </div>
    </div>
  );
}

export const ADMIN_WORKSPACE_STORAGE_VERSION = 1;
export const ADMIN_WORKSPACE_STORAGE_PREFIX = "kulha:admin-workspace:v1:";

export type AdminWorkspacePage = "merchant-review" | "offer-moderation" | "support-cases" | "audit-log";
export type AdminWorkspaceTab = {
  id: string; href: string; page: AdminWorkspacePage; title: string; openedAt: number; lastActiveAt: number;
};
export type AdminWorkspaceState = {
  tabs: AdminWorkspaceTab[]; activeTabId: string | null;
  // Drafts intentionally remain memory-only. They may contain operational or customer data.
  drafts: Record<string, Record<string, unknown>>;
};
export type PersistedAdminWorkspace = {
  version: typeof ADMIN_WORKSPACE_STORAGE_VERSION; tabs: AdminWorkspaceTab[]; activeTabId: string | null;
};
export const emptyAdminWorkspaceState: AdminWorkspaceState = { tabs: [], activeTabId: null, drafts: {} };

export function workspaceStorageKey(userId: string): string {
  return ADMIN_WORKSPACE_STORAGE_PREFIX + encodeURIComponent(userId);
}
export function pageFromPath(pathname: string): AdminWorkspacePage | null {
  const match = pathname.match(/\/admin\/(merchant-review|offer-moderation|support-cases|audit-log)(?:\/|$)/);
  return (match?.[1] as AdminWorkspacePage | undefined) ?? null;
}
export function titleForWorkspacePath(pathname: string, locale: string): string {
  const page = pageFromPath(pathname);
  const labels: Record<string, Record<AdminWorkspacePage, string>> = {
    en: { "merchant-review": "Merchant review", "offer-moderation": "Offer moderation", "support-cases": "Support cases", "audit-log": "Audit log" },
    fr: { "merchant-review": "Revue des commerces", "offer-moderation": "Modération des offres", "support-cases": "Dossiers support", "audit-log": "Journal d’audit" },
    ar: { "merchant-review": "مراجعة المتاجر", "offer-moderation": "مراجعة العروض", "support-cases": "حالات الدعم", "audit-log": "سجل التدقيق" },
  };
  if (!page) return locale === "ar" ? "مساحة العمل" : locale === "fr" ? "Espace de travail" : "Workspace";
  if (pathname.includes("/merchant-review/")) return locale === "ar" ? "ملف المتجر" : locale === "fr" ? "Fiche commerce" : "Merchant record";
  return (labels[locale] ?? labels.en)[page];
}
export function createWorkspaceTab(pathname: string, search: string, locale: string, now = Date.now()): AdminWorkspaceTab | null {
  const page = pageFromPath(pathname);
  if (!page) return null;
  const href = pathname + (search ? (search.startsWith("?") ? search : "?" + search) : "");
  return { id: pathname, href, page, title: titleForWorkspacePath(pathname, locale), openedAt: now, lastActiveAt: now };
}
export function upsertWorkspaceTab(state: AdminWorkspaceState, tab: AdminWorkspaceTab): AdminWorkspaceState {
  const exists = state.tabs.some(item => item.id === tab.id);
  return {
    ...state,
    tabs: exists ? state.tabs.map(item => item.id === tab.id ? { ...item, href: tab.href, title: tab.title, lastActiveAt: tab.lastActiveAt } : item) : [...state.tabs, tab],
    activeTabId: tab.id,
  };
}
export function closeWorkspaceTab(state: AdminWorkspaceState, id: string): AdminWorkspaceState {
  const index = state.tabs.findIndex(tab => tab.id === id);
  if (index < 0) return state;
  const tabs = state.tabs.filter(tab => tab.id !== id);
  const drafts = { ...state.drafts };
  delete drafts[id];
  const activeTabId = state.activeTabId === id ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? null) : state.activeTabId;
  return { ...state, tabs, activeTabId, drafts };
}
export function persistableWorkspace(state: AdminWorkspaceState): PersistedAdminWorkspace {
  return { version: ADMIN_WORKSPACE_STORAGE_VERSION, tabs: state.tabs, activeTabId: state.activeTabId };
}
export function restoreWorkspace(value: unknown): AdminWorkspaceState {
  if (!value || typeof value !== "object") return emptyAdminWorkspaceState;
  const stored = value as Partial<PersistedAdminWorkspace>;
  if (stored.version !== ADMIN_WORKSPACE_STORAGE_VERSION || !Array.isArray(stored.tabs)) return emptyAdminWorkspaceState;
  const tabs = stored.tabs.filter((tab): tab is AdminWorkspaceTab =>
    !!tab && typeof tab === "object" && typeof tab.id === "string" && typeof tab.href === "string" &&
    typeof tab.title === "string" && ["merchant-review", "offer-moderation", "support-cases", "audit-log"].includes(String(tab.page)) &&
    typeof tab.openedAt === "number" && typeof tab.lastActiveAt === "number"
  );
  const lastTabId = tabs.length ? tabs[tabs.length - 1].id : null;
  const activeTabId = tabs.some(tab => tab.id === stored.activeTabId) ? stored.activeTabId! : lastTabId;
  return { tabs, activeTabId, drafts: {} };
}

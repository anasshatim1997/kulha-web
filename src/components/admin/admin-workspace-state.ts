export const ADMIN_WORKSPACE_STORAGE_VERSION = 1;
export const ADMIN_WORKSPACE_STORAGE_PREFIX = "kulha:admin-workspace:v1:";

export type AdminWorkspacePage = "merchant-review" | "offer-moderation" | "support-cases" | "audit-log";
export type AdminWorkspaceTab = {
  id: string;
  href: string;
  page: AdminWorkspacePage;
  title: string;
  openedAt: number;
  lastActiveAt: number;
};
export type AdminWorkspaceState = {
  tabs: AdminWorkspaceTab[];
  activeTabId: string | null;
  // Runtime drafts may contain sensitive form values; the persistence boundary is explicitly allowlisted below.
  drafts: Record<string, Record<string, unknown>>;
};
export type SafeAdminWorkspaceDraft = Partial<{
  merchantAction: "approve" | "request-information" | "reject" | null;
  merchantChecks: [boolean, boolean, boolean];
  offerAction: "suspend" | "request-edit" | "reinstate";
  offerFilter: "" | "REPORTED" | "ALLERGENS_UNKNOWN" | "SUSPENDED";
  offerPage: number;
  supportStatus: "OPEN" | "ESCALATED" | "WAITING_REPLY" | "RESOLVED";
  supportPage: number;
  auditPage: number;
  supportAction: "CONTACT_SHOP" | "ESCALATE" | "RESOLVE" | "KEEP_OFFER_HIDDEN";
  supportSendToCustomer: boolean;
  auditFrom: string;
  auditTo: string;
  auditAction: string;
  auditResult: "" | "SUCCESS" | "DENIED" | "FAILED";
  auditPageSize: 10 | 20 | 50;
}>;
export type PersistedAdminWorkspace = {
  version: typeof ADMIN_WORKSPACE_STORAGE_VERSION;
  tabs: AdminWorkspaceTab[];
  activeTabId: string | null;
  drafts: Record<string, SafeAdminWorkspaceDraft>;
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
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 3) {
    const recordId = decodeURIComponent(segments[segments.length - 1]).slice(0, 18);
    const prefixes: Record<string, Record<AdminWorkspacePage, string>> = {
      en: { "merchant-review": "Merchant · ", "offer-moderation": "Offer · ", "support-cases": "Case · ", "audit-log": "Audit · " },
      fr: { "merchant-review": "Commerce · ", "offer-moderation": "Offre · ", "support-cases": "Dossier · ", "audit-log": "Audit · " },
      ar: { "merchant-review": "متجر · ", "offer-moderation": "عرض · ", "support-cases": "حالة · ", "audit-log": "تدقيق · " },
    };
    return ((prefixes[locale] ?? prefixes.en)[page]) + recordId;
  }
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
    tabs: exists
      ? state.tabs.map(item => item.id === tab.id ? { ...item, href: tab.href, title: item.title || tab.title, lastActiveAt: tab.lastActiveAt } : item)
      : [...state.tabs, tab],
    activeTabId: tab.id,
  };
}

export function closeWorkspaceTab(state: AdminWorkspaceState, id: string): AdminWorkspaceState {
  const index = state.tabs.findIndex(tab => tab.id === id);
  if (index < 0) return state;
  const tabs = state.tabs.filter(tab => tab.id !== id);
  const drafts = { ...state.drafts };
  delete drafts[id];
  const activeTabId = state.activeTabId === id
    ? (tabs[Math.min(index, tabs.length - 1)]?.id ?? null)
    : state.activeTabId;
  return { ...state, tabs, activeTabId, drafts };
}

const safeDraftValidators: Record<string, (value: unknown) => boolean> = {
  merchantAction: value => value === null || value === "approve" || value === "request-information" || value === "reject",
  merchantChecks: value => Array.isArray(value) && value.length === 3 && value.every(item => typeof item === "boolean"),
  offerAction: value => value === "suspend" || value === "request-edit" || value === "reinstate",
  offerFilter: value => value === "" || value === "REPORTED" || value === "ALLERGENS_UNKNOWN" || value === "SUSPENDED",
  offerPage: value => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000,
  supportStatus: value => ["OPEN", "ESCALATED", "WAITING_REPLY", "RESOLVED"].includes(String(value)),
  supportPage: value => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000,
  auditPage: value => typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 10000,
  supportAction: value => ["CONTACT_SHOP", "ESCALATE", "RESOLVE", "KEEP_OFFER_HIDDEN"].includes(String(value)),
  supportSendToCustomer: value => typeof value === "boolean",
  auditFrom: value => typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)),
  auditTo: value => typeof value === "string" && (value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value)),
  auditAction: value => typeof value === "string" && value.length <= 64 && /^[A-Z0-9_]*$/.test(value),
  auditResult: value => value === "" || value === "SUCCESS" || value === "DENIED" || value === "FAILED",
  auditPageSize: value => value === 10 || value === 20 || value === 50,
};

export function sanitizeWorkspaceDraft(value: unknown): SafeAdminWorkspaceDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const safe: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const validate = safeDraftValidators[key];
    if (validate?.(item)) safe[key] = Array.isArray(item) ? [...item] : item;
  }
  return safe as SafeAdminWorkspaceDraft;
}

function safeWorkspaceHref(href: string): string {
  try {
    const url = new URL(href, "https://workspace.invalid");
    const allowed = new URLSearchParams();
    const queryValidators: Record<string, (value: string) => boolean> = {
      status: value => ["PENDING", "INFO_REQUIRED", "APPROVED", "REJECTED", "OPEN", "ESCALATED", "WAITING_REPLY", "RESOLVED"].includes(value),
      page: value => /^[0-9]{1,5}$/.test(value),
      size: value => ["1", "8", "10", "20", "50", "100"].includes(value),
      from: value => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value),
      to: value => /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value),
      action: value => /^[A-Z0-9_]{1,64}$/.test(value),
      result: value => ["SUCCESS", "DENIED", "FAILED"].includes(value),
      filter: value => ["", "REPORTED", "ALLERGENS_UNKNOWN", "SUSPENDED"].includes(value),
    };
    for (const [key, validate] of Object.entries(queryValidators)) {
      const value = url.searchParams.get(key);
      if (value !== null && validate(value)) allowed.set(key, value);
    }
    return url.pathname + (allowed.size ? "?" + allowed.toString() : "");
  } catch {
    return "/";
  }
}

function safeStoredTab(tab: AdminWorkspaceTab): AdminWorkspaceTab {
  return {
    ...tab,
    href: safeWorkspaceHref(tab.href),
    // Never persist a row title that may have been copied from user-entered content.
    title: titleForWorkspacePath(tab.id, tab.id.split("/").filter(Boolean)[0] ?? "en"),
  };
}

export function persistableWorkspace(state: AdminWorkspaceState): PersistedAdminWorkspace {
  const validTabs = state.tabs.filter(tab => pageFromPath(tab.id) === tab.page);
  const tabIds = new Set(validTabs.map(tab => tab.id));
  const drafts: Record<string, SafeAdminWorkspaceDraft> = {};
  for (const [tabId, draft] of Object.entries(state.drafts)) {
    if (!tabIds.has(tabId)) continue;
    const safe = sanitizeWorkspaceDraft(draft);
    if (Object.keys(safe).length) drafts[tabId] = safe;
  }
  return {
    version: ADMIN_WORKSPACE_STORAGE_VERSION,
    tabs: validTabs.map(safeStoredTab),
    activeTabId: tabIds.has(state.activeTabId ?? "") ? state.activeTabId : null,
    drafts,
  };
}

export function restoreWorkspace(value: unknown): AdminWorkspaceState {
  if (!value || typeof value !== "object") return emptyAdminWorkspaceState;
  const stored = value as Partial<PersistedAdminWorkspace>;
  if (stored.version !== ADMIN_WORKSPACE_STORAGE_VERSION || !Array.isArray(stored.tabs)) return emptyAdminWorkspaceState;
  const tabs = stored.tabs.filter((tab): tab is AdminWorkspaceTab =>
    !!tab && typeof tab === "object" &&
    typeof tab.id === "string" && typeof tab.href === "string" &&
    typeof tab.title === "string" &&
    ["merchant-review", "offer-moderation", "support-cases", "audit-log"].includes(String(tab.page)) &&
    pageFromPath(tab.id) === tab.page &&
    typeof tab.openedAt === "number" && typeof tab.lastActiveAt === "number"
  ).map(safeStoredTab);
  const activeTabId = tabs.some(tab => tab.id === stored.activeTabId) ? stored.activeTabId! : tabs.at(-1)?.id ?? null;
  const storedDrafts = stored.drafts && typeof stored.drafts === "object" ? stored.drafts : {};
  const allowedIds = new Set(tabs.map(tab => tab.id));
  const drafts: Record<string, Record<string, unknown>> = {};
  for (const [tabId, draft] of Object.entries(storedDrafts)) {
    if (allowedIds.has(tabId)) drafts[tabId] = sanitizeWorkspaceDraft(draft);
  }
  return { tabs, activeTabId, drafts };
}

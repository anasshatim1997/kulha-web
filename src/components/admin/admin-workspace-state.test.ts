import { describe, expect, it } from "vitest";
import {
  ADMIN_WORKSPACE_STORAGE_VERSION,
  closeWorkspaceTab,
  createWorkspaceTab,
  emptyAdminWorkspaceState,
  persistableWorkspace,
  restoreWorkspace,
  upsertWorkspaceTab,
  workspaceStorageKey,
} from "./admin-workspace-state";

describe("admin workspace state", () => {
  it("creates localized tabs for supported admin routes", () => {
    expect(createWorkspaceTab("/en/admin/merchant-review/merchant-1", "status=PENDING", "en", 10)).toMatchObject({
      id: "/en/admin/merchant-review/merchant-1",
      href: "/en/admin/merchant-review/merchant-1?status=PENDING",
      page: "merchant-review",
      title: "Merchant record",
      openedAt: 10,
    });
    expect(createWorkspaceTab("/en/account", "", "en")).toBeNull();
  });

  it("upserts by route identity and activates the tab", () => {
    const first = createWorkspaceTab("/en/admin/audit-log", "", "en", 1)!;
    const second = createWorkspaceTab("/en/admin/support-cases", "", "en", 2)!;
    const state = upsertWorkspaceTab(upsertWorkspaceTab(emptyAdminWorkspaceState, first), second);
    const updated = upsertWorkspaceTab(state, { ...first, href: "/en/admin/audit-log?actor=me", lastActiveAt: 3 });
    expect(updated.tabs).toHaveLength(2);
    expect(updated.tabs[0].href).toContain("actor=me");
    expect(updated.activeTabId).toBe(first.id);
  });

  it("closes a tab and selects the nearest remaining tab", () => {
    const a = createWorkspaceTab("/en/admin/audit-log", "", "en", 1)!;
    const b = createWorkspaceTab("/en/admin/support-cases", "", "en", 2)!;
    const state = upsertWorkspaceTab(upsertWorkspaceTab(emptyAdminWorkspaceState, a), b);
    expect(closeWorkspaceTab(state, b.id)).toMatchObject({ activeTabId: a.id, tabs: [a] });
  });

  it("persists versioned tab metadata but never persists drafts", () => {
    const tab = createWorkspaceTab("/en/admin/audit-log", "", "en", 1)!;
    const state = { ...upsertWorkspaceTab(emptyAdminWorkspaceState, tab), drafts: { [tab.id]: { internalNote: "unsaved" } } };
    const saved = persistableWorkspace(state);
    expect(saved.version).toBe(ADMIN_WORKSPACE_STORAGE_VERSION);
    expect(saved).not.toHaveProperty("drafts");
    expect(restoreWorkspace(saved).drafts).toEqual({});
    expect(restoreWorkspace({ version: 0, tabs: [tab] }).tabs).toEqual([]);
    expect(workspaceStorageKey("user/123")).toContain("user%2F123");
  });
});

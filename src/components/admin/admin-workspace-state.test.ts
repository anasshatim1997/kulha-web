import { describe, expect, it } from "vitest";
import {
  ADMIN_WORKSPACE_STORAGE_VERSION,
  closeWorkspaceTab,
  createWorkspaceTab,
  emptyAdminWorkspaceState,
  persistableWorkspace,
  restoreWorkspace,
  sanitizeWorkspaceDraft,
  upsertWorkspaceTab,
  workspaceStorageKey,
} from "./admin-workspace-state";

describe("admin workspace state", () => {
  it("creates localized tabs for queue and record routes", () => {
    expect(createWorkspaceTab("/en/admin/merchant-review/merchant-1", "", "en", 10)).toMatchObject({
      id: "/en/admin/merchant-review/merchant-1",
      page: "merchant-review",
      title: "Merchant · merchant-1",
      openedAt: 10,
    });
    expect(createWorkspaceTab("/en/admin/offer-moderation/offer-1", "", "en")?.title).toBe("Offer · offer-1");
    expect(createWorkspaceTab("/en/account", "", "en")).toBeNull();
  });

  it("upserts and activates record tabs without losing their display titles", () => {
    const first = createWorkspaceTab("/en/admin/audit-log/event-1", "", "en", 1)!;
    const second = createWorkspaceTab("/en/admin/support-cases/CASE-2", "", "en", 2)!;
    const titled = { ...first, title: "Audit · MERCHANT_APPROVED" };
    const state = upsertWorkspaceTab(upsertWorkspaceTab(emptyAdminWorkspaceState, titled), second);
    const updated = upsertWorkspaceTab(state, { ...first, href: "/en/admin/audit-log/event-1?page=2", lastActiveAt: 3 });
    expect(updated.tabs).toHaveLength(2);
    expect(updated.tabs[0].title).toBe("Audit · MERCHANT_APPROVED");
    expect(updated.tabs[0].href).toContain("page=2");
    expect(updated.activeTabId).toBe(first.id);
  });

  it("closes a tab and selects the nearest remaining tab", () => {
    const a = createWorkspaceTab("/en/admin/audit-log/event-1", "", "en", 1)!;
    const b = createWorkspaceTab("/en/admin/support-cases/CASE-2", "", "en", 2)!;
    const state = upsertWorkspaceTab(upsertWorkspaceTab(emptyAdminWorkspaceState, a), b);
    expect(closeWorkspaceTab(state, b.id)).toMatchObject({ activeTabId: a.id, tabs: [a] });
  });

  it("persists only whitelisted safe drafts independently per tab", () => {
    const first = createWorkspaceTab("/en/admin/merchant-review/merchant-1", "", "en", 1)!;
    const second = createWorkspaceTab("/en/admin/offer-moderation/offer-2", "", "en", 2)!;
    const state = {
      ...upsertWorkspaceTab(upsertWorkspaceTab(emptyAdminWorkspaceState, first), second),
      drafts: {
        [first.id]: { merchantAction: "approve", merchantChecks: [true, false, true], internalNote: "private note", ownerEmail: "person@example.com" },
        [second.id]: { offerAction: "request-edit", reason: "sensitive narrative", customerPhone: "0600000000" },
      },
    };
    const saved = persistableWorkspace(state);
    expect(saved.version).toBe(ADMIN_WORKSPACE_STORAGE_VERSION);
    expect(saved.drafts[first.id]).toEqual({ merchantAction: "approve", merchantChecks: [true, false, true] });
    expect(saved.drafts[second.id]).toEqual({ offerAction: "request-edit" });
    expect(JSON.stringify(saved)).not.toContain("person@example.com");
    expect(JSON.stringify(saved)).not.toContain("private note");
    expect(JSON.stringify(saved)).not.toContain("0600000000");
    expect(restoreWorkspace(saved).drafts[first.id]).toEqual({ merchantAction: "approve", merchantChecks: [true, false, true] });
    expect(restoreWorkspace(saved).drafts[second.id]).toEqual({ offerAction: "request-edit" });
  });

  it("drops unknown fields, free text, unsafe query strings and orphan drafts", () => {
    const tab = createWorkspaceTab("/en/admin/support-cases/CASE-123", "?q=customer%40example.com&status=OPEN&token=secret", "en", 1)!;
    const state = {
      ...upsertWorkspaceTab(emptyAdminWorkspaceState, tab),
      drafts: {
        [tab.id]: { supportStatus: "OPEN", draftMessage: "contains PII", disclosureReason: "sensitive", authorizationToken: "secret" },
        "/not-an-open-tab": { merchantAction: "approve" },
      },
    };
    const saved = persistableWorkspace(state);
    expect(saved.tabs[0].href).toBe("/en/admin/support-cases/CASE-123?status=OPEN");
    const unsafeStatus = persistableWorkspace({
      ...state,
      tabs: state.tabs.map(item => ({ ...item, href: item.href.replace("status=OPEN", "status=PRIVATE_CUSTOMER_LABEL") })),
    });
    expect(unsafeStatus.tabs[0].href).toBe("/en/admin/support-cases/CASE-123");
    expect(saved.drafts[tab.id]).toEqual({ supportStatus: "OPEN" });
    expect(saved.drafts).not.toHaveProperty("/not-an-open-tab");
    expect(JSON.stringify(saved)).not.toContain("customer@example.com");
    expect(JSON.stringify(saved)).not.toContain("contains PII");
    expect(JSON.stringify(saved)).not.toContain("secret");
  });

  it("rejects malformed whitelisted values", () => {
    expect(sanitizeWorkspaceDraft({
      merchantChecks: [true, "yes", false],
      auditFrom: "25-11-2026",
      auditAction: "email person@example.com",
      auditPageSize: 999,
      offerAction: "reinstate",
    })).toEqual({ offerAction: "reinstate" });
  });

  it("ignores orphaned or unsupported persisted tabs", () => {
    expect(restoreWorkspace({ version: 0, tabs: [] }).tabs).toEqual([]);
    expect(restoreWorkspace({ version: 1, tabs: [{ id: "/en/admin/login", href: "/en/admin/login", page: "audit-log", title: "login", openedAt: 1, lastActiveAt: 1 }] }).tabs).toEqual([]);
    expect(workspaceStorageKey("user/123")).toContain("user%2F123");
  });
});

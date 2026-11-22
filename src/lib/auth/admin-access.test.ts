import { describe, expect, it } from "vitest";
import {
  canAccessAdminWorkspace,
  canAccessSupportCases,
  canRevealSupportCustomerDetails,
  SUPPORT_DISCLOSURE_REASON_MAX_LENGTH,
} from "./admin-access";

describe("admin and support role boundaries", () => {
  it("matches the backend disclosure reason limit", () => {
    expect(SUPPORT_DISCLOSURE_REASON_MAX_LENGTH).toBe(500);
  });
  it("keeps the general admin workspace restricted to admins", () => {
    expect(canAccessAdminWorkspace(["ADMIN"])).toBe(true);
    expect(canAccessAdminWorkspace(["SUPER_ADMIN"])).toBe(true);
    expect(canAccessAdminWorkspace(["SUPPORT"])).toBe(false);
    expect(canAccessAdminWorkspace(["CUSTOMER"])).toBe(false);
  });

  it("allows support agents into the support workspace only", () => {
    expect(canAccessSupportCases(["SUPPORT"])).toBe(true);
    expect(canAccessSupportCases(["ADMIN"])).toBe(true);
    expect(canAccessSupportCases(["SUPER_ADMIN"])).toBe(true);
    expect(canAccessSupportCases(["MERCHANT"])).toBe(false);
  });

  it("allows support disclosure only for the agent's assigned case", () => {
    expect(canRevealSupportCustomerDetails(["SUPPORT"], "agent-1", "agent-1")).toBe(true);
    expect(canRevealSupportCustomerDetails(["SUPPORT"], "agent-1", "agent-2")).toBe(false);
    expect(canRevealSupportCustomerDetails(["SUPPORT"], "agent-1", null)).toBe(false);
  });

  it("denies admin disclosure and allows super-admin disclosure for any case", () => {
    expect(canRevealSupportCustomerDetails(["ADMIN"], "admin-1", "agent-1")).toBe(false);
    expect(canRevealSupportCustomerDetails(["SUPER_ADMIN"], "root-1", null)).toBe(true);
    expect(canRevealSupportCustomerDetails(["ADMIN", "SUPPORT"], "agent-1", "agent-1")).toBe(false);
  });
});

export type RoleSet = readonly string[];

export function canAccessAdminWorkspace(roles: RoleSet): boolean {
  return roles.includes("ADMIN") || roles.includes("SUPER_ADMIN");
}

export function canAccessSupportCases(roles: RoleSet): boolean {
  return canAccessAdminWorkspace(roles) || roles.includes("SUPPORT");
}

export function canRevealSupportCustomerDetails(
  roles: RoleSet,
  actorId: string,
  assignedTo: string | null,
): boolean {
  if (roles.includes("SUPER_ADMIN")) return true;
  if (roles.includes("ADMIN")) return false;
  return roles.includes("SUPPORT") && Boolean(actorId) && actorId === assignedTo;
}

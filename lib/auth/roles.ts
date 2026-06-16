// Role model + capability checks. Mirrors the RLS policies (defense in depth):
// RLS is the real boundary; these gate UI + route access.

export const ROLES = ["owner", "admin", "writer", "client"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["owner", "admin", "writer"];
export const ADMIN_ROLES: Role[] = ["owner", "admin"];

export function isStaff(role: Role | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
export function isAdmin(role: Role | null | undefined): boolean {
  return !!role && ADMIN_ROLES.includes(role);
}
export function isClient(role: Role | null | undefined): boolean {
  return role === "client";
}

// Capability matrix — keep in sync with security-plan.md.
export const CAN = {
  manageAgencySettings: (r: Role) => r === "owner",
  manageUsers: (r: Role) => ADMIN_ROLES.includes(r),
  crudClients: (r: Role) => STAFF_ROLES.includes(r),
  runAgents: (r: Role) => STAFF_ROLES.includes(r),
  internalApprove: (r: Role) => STAFF_ROLES.includes(r),
  viewRevenue: (r: Role) => ADMIN_ROLES.includes(r),
  clientApprove: (r: Role) => r === "client",
} as const;

// Where each role lands after login.
export function homePathForRole(role: Role): string {
  return role === "client" ? "/review" : "/dashboard";
}

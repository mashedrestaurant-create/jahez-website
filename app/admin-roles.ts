export type AdminRole = "owner" | "admin" | "order_receiver";

export function canManageSite(role: AdminRole) {
  return role === "owner" || role === "admin";
}

export function canManageUsers(role: AdminRole) {
  return role === "owner";
}

export function isAllowedRole(role: string): role is AdminRole {
  return role === "owner" || role === "admin" || role === "order_receiver";
}

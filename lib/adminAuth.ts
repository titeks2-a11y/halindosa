export function getAdminToken() {
  return process.env.ADMIN_TOKEN?.trim() || process.env.ADMIN_EXPORT_TOKEN?.trim() || "";
}

export function isAdminProtectionEnabled() {
  const token = getAdminToken();
  return Boolean(token && token !== "replace-before-production");
}

export function canAccessAdmin(token: string | null | undefined) {
  if (!isAdminProtectionEnabled()) return token === null || token === undefined || token === "" || token === "local-admin";
  return token === getAdminToken();
}

export function getAdminExportHref(token: string | null | undefined) {
  if (!isAdminProtectionEnabled()) return "/api/admin/export";
  return `/api/admin/export?token=${encodeURIComponent(token ?? "")}`;
}

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

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

export function getAdminTokenFromRequest(request: Request, queryToken?: string | null) {
  return (
    request.headers.get("x-admin-token")?.trim() ||
    request.headers.get("x-admin-export-token")?.trim() ||
    request.headers.get("x-halindosa-admin-token")?.trim() ||
    getBearerToken(request) ||
    queryToken?.trim() ||
    ""
  );
}

export function canAccessAdminRequest(request: Request, queryToken?: string | null) {
  return canAccessAdmin(getAdminTokenFromRequest(request, queryToken));
}

export function getAdminExportHref(token: string | null | undefined) {
  if (!isAdminProtectionEnabled()) return "/api/admin/export";
  return `/api/admin/export?token=${encodeURIComponent(token ?? "")}`;
}

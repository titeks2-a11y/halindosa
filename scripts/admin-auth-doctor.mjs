import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const reportsDir = join(root, "reports");
const reportPath = "reports/admin-auth.json";
const adminAuthPath = "lib/adminAuth.ts";
const apiRoots = ["app/api/admin", "app/api/cron"];

function readText(path) {
  const fullPath = join(root, path);
  return existsSync(fullPath) ? readFileSync(fullPath, "utf8") : "";
}

function walkRoutes(dir) {
  const fullDir = join(root, dir);
  if (!existsSync(fullDir)) return [];

  const entries = readdirSync(fullDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = join(fullDir, entry.name);
    const path = relative(root, fullPath).replaceAll("\\", "/");
    if (entry.isDirectory()) return walkRoutes(path);
    return entry.isFile() && entry.name === "route.ts" ? [path] : [];
  });
}

function check(condition, name, detail) {
  return { name, ok: Boolean(condition), detail };
}

const adminAuth = readText(adminAuthPath);
const routePaths = apiRoots.flatMap(walkRoutes);
const protectedRoutePaths = routePaths.filter((path) => {
  const source = readText(path);
  return source.includes("@/lib/adminAuth") || source.includes("ADMIN_EXPORT_TOKEN") || source.includes("관리자 권한");
});

const routesWithLegacyDirectCall = protectedRoutePaths
  .map((path) => ({ path, source: readText(path) }))
  .filter(({ source }) => source.includes("canAccessAdmin(") && !source.includes("canAccessAdminRequest("))
  .map(({ path }) => path);

const routesWithoutRequestGuard = protectedRoutePaths
  .map((path) => ({ path, source: readText(path) }))
  .filter(({ source }) => source.includes("@/lib/adminAuth") && !source.includes("canAccessAdminRequest("))
  .map(({ path }) => path);

const checks = [
  check(adminAuth.includes("canAccessAdminRequest"), "request helper", "lib/adminAuth.ts exposes canAccessAdminRequest."),
  check(adminAuth.includes("getAdminTokenFromRequest"), "token extractor", "lib/adminAuth.ts centralizes admin token extraction."),
  check(adminAuth.includes("authorization") && adminAuth.includes("Bearer"), "bearer token", "Authorization: Bearer admin tokens are supported."),
  check(adminAuth.includes("x-admin-token") && adminAuth.includes("x-admin-export-token") && adminAuth.includes("x-halindosa-admin-token"), "admin headers", "Admin token headers are supported."),
  check(routesWithLegacyDirectCall.length === 0, "legacy direct calls", routesWithLegacyDirectCall.length ? `Legacy canAccessAdmin calls: ${routesWithLegacyDirectCall.join(", ")}` : "No protected API route calls canAccessAdmin directly."),
  check(routesWithoutRequestGuard.length === 0, "request guard coverage", routesWithoutRequestGuard.length ? `Routes missing canAccessAdminRequest: ${routesWithoutRequestGuard.join(", ")}` : "Protected API routes use request-aware admin auth."),
  check(protectedRoutePaths.length >= 10, "protected route scan", `${protectedRoutePaths.length} admin/cron API routes scanned.`)
];

const failures = checks.filter((item) => !item.ok);
const report = {
  ok: failures.length === 0,
  generatedAt: new Date().toISOString(),
  status: failures.length ? "needs_fix" : "ready",
  adminAuthPath,
  protectedRouteCount: protectedRoutePaths.length,
  protectedRoutes: protectedRoutePaths,
  routesWithLegacyDirectCall,
  routesWithoutRequestGuard,
  supportedHeaders: ["Authorization: Bearer", "x-admin-token", "x-admin-export-token", "x-halindosa-admin-token"],
  queryTokenCompatibility: true,
  reportPath,
  checks
};

mkdirSync(reportsDir, { recursive: true });
writeFileSync(join(root, reportPath), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error("Admin auth doctor failed.");
  for (const failure of failures) console.error(`- ${failure.name}: ${failure.detail}`);
  process.exit(1);
}

console.log(`Admin auth doctor passed: ${checks.length}/${checks.length}`);

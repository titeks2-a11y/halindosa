import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const files = {
  home: `${read("app/page.tsx")}\n${read("components/HomeClient.tsx")}`,
  detail: read("components/DealDetailActions.tsx"),
  favorites: read("app/favorites/page.tsx"),
  freeBenefits: read("components/FreeBenefitsClient.tsx"),
  quickDealCard: read("components/QuickDealCard.tsx"),
  redirectUrl: read("lib/redirectUrl.ts"),
  goRoute: read("app/go/[id]/route.ts"),
  redirectRoute: read("app/api/redirect/[id]/route.ts")
};

const issues = [];

function requireSnippet(name, body, snippet, message) {
  if (!body.includes(snippet)) issues.push(`${name}: ${message}`);
}

function requireNoSnippet(name, body, snippet, message) {
  if (body.includes(snippet)) issues.push(`${name}: ${message}`);
}

for (const [name, body] of Object.entries({
  home: files.home,
  detail: files.detail,
  favorites: files.favorites,
  freeBenefits: files.freeBenefits
})) {
  requireSnippet(name, body, 'window.open(redirectUrl, "_blank", "noopener,noreferrer")', "web purchase navigation must open the tracked /go URL in a new tab with noopener/noreferrer.");
  requireSnippet(name, body, "buildDealRedirectUrl", "purchase navigation must use the tracked redirect URL builder.");
  requireSnippet(name, body, "buildNativeSafeDealUrl", "native purchase navigation must use the native-safe redirect URL builder.");
  requireSnippet(name, body, "Browser.open", "native purchase navigation must use Capacitor Browser.");
  requireNoSnippet(name, body, 'href="#"', "hash placeholder links are not allowed for purchase navigation.");
  requireNoSnippet(name, body, "javascript:void", "javascript:void links are not allowed for purchase navigation.");
}

requireSnippet("redirectUrl", files.redirectUrl, "const path = `/go/${dealId}`", "redirect URL builder must route purchases through /go/[dealId].");
requireSnippet("redirectUrl", files.redirectUrl, "resolveDealDestinationUrl", "native fallback must resolve the safe final purchase destination.");
requireSnippet("quickDealCard", files.quickDealCard, "onClick={() => linkAvailable && onOpenDeal(deal)}", "quick deal purchase CTA must delegate to the tracked purchase opener instead of using direct href navigation.");
requireSnippet("quickDealCard", files.quickDealCard, "disabled={!linkAvailable}", "quick deal purchase CTA must disable unsafe or unavailable purchase links.");
requireSnippet("quickDealCard", files.quickDealCard, "판매처 이동 전 확인", "quick deal purchase CTA should describe the seller-confirmation step to assistive technologies.");
requireSnippet("goRoute", files.goRoute, "recordDealClick", "/go/[id] must record deal clicks.");
requireSnippet("goRoute", files.goRoute, "buildOutboundUrl", "/go/[id] must resolve outbound purchase URLs server-side.");
requireSnippet("redirectRoute", files.redirectRoute, "302", "legacy redirect route should still return 302 for valid purchase links.");

if (issues.length) {
  console.error("Purchase navigation doctor failed.");
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

console.log("Purchase navigation doctor passed.");
console.log("- Home, detail, favorites, and free-benefits purchase actions use /go tracking.");
console.log("- Quick deal card purchase CTA delegates to tracked purchase opening and disables unavailable links.");
console.log("- Web purchase actions open _blank with noopener,noreferrer.");
console.log("- Native purchase actions use Capacitor Browser with buildNativeSafeDealUrl.");

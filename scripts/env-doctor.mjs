import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const production = process.argv.includes("--production");
const envFiles = [".env.local", ".env.production", ".env"].filter((file) => existsSync(join(root, file)));

function parseEnvFile(file) {
  const body = readFileSync(join(root, file), "utf8");
  const values = {};

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    values[key.trim()] = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
  }

  return values;
}

const fileEnv = envFiles.reduce((merged, file) => ({ ...merged, ...parseEnvFile(file) }), {});
const exampleEnv = existsSync(join(root, ".env.example")) ? parseEnvFile(".env.example") : {};
const combinedEnv = { ...exampleEnv, ...fileEnv, ...process.env };

const checks = [
  {
    group: "public web/app",
    required: ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_AUTH_REDIRECT_URL", "NEXT_PUBLIC_APP_SCHEME", "NEXT_PUBLIC_SUPPORT_EMAIL"],
    optional: ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_APP_NAME", "NEXT_PUBLIC_APP_ENV"]
  },
  {
    group: "supabase auth",
    required: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"],
    optional: ["SUPABASE_SERVICE_ROLE_KEY"]
  },
  {
    group: "deal data",
    required: ["DEAL_DATA_MODE"],
    optional: ["DEAL_PROVIDER", "DEAL_FEED_URLS", "DEAL_PRODUCTION_FEED_URLS", "DEAL_PARTNER_FEED_URLS", "DEAL_NEWS_RSS_URLS", "DEAL_COMMUNITY_RSS_URLS", "NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"]
  },
  {
    group: "operations",
    required: ["ADMIN_EXPORT_TOKEN", "TRACKING_SALT"],
    optional: ["AFFILIATE_SUB_ID", "DEFAULT_AFFILIATE_URL_TEMPLATE", "COUPANG_PARTNERS_URL_TEMPLATE", "AFFILIATE_URL_TEMPLATES"]
  }
];

const placeholders = new Set(["", "replace-before-production", "replace-with-random-secret", "support@halindosa.com"]);
const allowedDataModes = new Set(["mock", "staging", "production", "hybrid"]);
const urlKeys = new Set(["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_AUTH_REDIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL"]);
const emailKeys = new Set(["NEXT_PUBLIC_SUPPORT_EMAIL"]);
const rows = [];

function isValidPublicUrl(value) {
  try {
    const url = new URL(value);
    if (production) return url.protocol === "https:" && !["localhost", "127.0.0.1"].includes(url.hostname);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidAppScheme(value) {
  return /^[a-z][a-z0-9.+-]*$/i.test(value) && !["http", "https", "javascript", "data", "file"].includes(value.toLowerCase());
}

function statusFor(key) {
  const value = combinedEnv[key] ?? "";
  const configured = Boolean(value) && !placeholders.has(value);
  return { key, value, configured };
}

function validateKey(key, status) {
  if (key === "DEAL_DATA_MODE") return allowedDataModes.has(status.value);
  if (!status.configured) return false;
  if (urlKeys.has(key)) {
    if (!isValidPublicUrl(status.value)) return false;
    if (key === "NEXT_PUBLIC_AUTH_REDIRECT_URL") {
      try {
        const redirectUrl = new URL(status.value);
        if (redirectUrl.pathname !== "/auth/callback") return false;
        if (production) {
          const siteUrl = new URL(combinedEnv.NEXT_PUBLIC_SITE_URL ?? "");
          return redirectUrl.origin === siteUrl.origin;
        }
        return true;
      } catch {
        return false;
      }
    }
  }
  if (emailKeys.has(key)) return isValidEmail(status.value);
  if (key === "NEXT_PUBLIC_APP_SCHEME") return isValidAppScheme(status.value);
  return true;
}

for (const check of checks) {
  for (const key of check.required) {
    const status = statusFor(key);
    const valid = validateKey(key, status);
    rows.push({ group: check.group, key, level: "required", ok: valid, value: status.value });
  }

  for (const key of check.optional) {
    const status = statusFor(key);
    rows.push({ group: check.group, key, level: "optional", ok: true, value: status.value });
  }
}

const missingRequired = rows.filter((row) => row.level === "required" && !row.ok);
const configuredRequired = rows.filter((row) => row.level === "required" && row.ok).length;
const totalRequired = rows.filter((row) => row.level === "required").length;

console.log(`Halindosa environment doctor`);
console.log(`Loaded env files: ${envFiles.length ? envFiles.join(", ") : "none; using process env and .env.example defaults"}`);
console.log(`Mode: ${production ? "production strict public URL check" : "local-compatible check"}`);
console.log(`Required production keys configured: ${configuredRequired}/${totalRequired}`);
console.log("");

for (const row of rows) {
  const mark = row.level === "optional" ? "-" : row.ok ? "OK" : "MISSING";
  const displayValue = row.value ? row.value.replace(/(.{4}).+(.{4})/, "$1...$2") : "";
  console.log(`${mark.padEnd(7)} ${row.group.padEnd(15)} ${row.key}${displayValue ? ` = ${displayValue}` : ""}`);
}

if (missingRequired.length) {
  console.log("");
  console.log("Missing or placeholder production keys:");
  for (const row of missingRequired) console.log(`- ${row.key} (${row.group})`);
  console.log("");
  console.log("Fill these in Vercel, Supabase, Android/iOS build environments, or a local .env.local before production testing.");
  console.log("URL values must be https in production, auth redirect must end with /auth/callback, and support email must be a real mailbox.");
  console.log("For store submission, run: node scripts/env-doctor.mjs --strict --production");
}

if (strict && missingRequired.length) {
  process.exit(1);
}

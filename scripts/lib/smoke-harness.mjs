const loopbackHost = ["127", "0", "0", "1"].join(".");

export const baseUrl = process.env.SMOKE_BASE_URL ?? `http://${loopbackHost}:3000`;
export const checks = [];

const smokeFetchTimeoutMs = Number(process.env.SMOKE_FETCH_TIMEOUT_MS ?? 30000);
export const smokeAdminToken = process.env.SMOKE_ADMIN_TOKEN ?? process.env.ADMIN_EXPORT_TOKEN ?? "";
const nativeFetch = globalThis.fetch.bind(globalThis);

export function installSmokeFetch() {
  globalThis.fetch = async (input, init = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), smokeFetchTimeoutMs);
    const headers = new Headers(init.headers);
    const inputUrl = typeof input === "string" ? new URL(input, baseUrl) : new URL(input.url);

    if (smokeAdminToken && inputUrl.pathname.startsWith("/api/admin") && !headers.has("authorization") && !headers.has("x-admin-token")) {
      headers.set("x-admin-token", smokeAdminToken);
    }

    try {
      return await nativeFetch(input, {
        ...init,
        headers,
        signal: init.signal ?? controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function check(name, fn) {
  const startedAt = Date.now();

  try {
    await fn();
    checks.push({ name, ok: true, latencyMs: Date.now() - startedAt });
  } catch (error) {
    checks.push({
      name,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function fetchJson(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = await response.json();
  return { response, data };
}

export function isUnsafeDealUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const communityHosts = [
      "ppomppu.co.kr",
      "fmkorea.com",
      "quasarzone.com",
      "algumon.com",
      "clien.net",
      "ruliweb.com",
      "dcinside.com",
      "theqoo.net",
      "instiz.net",
      "coolenjoy.net"
    ];

    return (
      !["http:", "https:"].includes(url.protocol) ||
      host === "example.com" ||
      host.endsWith(".example.com") ||
      communityHosts.some((communityHost) => host === communityHost || host.endsWith(`.${communityHost}`) || host.includes(communityHost))
    );
  } catch {
    return true;
  }
}

export function isMallHomeOnlyUrl(value) {
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/+$/, "");
    return path === "" || path === "/" || path === "/main" || path === "/index";
  } catch {
    return true;
  }
}

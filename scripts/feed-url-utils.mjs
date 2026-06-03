export function parseFeedUrlList(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return uniqueUrls(parsed.map((item) => String(item ?? "")));
    } catch {
      // Fall through to delimiter parsing so a malformed env value is visible
      // as a failing URL instead of crashing local development.
    }
  }

  return uniqueUrls(raw.split(/\r?\n|[;,](?=\s*(?:https?:\/\/|data:|$))/g));
}

export function getEnvFeedUrls(...keys) {
  return uniqueUrls(keys.flatMap((key) => parseFeedUrlList(process.env[key])));
}

function uniqueUrls(values) {
  return Array.from(
    new Set(
      values
        .map((url) => String(url ?? "").trim())
        .filter(Boolean)
    )
  );
}

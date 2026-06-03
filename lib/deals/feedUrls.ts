export function parseFeedUrlList(value: string | undefined) {
  const raw = String(value ?? "").trim();
  if (!raw) return [];

  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return uniqueUrls(parsed.map((item) => String(item ?? "")));
    } catch {
      // Keep malformed JSON-like values observable as feed URL failures.
    }
  }

  return uniqueUrls(raw.split(/\r?\n|[;,](?=\s*(?:https?:\/\/|data:|$))/g));
}

export function getEnvFeedUrls(...keys: string[]) {
  return uniqueUrls(keys.flatMap((key) => parseFeedUrlList(process.env[key])));
}

function uniqueUrls(values: string[]) {
  return Array.from(new Set(values.map((url) => url.trim()).filter(Boolean)));
}

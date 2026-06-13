# Security Check Report

Generated: 2026-06-13T10:19:25.459Z

| Metric | Value |
| --- | ---: |
| Checks | 17 |
| Passed | 17 |
| Failed | 0 |

## Checks

- PASS env example coverage: Client/public and server-only env keys are documented.
- PASS security scripts wired: refresh:benefits, verify:benefits, and security:check are wired into QA/harness.
- PASS free benefit model: FreeBenefitEvent model, sanitizer, dedupe title normalizer, official URL guard, SSRF private host guard, claim CTA, and trust badges are present.
- PASS freebies api guard: Public freebies API has rate limiting, request IDs, and generic error output.
- PASS core public api rate limits: Home, news benefits, and product deals APIs expose request IDs, no-store responses, rate-limit abuse protection, and generic error output.
- PASS free benefit events api guard: Public free benefit event API has rate limiting, request IDs, publishable-only filtering, no-store cache policy, and generic error output.
- PASS home api generic error guard: Home API keeps no-store runtime data and returns generic errors without exposing internal exception messages.
- PASS image proxy abuse guard: Image proxy rate-limits requests, validates initial and redirected hosts, rejects non-image/oversized responses, sets nosniff, and returns generic errors.
- PASS security response headers: Web deployment applies CSP, HSTS, clickjacking, MIME, referrer, and permissions headers while leaving Capacitor static export untouched.
- PASS cron secret guard: Cron refresh and benefits routes require secret/admin auth, trusted browser origins, and rate limits.
- PASS cron output redaction: Cron process output is sanitized before API/report exposure and public failure messages avoid stack/log detail hints.
- PASS official redirect allowlist: Official benefit redirects use visible deal lookup and approved-host destination policy.
- PASS official source catalog guard: Official source catalog has 244 safe, non-duplicate candidates with explicit CTA policy text and guarded home-like discovery URLs.
- PASS official benefit exposed homepage guard: Visible official benefit rows avoid homepage/main/index URLs (197 rows checked).
- PASS xss rendering guard: No unsafe HTML rendering found; JSON-LD escapes '<'.
- PASS public env secret separation: No NEXT_PUBLIC server-secret style variables found.
- PASS hardcoded secret scan: No common high-risk token patterns found in tracked source files.


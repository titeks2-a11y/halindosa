# Security Check Report

Generated: 2026-06-09T01:34:29.023Z

| Metric | Value |
| --- | ---: |
| Checks | 10 |
| Passed | 10 |
| Failed | 0 |

## Checks

- PASS env example coverage: Client/public and server-only env keys are documented.
- PASS security scripts wired: refresh:benefits, verify:benefits, and security:check are wired into QA/harness.
- PASS free benefit model: FreeBenefitEvent model, sanitizer, dedupe title normalizer, official URL guard, SSRF private host guard, claim CTA, and trust badges are present.
- PASS freebies api guard: Public freebies API has rate limiting, request IDs, and generic error output.
- PASS free benefit events api guard: Public free benefit event API has rate limiting, request IDs, publishable-only filtering, no-store cache policy, and generic error output.
- PASS cron secret guard: Cron refresh route requires secret/admin auth and rate limit.
- PASS official redirect allowlist: Official benefit redirects use visible deal lookup and approved-host destination policy.
- PASS xss rendering guard: No unsafe HTML rendering found; JSON-LD escapes '<'.
- PASS public env secret separation: No NEXT_PUBLIC server-secret style variables found.
- PASS hardcoded secret scan: No common high-risk token patterns found in tracked source files.


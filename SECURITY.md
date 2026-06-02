# Security Policy

## Supported Versions

| Version | Status |
| --- | --- |
| 1.0.x | Supported for launch hardening |

## Reporting a Vulnerability

Do not open a public issue for vulnerabilities, exposed secrets, authentication bypasses, admin token leaks, keystore leaks, redirect abuse, or account deletion problems.

Use one of these private paths instead:

1. GitHub Security Advisory: `https://github.com/titeks2-a11y/halindosa/security/advisories/new`
2. If GitHub Security Advisories are unavailable, contact the repository owner through the private channel used for deployment handoff.

Please include:

- A short summary of the issue
- Affected route, file, or feature
- Reproduction steps
- Impact assessment
- Whether any personal data, Supabase key, admin token, keystore, `.env` value, or OAuth redirect URL may be exposed

Please do not include:

- Real user passwords
- Full access tokens or service-role keys
- Keystore passwords or `.jks` files
- Customer payment, address, phone, or order information

## Security Boundaries

- The app does not process payments directly. Purchases happen on external seller pages.
- Supabase service-role keys must only be stored on the server or deployment platform, never in client code.
- `ADMIN_EXPORT_TOKEN`, `TRACKING_SALT`, OAuth secrets, keystore files, and `.env*` files must not be committed.
- External purchase redirects must only allow `http` and `https` destinations that pass the link policy.
- Community, blog, news, search-result, and mall-home URLs must not be treated as verified purchase links.

## Response Expectations

For launch-blocking reports, prioritize:

1. Secret exposure
2. Account deletion or authentication bypass
3. Open redirect or unsafe external link handling
4. Admin/export token exposure
5. Verified purchase link policy bypass

After a fix, run:

```bash
npm run harness
npm run release:doctor
```

Then update `docs/release-evidence.md` with:

```bash
npm run release:evidence
```

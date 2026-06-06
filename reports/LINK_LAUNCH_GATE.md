# Link Launch Gate

Generated: 2026-06-06T19:27:20.667Z

Status: PASS

## Summary

- Audited items: 140
- Exposed items: 140
- Verified purchase links: 140
- Exposed search links: 0
- Exposed sold-out links: 0
- Exposed broken links: 0
- Exposed invalid URLs: 0
- Exposed non-publishable items: 0
- Hidden products: 0
- Exposed live hard failures: 0
- Exposed seller unavailable signals: 0
- Fresh manual evidence: 80/80
- Stale manual evidence: 0
- Missing manual evidence: 0

## Launch Rule

Only deals with `availability=active`, `validationStatus=passed`, `isHidden=false`, `publishable=true`, non-search `linkType`, and a valid HTTP(S) `finalUrl` can be exposed.

Protected 403/429/robots links must also have manual review, official API, or partner feed evidence fresher than 7 days.

## Issues

- None

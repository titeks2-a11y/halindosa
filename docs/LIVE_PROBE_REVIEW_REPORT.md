# Live Probe Review Report

Generated: 2026-06-06T22:50:57.619Z

Status: PASS

## Summary

- Total deals: 140
- Publishable deals: 140
- Live probe checked: 140
- Live probe passed: 60
- Live probe review queue: 80
- Manual evidence required: 80
- Hard failures: 0
- Quarantined hidden failures: 0
- Exposed hard failures: 0
- Unavailable text signals: 0
- Protected or rate-limited checks: 77
- Transient network checks: 3
- Fresh manual evidence: 80/80
- Stale manual evidence: 0
- Missing manual evidence: 0
- Exposed search links: 0
- Exposed sold-out links: 0

## Launch Rule

The app can expose only links that are already publishable and have zero hard failures, zero unavailable-text signals, zero search links, and zero sold-out links. Seller access protection, robots blocks, and 429 responses are not treated as successful body verification; they stay in this queue for official API, partner feed, manual device check, or backoff retry. Protected links also need manual review evidence fresher than 7 days.

## Top Host Actions

| Host | Count | Retry modes | Recommended action |
| --- | ---: | --- | --- |
| item.gmarket.co.kr | 31 | official_api_or_partner_feed | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| coupang.com | 24 | official_api_or_partner_feed | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| ssg.com | 13 | backoff_retry | 요청 간격을 늘린 backoff retry 후 official API 또는 partner feed로 대조 |
| oliveyoung.co.kr | 7 | official_api_or_partner_feed | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| hyundaicard.com | 1 | network_retry | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| itempage3.auction.co.kr | 1 | official_api_or_partner_feed | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| store.ohou.se | 1 | official_api_or_partner_feed | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| tmembership.co.kr | 1 | network_retry | official API, partner feed, manual device check 순서로 상세 링크 재확인 |
| tour.interpark.com | 1 | network_retry | official API, partner feed, manual device check 순서로 상세 링크 재확인 |

## Review Queue

| Severity | ID | Mall | Host | Status | Reason | Retry mode | Manual evidence | Recommended action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| review | d004 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d006 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d010 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.4d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d012 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d014 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d019 | 오늘의집 | store.ohou.se | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d022 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d025 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d028 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d030 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.4d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d031 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d035 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.4d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d040 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5.8d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d046 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d050 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d079 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d085 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (1.6d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d088 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d091 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d094 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (0.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d100 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d104 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d105 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d110 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d113 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.8d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d121 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.7d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d124 | 올리브영 | oliveyoung.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.7d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d126 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.7d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d130 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.7d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d131 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.7d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d136 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.6d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d139 | 쿠팡 | coupang.com | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (4.6d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d002 | 지마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.4d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d003 | g마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d007 | 토스 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.4d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d009 | 지마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d016 | G마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d017 | G마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (5.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d034 | G마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (6.5d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |
| review | d043 | G마켓 | item.gmarket.co.kr | 403 | robots_or_access_blocked | official_api_or_partner_feed | fresh (0.9d) | official API 또는 partner feed로 상품 상세 존재를 확인하고, 필요 시 manual device check 수행 |

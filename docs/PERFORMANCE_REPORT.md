# 할인도사 Performance Report

Updated: 2026-06-12T15:20:41.607Z

## Static Performance Budget

| Check | Result | Detail |
| --- | --- | --- |
| home section budget | PASS | 홈 section 정적 개수 32개로 관리 중입니다. |
| image lazy loading | PASS | 이미지 6개 중 lazy 처리 6개. |
| mobile safe area | PASS | 하단 탭바 겹침 방지를 위한 safe-area padding이 있습니다. |
| initial render cap | PASS | 초기 상품 렌더 수 제한 코드가 있습니다. |
| free benefits initial payload cap | PASS | 무료혜택 페이지는 초기 HTML payload를 줄이고 no-store API 갱신으로 목록을 보강합니다. |
| progressive disclosure | PASS | 긴 상세 필터는 접힘/반응형 숨김으로 관리됩니다. |

## Notes

- This report is a static performance harness. It does not replace Lighthouse, but catches regressions that make the mobile home long or heavy.
- Lighthouse target remains LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 after deployment on a stable URL.
- Next step for live measurement: run Lighthouse against the deployed Vercel URL and attach screenshots under artifacts/ui/.

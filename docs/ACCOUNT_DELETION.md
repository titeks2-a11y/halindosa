# 할인도사 회원 탈퇴 처리 기준

## 사용자 흐름

1. 사용자는 마이페이지에서 `회원 탈퇴 진행`을 선택합니다.
2. 확인 입력창에 `탈퇴`를 입력해야 확정 버튼이 활성 흐름으로 진행됩니다.
3. 클라이언트는 Supabase access token을 `Authorization: Bearer` 헤더로 `/api/account/delete`에 전달합니다.
4. 서버는 토큰으로 본인 여부를 확인한 뒤 service role key로 데이터 삭제/익명화를 수행합니다.
5. 성공하면 클라이언트 localStorage를 정리하고 로그아웃 후 홈으로 이동합니다.

## 삭제/익명화 대상

- `user_profiles`: 삭제
- `user_favorite_deals`: 삭제
- `user_recent_deals`: 삭제
- `price_drop_alerts`: 삭제
- `deal_click_logs`: `user_id = null`로 익명화
- `auth.users`: Supabase Admin API로 삭제

## 보안 기준

- `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경변수에만 저장합니다.
- 클라이언트 번들에는 service role key가 절대 포함되지 않습니다.
- API는 Bearer token으로 본인 세션을 확인합니다.
- 확인 문구가 `탈퇴`가 아니면 400으로 거절합니다.
- Supabase 서버 환경변수가 없으면 503으로 안전하게 실패합니다.

## 운영자가 해야 할 일

- Vercel/운영 서버 환경변수에 `SUPABASE_SERVICE_ROLE_KEY` 등록
- Supabase SQL Editor에서 `docs/supabase-schema.sql` 반영
- 실제 회원 탈퇴 요청 1건을 내부 테스트 계정으로 검증
- 개인정보처리방침에 삭제/보관 기준이 서비스 실제 정책과 일치하는지 검토

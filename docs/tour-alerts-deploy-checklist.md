# 투어앱 알림·준비물 배포 체크리스트

## 원칙
- ①(DB 적용)은 공유 DB 변경이므로 **컴퓨터앱 심사 통과 후**에만 한다.
- ③(main 병합·배포)은 **반드시 ① 이후**다. 코드가 먼저 나가면 없는 테이블·함수를 호출한다.
- `supabase db push`는 쓰지 않는다. 마이그레이션 파일을 하나씩 적용한다.

## 지금 가능
- [ ] **② 환경 변수 등록** (Vercel, 서버 전용). 코드 배포 전에는 영향이 없다.
  - `NOTIFY_WEBHOOK_SECRET`, `CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - 값은 저장소에 기록하지 않는다.

## 사전 검증 (운영 적용 전, 로컬)
- [ ] 로컬 Supabase에서 `supabase db reset` 후 `supabase/verify/seed_local.sql`, `supabase/verify/tour_alerts_verify.sql`(S1–S33) 통과
- [ ] `supabase gen types --local`로 `src/integrations/supabase/types.ts` 재생성, 알림·준비물 어댑터 정리, `tsc` 기준 유지

## 마이그레이션 이력 주의 (배포 전 필독)
- 운영 `schema_migrations`와 저장소 버전이 크게 어긋난다. 이름은 같은데 버전이 다른 것이 약 20개, 저장소에만 있는 것이 12개다.
- **`supabase db push`는 절대 쓰지 않는다.** 저장소 전체 이력을 밀어 넣어 운영을 깨뜨릴 수 있다.
- 배포 ①은 우리 3개 파일만 SQL Editor로 실행한다. 그 3개 버전만 이력에 기록을 정리한다.

## 컴퓨터앱 심사 통과 후
- [ ] **① DB 적용 (파일 단위)**: 순서대로 적용한다.
  1. `20261006010000_tour_alerts_tables.sql`
  2. `20261006010100_tour_alerts_triggers.sql`
  3. `20261006020000_tour_daily_alerts.sql`
  - 공유 DB 객체(profiles, push_subscriptions, fcm_tokens, is_admin(), owns_tour() 등)는 건드리지 않는다.
  - `d212d9c`, `40740ad`, `1394fd0`은 운영 DB와 이미 일치하므로 이번 적용 대상이 아니다.
- [ ] **③ main 병합·배포**: ① 이후에만. 병합 전에 아래 "WIP 처리" 결정을 반영한다.
- [ ] **④ Database Webhook 생성**: `tour_diver_notifications` INSERT → `/api/notifications/dispatch`, 헤더 `x-notify-secret`. (pg_net은 웹훅 생성 시 자동 활성화)
- [ ] **⑤ 실제 알림 1건 E2E**: 테스트 찜 1건으로 알림 생성 → 벨·목록 확인 → (푸시 설정 후) OS 푸시 수신 확인

## WIP 처리 (③ 전 필수)
`feature/alerts-checklist`는 `wip/dive-plan-companion` 위에 있어서 `18915be`(다이빙 계획 화면: `TourDivePlanEditor`, Landing, PaymentSuccess, TourEditPage 연결부, types.ts)도 함께 배포된다.
- (가) 다이빙 계획 화면을 함께 검증하고 배포: 로컬 검증 범위에 생성·수정·결제 완료 화면 연동을 추가한다.
- (나) 이번 배포에서 제외: `git revert 18915be`를 feature 브랜치에 만들었다(커밋 `e433e8e`). wip 브랜치 원본은 그대로 둔다. 다이빙 계획 화면을 나중에 되살리려면 이 revert를 되돌린다(`git revert e433e8e`).
  - 확인 결과(임시 워크트리): 충돌은 `TourEditPage.tsx` 한 곳(다이빙 계획 마운트와 준비물 편집기 마운트가 인접). 준비물 편집기만 남기고 해결하면 `tsc` 31개(기존)·`vite build` 통과, `TourDivePlanEditor`·`tour_dive_plans` 참조 없음.

## 알려진 제한 (배포 후에도 남는 것)
- **푸시 미설정**: VAPID/FCM 설정 전에는 앱 내 알림·벨만 동작하고 OS 푸시는 오지 않는다. 실제 푸시는 별도 설정 작업이 필요하다.
- **네이티브 앱 반영**: iOS/Android에는 새 빌드 제출이 필요하다(`npx cap sync`, 빌드 번호 증가). 이번 작업에서는 `ios/`, `android/`를 수정하지 않았다.
- **투어 전체 취소 중복**: 확정 예약자에게 "투어가 취소되었습니다" 푸시와 `booking_changed` 알림이 둘 다 간다. 둘 다 유지하기로 했다. 중복을 없애려면 앱에서 예약 취소 RPC와 `tours.cancelled_at` 갱신의 순서를 맞춰야 한다. 이번 배포에서는 앱 처리 순서를 바꾸지 않는다.
- **준비물 집계 지연**: 강사가 항목을 바꿔도 다이버의 저장된 집계(`total_count`)는 다이버가 화면을 다시 열 때 갱신된다. 그 전까지 리마인드는 마지막 저장값을 쓴다.

## 후속 작업 후보 (이번 배포 범위 밖)
- **남은 타입 오류 11개 (tsc, 새 오류 0)**: `AppDataContext.tsx` 9개(객체 배열을 `Json` 컬럼에 넣는 곳, 기존부터 있던 종류), `AdminLayout.tsx` 1개, `push.ts` 1개. 이번 배포 범위 밖이며 각각 별도 수정한다.
- **후속 버그(운영 확인됨): `apply_tour_auto_close`의 최소 인원 계산이 예약 건수(`count(*)`)를 쓴다.** `participant_count`와 `manual_participant_count`가 빠져 있어, 여러 명이 예약한 투어나 수동 인원이 있는 투어의 충족 판단이 틀린다. 앱 화면의 정원 기준(확정 인원 합 + 수동 인원)과 맞춰야 한다.
- **후속(낮음): `is_recently_deleted_account(p_email)`이 anon에게 실행 가능하다.** 이메일 존재 여부를 탐색할 수 있다. 호출 경로와 필요성을 확인한 뒤 권한을 줄인다.
- **baseline 마이그레이션 재생 불가**: `20260716000000_baseline_snapshot_pre_tracking.sql`은 FK가 PK·UNIQUE보다 먼저 나와서 빈 DB에서 재생되지 않는다(`tours`, `invoices`→`payouts`, `mimo_reservations`→`mimo_salons`·`mimo_users`). 운영에는 이미 적용돼 재실행되지 않으므로 운영 영향은 없다. 새 환경이나 Supabase 브랜칭에 대비해, 의미가 같은 순서 재배치본으로 정리하는 것을 검토한다.
- **1순위: `send-push`·`send-email` 서버 전용화.** 현재 `send-push`는 호출자 인증을 확인하지 않는다. 클라이언트 호출 3곳(AppDataContext)을 서버 경로로 옮긴 뒤 막는다.
- 투어 `admin_status`가 정지·보류로 바뀔 때 예약자 안내 알림. 앱에 이미 같은 안내가 있는지 확인한 뒤 별도 명세로 추가한다.

# 보관 (superseded) — 2026-08-12 재구성 이전 마이그레이션 기록

이 21개 파일은 2026-07-16 ~ 2026-08-03 사이에 작성된 마이그레이션 "기록"입니다.
`supabase_migrations.schema_migrations`(Supabase가 실제로 추적하는 마이그레이션
이력 테이블)에는 전혀 등록되어 있지 않았고, 실제 라이브 DB 상태와 대조해보니:

- 대부분의 내용(테이블 생성, 컬럼 추가 등)은 라이브 DB와 정확히 일치했습니다.
- `migration_20260803_000000003`(reviews.visibility 컬럼)은 라이브 DB에 전혀
  적용되지 않았습니다 — 기록만 있고 실제 실행은 안 된 것으로 보입니다. **이 파일의
  내용을 신뢰하면 안 됩니다.**
- `migration_20260803_000000004`(batch96, "RLS 쓰기 권한 잠금")는 안에 있는
  헬퍼 함수(`is_admin`, `owns_instructor`, `owns_tour`, `owns_booking`,
  `owns_booking_tour`, `apply_tour_auto_close`, `report_review`,
  `redeem_coupon`, `is_recently_deleted_account`)는 라이브에 존재하지만,
  같은 파일 안의 정책(RLS policy) 변경 부분은 **하나도 라이브에 반영되지
  않았습니다.** 즉 `tours`/`reviews`/`instructors`/`centers`/`coupons`/
  `qa_checklist_results`/`deleted_accounts`/`penalties_log`(insert)/
  `chat_messages`(insert)는 지금도 이 파일이 잠그려던 것과 달리 등록/수정이
  완전히 공개(`using (true)`)된 상태였습니다. 2026-08-12 세션에서 발견 후
  같은 날 `../20260812020000_apply_stalled_batch96_write_lockdown.sql`로
  뒤늦게 적용 완료 — 이제 라이브 상태와 마이그레이션 이력 모두 정상입니다.
- 라이브 DB에는 이 21개 파일 어디에도 없는 테이블/컬럼/함수가 상당수
  있었습니다 (`invoices`, `refunds`, `instructor_notifications`,
  `arbitration_messages`, `notices` 테이블 전체, `instructors`/`profiles`/
  `bookings`/`payouts`의 수십 개 컬럼, `admin_monthly_accounting` 뷰와
  정산/회계 관련 함수 여러 개, `penalties_log.voided` 컬럼 등). 저장소
  루트의 `fix_*.py`/`fix_*.sh`/`fix_*.sql`/`fix_*.patch` 스크립트 90여 개가
  그때그때 Supabase 대시보드 SQL Editor로 직접 실행되며 쌓인 결과로 추정됩니다.

**완벽한 시대순 재구성 대신** 2026-08-12 시점의 라이브 스키마를 그대로 스냅샷
찍은 새 baseline 마이그레이션(`../<timestamp>_baseline_snapshot_pre_tracking.sql`)
으로 대체했습니다. 이 폴더의 파일들은 삭제하지 않고 과거 작업 이력 참고용으로만
보관합니다 — `supabase/migrations/`의 활성 마이그레이션 시퀀스에는 포함되지
않으므로, 이 폴더의 파일을 다시 옮기거나 직접 실행하지 마세요(위 이유로 일부는
현재 라이브 상태와 안 맞습니다).

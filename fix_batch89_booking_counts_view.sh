#!/usr/bin/env bash
# ALL BLUE 다이빙 플랫폼 — batch89: public_tour_booking_counts 뷰 마이그레이션 파일 기록
#
# *** 중요: 이 스크립트만 실행해서는 버그가 고쳐지지 않습니다. ***
# 이 스크립트는 "레포에 마이그레이션 기록을 남기는 것"만 합니다.
# 실제로 DB에 뷰를 만들려면 Supabase 대시보드 SQL Editor에서
# fix_public_tour_booking_counts_view.sql 내용을 직접 실행해야 합니다:
#   https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new
#
# 증상: 채팅방 "참가자 수" 위젯과 투어 상세페이지의 "N/4명 모집" 카운터가
#   실제 예약 인원과 무관하게 항상 0으로 표시됨.
# 원인: 프론트가 정원 계산에 쓰는 뷰 public_tour_booking_counts가 DB에 존재하지 않음(PGRST205).
#   bookings 컬럼 누락, get_tour_participants_masked 함수 누락 버그와 동일한 패턴 — 마이그레이션 누락.
#
# 사용법: all-blue-diving 리포지토리 루트에서 실행
#   chmod +x fix_batch89_booking_counts_view.sh
#   ./fix_batch89_booking_counts_view.sh
set -euo pipefail

if [ ! -d "supabase/migrations" ]; then
  echo "오류: all-blue-diving 리포지토리 루트에서 실행해야 합니다 (supabase/migrations 를 찾을 수 없음)."
  exit 1
fi

TARGET="supabase/migrations/migration_20260803_000000000"

if [ -f "$TARGET" ]; then
  echo "이미 존재합니다: $TARGET (변경 없이 종료)"
  exit 0
fi

cat > "$TARGET" <<'SQLEOF'
-- public_tour_booking_counts 뷰 추가 (batch89)
-- 채팅방 참가자 수 위젯 / 투어 상세페이지 정원 카운터가 항상 0으로 뜨던 버그의 원인.
-- Supabase SQL Editor에서 직접 실행 완료 후 기록용으로 커밋.
create or replace view public.public_tour_booking_counts as
select
  tour_id,
  count(*) as confirmed_count
from public.bookings
where status = 'confirmed'
group by tour_id;

grant select on public.public_tour_booking_counts to anon, authenticated;
SQLEOF

echo "1) 마이그레이션 파일 생성 완료: $TARGET"
echo ""
echo "*** 반드시 아래도 진행하세요 (이 파일을 커밋하는 것만으로는 DB가 바뀌지 않습니다) ***"
echo "  1. https://supabase.com/dashboard/project/fffslvvligcpadkcyzvo/sql/new 접속"
echo "  2. fix_public_tour_booking_counts_view.sql 파일 내용 전체 복사해서 붙여넣기 후 Run"
echo "  3. 맨 아래 select 결과에 confirmed_count가 4로 나오는지 확인"
echo ""
echo "완료되면:"
echo "  git add supabase/migrations/migration_20260803_000000000"
echo "  git commit -m 'fix: 참가자 수/정원 카운터가 항상 0으로 뜨던 문제 - public_tour_booking_counts 뷰 추가 (batch89)'"
echo "  git push"

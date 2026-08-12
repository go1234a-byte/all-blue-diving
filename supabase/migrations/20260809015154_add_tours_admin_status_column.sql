-- 관리자가 투어를 정지(suspended)/보류(held) 처리하는 기능이 이 컬럼이 없어서
-- 조용히 실패하고 있었다 (postgres 로그에 "column admin_status does not exist" 확인).
-- 특히 강사 영구정지 시 예정된 투어를 자동으로 정지시키는 로직도 이 컬럼에 의존하므로,
-- 컬럼이 없으면 정지된 강사의 투어가 계속 노출/예약 가능한 상태로 남는 문제가 있었다.
alter table public.tours
  add column if not exists admin_status text
  check (admin_status is null or admin_status in ('suspended', 'held'));

comment on column public.tours.admin_status is '관리자가 투어를 검토 후 정지(즉시 예약 차단, 검색 노출 제거)하거나 보류(임시 비공개)한 상태. NULL이면 정상.';

-- 관리자 투어관리 화면에서 "현재인원"을 +/- 로 조정할 수 있게 해달라는 요청 — 단, 실제
-- bookings row를 관리자가 대신 만드는 방식(정산/채팅방/참가자목록에 실제로 끼어들어 취소·환불
-- 처리까지 필요해지는 방식)이 아니라, 전화·현장 예약처럼 앱을 거치지 않은 참가자를 위한
-- 별도 "수동 추가 카운트"로 둔다. 화면에 보이는 "현재인원"은 항상 (실제 확정예약 합계 +
-- 이 수동 카운트)로 계산한다.
alter table public.tours
  add column if not exists manual_participant_count integer not null default 0;

alter table public.tours
  add constraint tours_manual_participant_count_check check (manual_participant_count >= 0) not valid;

-- 온라인 예약이 (실제 확정예약 + 수동 카운트)를 넘어서 정원을 초과하지 못하도록, 정원초과
-- 방지 트리거(20260813140000)의 계산에도 수동 카운트를 반영한다.
create or replace function public.enforce_tour_capacity()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_max_participants integer;
  v_manual_count integer;
  v_existing_count integer;
begin
  select max_participants, manual_participant_count into v_max_participants, v_manual_count
  from public.tours
  where id = new.tour_id
  for update;

  if v_max_participants is null then
    raise exception 'tour % not found', new.tour_id;
  end if;

  select coalesce(sum(participant_count), 0) into v_existing_count
  from public.bookings
  where tour_id = new.tour_id
    and status <> 'cancelled';

  v_existing_count := v_existing_count + coalesce(v_manual_count, 0);

  if v_existing_count + new.participant_count > v_max_participants then
    raise exception '정원이 초과되어 예약할 수 없습니다 (잔여 %명)', greatest(v_max_participants - v_existing_count, 0);
  end if;

  return new;
end;
$$;

-- manual_participant_count는 owns_instructor(강사 본인)이 아니라 관리자만 조정 가능해야 한다
-- (전화 접수를 처리하는 것도 결국 운영팀 업무). 기존 tours_update_own_or_admin 정책은 강사
-- 본인에게도 모든 컬럼 update를 허용하므로, 트리거로 이 컬럼만 별도로 admin 전용으로 잠근다
-- (이번 세션에서 확인했듯 이 플랫폼은 REVOKE가 안 먹으므로 트리거로 막는다).
create or replace function public.guard_tours_manual_participant_count()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.manual_participant_count is distinct from old.manual_participant_count and not public.is_admin() then
    raise exception 'manual_participant_count can only be changed by an admin';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_tours_manual_participant_count_trg on public.tours;
create trigger guard_tours_manual_participant_count_trg
before update on public.tours
for each row
execute function public.guard_tours_manual_participant_count();

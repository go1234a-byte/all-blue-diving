-- 예약(bookings) 정원 초과/중복 예약을 서버(DB)에서 원천 차단한다. 지금까지는 "잔여 인원"
-- 검사가 클라이언트가 마지막으로 받아온 값 기준으로만 이뤄져서, 마지막 한 자리를 두고 두 명
-- (또는 같은 사람이 두 탭/더블클릭)이 동시에 예약하면 둘 다 통과해 정원 초과 예약이 만들어질
-- 수 있었다(다이빙 보트 정원 초과는 안전 문제이기도 하다). 같은 이유로 같은 다이버가 같은
-- 투어를 두 번 예약하는 것도 서버 레벨에서는 막혀있지 않았다.

-- 같은 다이버가 같은 투어에 취소되지 않은 예약을 두 개 이상 가질 수 없다.
create unique index if not exists bookings_one_active_per_diver_tour
  on public.bookings (tour_id, diver_id)
  where status <> 'cancelled';

create or replace function public.enforce_tour_capacity()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_max_participants integer;
  v_existing_count integer;
begin
  -- 같은 투어에 대한 동시 INSERT를 직렬화한다 — 이 트랜잭션이 끝날 때까지 다른 트랜잭션이
  -- 같은 투어의 잔여 정원을 다시 세지 못하게 tours row를 잠가서, "마지막 한 자리"를 두 건의
  -- 예약이 동시에 통과하는 경쟁을 막는다.
  select max_participants into v_max_participants
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

  if v_existing_count + new.participant_count > v_max_participants then
    raise exception '정원이 초과되어 예약할 수 없습니다 (잔여 %명)', greatest(v_max_participants - v_existing_count, 0);
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_tour_capacity_trg on public.bookings;
create trigger enforce_tour_capacity_trg
before insert on public.bookings
for each row
execute function public.enforce_tour_capacity();

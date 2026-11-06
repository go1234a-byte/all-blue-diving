-- 강사도 다른 강사의 투어를 예약할 수 있게 되면서, 자기 투어 예약은 DB에서 막는다.
-- 자기 투어 예약은 정원과 정산을 왜곡한다. 화면(TourDetail·Checkout)에서도 막지만 주소 직접 호출까지 막는다.
create or replace function public.block_own_tour_booking()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if exists (
    select 1 from public.tours t
    join public.instructors i on i.id = t.instructor_id
    where t.id = new.tour_id and i.profile_id = new.diver_id
  ) then
    raise exception '본인이 운영하는 투어는 예약할 수 없습니다.';
  end if;
  return new;
end;
$function$;

drop trigger if exists block_own_tour_booking_trg on public.bookings;
create trigger block_own_tour_booking_trg
  before insert on public.bookings
  for each row execute function public.block_own_tour_booking();

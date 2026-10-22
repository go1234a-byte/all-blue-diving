-- 시연용 샘플 투어(제목에 "(샘플" 표기)는 예약을 받지 않는다. 화면(TourDetail·Checkout)에서도
-- 막지만, 주소 직접 호출로 실제 예약·결제가 샘플 투어에 들어가는 일을 DB에서 막는다.

create or replace function public.block_sample_tour_booking()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if exists (select 1 from public.tours t where t.id = new.tour_id and t.title like '%(샘플%') then
    raise exception '예시 투어는 예약할 수 없습니다.';
  end if;
  return new;
end;
$function$;

drop trigger if exists block_sample_tour_booking_trg on public.bookings;
create trigger block_sample_tour_booking_trg
  before insert on public.bookings
  for each row execute function public.block_sample_tour_booking();

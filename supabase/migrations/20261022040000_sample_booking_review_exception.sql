-- 앱 심사용 데모 계정(go1234a+applereview@gmail.com)만 예시 투어 예약을 허용한다.
-- 심사관이 예약 흐름(100% 쿠폰, 실결제 없음)을 끝까지 볼 수 있어야 하기 때문. 화면은 useSampleLock이 같은 기준.

create or replace function public.block_sample_tour_booking()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.diver_id = '03743608-a686-4954-8903-4a02dc0e35f3' then
    return new;
  end if;
  if exists (select 1 from public.tours t where t.id = new.tour_id and t.title like '%(샘플%') then
    raise exception '예시 투어는 예약할 수 없습니다.';
  end if;
  return new;
end;
$function$;

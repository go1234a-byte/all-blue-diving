-- 토스페이먼츠 계약 전에는 운영이 테스트 키라 돈이 오가지 않는데도 예약이 생긴다. 화면에서 막아도 이미 출시된
-- 앱은 이전 화면을 쓰므로 DB에서 예약 생성을 막는다. 심사용 데모 계정은 예외(20261022040000과 같은 계정)이고,
-- 관리자·서비스 호출은 막지 않는다. 라이브 키를 켜면 rollback 파일로 이 트리거를 제거한다.
create or replace function public.block_bookings_until_payment_contract()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() or new.diver_id = '03743608-a686-4954-8903-4a02dc0e35f3' then
    return new;
  end if;
  raise exception '결제 준비 중이라 지금은 예약할 수 없습니다.';
end;
$$;

drop trigger if exists block_bookings_until_payment_contract_trg on public.bookings;
create trigger block_bookings_until_payment_contract_trg
  before insert on public.bookings
  for each row execute function public.block_bookings_until_payment_contract();

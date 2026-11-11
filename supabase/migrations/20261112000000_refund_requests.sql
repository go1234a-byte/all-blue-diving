-- 환불 자동화: 예약이 취소되어 환불액이 정해지면(cancel_booking_with_refund) 같은 순간 환불 요청이 쌓이고,
-- 서버 함수(process-refunds)가 토스 결제 취소 API를 호출해 실제로 돈을 돌려준다. 실패하면 재시도하고,
-- 계속 실패한 건은 관리자 화면에 남는다. 결제 증빙(payment_key)이 없는 예약(이전 데이터·심사용 데모)은 대상이 아니다.

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  payment_key text not null,
  amount numeric not null check (amount > 0),
  reason text,
  status text not null default 'pending' check (status in ('pending','processing','done','failed')),
  attempts integer not null default 0,
  last_error text,
  toss_transaction_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz
);
alter table public.refund_requests enable row level security;
revoke all on public.refund_requests from anon, authenticated;
grant select on public.refund_requests to authenticated;
drop policy if exists refund_requests_select on public.refund_requests;
create policy refund_requests_select on public.refund_requests for select
  using (public.is_admin() or exists (select 1 from public.bookings b where b.id = refund_requests.booking_id and b.diver_id = auth.uid()::text));

-- 취소로 바뀌는 순간 환불 요청을 만든다(같은 UPDATE에서 refund_amount가 함께 정해진다).
create or replace function public.enqueue_refund_request()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled'
     and new.payment_key is not null and coalesce(new.refund_amount, 0) > 0 then
    insert into public.refund_requests (booking_id, payment_key, amount, reason)
    values (new.id, new.payment_key, least(new.refund_amount, new.total_paid), new.cancel_reason)
    on conflict (booking_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists enqueue_refund_request_trg on public.bookings;
create trigger enqueue_refund_request_trg
  after update on public.bookings
  for each row execute function public.enqueue_refund_request();

-- 서버 함수 전용: 처리할 요청을 집어 간다(동시에 두 번 처리되지 않게 잠그고, 멈춘 처리는 10분 뒤 다시 집는다).
create or replace function public.claim_refund_requests(p_limit integer default 10)
returns setof public.refund_requests
language sql
security definer
set search_path to 'public'
as $$
  update public.refund_requests r
  set status = 'processing', attempts = r.attempts + 1, updated_at = now()
  where r.id in (
    select id from public.refund_requests
    where status = 'pending'
       or (status = 'failed' and attempts < 5 and updated_at < now() - interval '2 minutes')
       or (status = 'processing' and updated_at < now() - interval '10 minutes')
    order by created_at
    limit greatest(p_limit, 1)
    for update skip locked
  )
  returning r.*;
$$;
revoke all on function public.claim_refund_requests(integer) from public, anon, authenticated;
grant execute on function public.claim_refund_requests(integer) to service_role;

create or replace function public.finish_refund_request(p_id uuid, p_ok boolean, p_error text, p_tx text)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update public.refund_requests
  set status = case when p_ok then 'done' else 'failed' end,
      last_error = case when p_ok then null else left(p_error, 500) end,
      toss_transaction_key = coalesce(p_tx, toss_transaction_key),
      done_at = case when p_ok then now() else done_at end,
      updated_at = now()
  where id = p_id and status = 'processing';
$$;
revoke all on function public.finish_refund_request(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.finish_refund_request(uuid, boolean, text, text) to service_role;

-- 관리자: 실패한 환불을 다시 시도하게 되돌린다.
create or replace function public.retry_refund_request(p_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.refund_requests set status = 'pending', attempts = 0, last_error = null, updated_at = now()
  where id = p_id and status = 'failed';
end;
$$;
revoke all on function public.retry_refund_request(uuid) from public, anon;
grant execute on function public.retry_refund_request(uuid) to authenticated;

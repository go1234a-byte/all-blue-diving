
-- 관리자 전용: 정산(payout) 상태를 수동으로 변경 (즉시승인/보류해제/보류).
create or replace function public.admin_set_payout_status(p_payout_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized to change payout status';
  end if;

  if p_status not in ('scheduled', 'held', 'released', 'cancelled') then
    raise exception 'invalid payout status: %', p_status;
  end if;

  update public.payouts
  set status = p_status,
      paid_at = case when p_status = 'released' then now() else paid_at end
  where id = p_payout_id;
end;
$$;

-- 관리자 전용: 강사의 투어취소 증빙(tour_cancellation_claims) 승인 시 1차 정산(80%)만 되살리고 2차 정산은 0원 처리.
create or replace function public.admin_restore_settlement_after_claim(p_booking_ids uuid[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized to restore settlement';
  end if;

  update public.payouts
  set status = 'scheduled', second_amount = 0
  where booking_id = any(p_booking_ids);
end;
$$;

-- payouts는 SECURITY DEFINER RPC(create_booking_settlement/cancel_booking_settlement/
-- admin_set_payout_status/admin_restore_settlement_after_claim)를 통해서만 써야 하는
-- 금전 정산 테이블이다. 클라이언트가 직접 insert/update할 수 있는 기존 정책은
-- PG(결제 게이트웨이) 연동 전 반드시 제거한다 — 그대로 두면 anon key만으로 누구나
-- 임의 강사의 정산 금액/상태를 조작할 수 있었다.
drop policy if exists payouts_public_insert on public.payouts;
drop policy if exists payouts_public_update on public.payouts;

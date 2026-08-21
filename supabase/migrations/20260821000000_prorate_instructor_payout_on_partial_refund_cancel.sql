create or replace function public.cancel_booking_settlement(p_booking_id uuid, p_refund_amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actual_refund_amount numeric;
  v_refund_rate numeric;
  v_retained_fraction numeric;
begin
  if not (public.owns_booking(p_booking_id) or public.owns_booking_tour(p_booking_id) or public.is_admin()) then
    raise exception 'not authorized to cancel settlement for this booking';
  end if;

  select refund_amount, refund_rate into v_actual_refund_amount, v_refund_rate
  from public.bookings where id = p_booking_id;
  if v_actual_refund_amount is distinct from p_refund_amount then
    raise exception 'refund amount mismatch — call cancel_booking_with_refund instead of calling this RPC directly';
  end if;

  -- 고객에게 환불되지 않고 회사/강사가 보유하는 비율. 잔여일수 기준 부분환불(예: 50%
  -- 환불)이면 강사도 보유분(50%)에 대해서는 정상 비율(80/20)로 정산받아야 하므로, 정산을
  -- 통째로 0원 처리(status='cancelled')하는 대신 payouts 금액 자체를 비례 축소한다.
  -- 전액환불(retained=0)일 때만 기존처럼 정산을 취소 처리한다.
  -- ponytail: cancel_booking_with_refund가 이미 "취소는 confirmed 상태에서만 1회" 가드를
  -- 걸어두고 있어 실제 호출 경로상 이 함수가 같은 예약에 두 번 불릴 일이 없다 — 그 가정이
  -- 깨지면(예: 이 RPC를 직접 반복 호출) 비례 축소가 중복 적용될 수 있음.
  v_retained_fraction := greatest(0, 1 - coalesce(v_refund_rate, 1));

  if v_retained_fraction <= 0 then
    update public.payouts
    set status = 'cancelled'
    where booking_id = p_booking_id
      and status <> 'released';
  else
    update public.payouts
    set first_amount = round(first_amount * v_retained_fraction),
        second_amount = round(second_amount * v_retained_fraction),
        withholding_tax_amount = round(withholding_tax_amount * v_retained_fraction),
        net_payout_amount = round(net_payout_amount * v_retained_fraction)
    where booking_id = p_booking_id
      and status <> 'released';
  end if;

  update public.invoices
  set refund_amount = p_refund_amount,
      instructor_amount = round(instructor_amount * v_retained_fraction)
  where booking_id = p_booking_id;
end;
$$;

-- 강사가 투어 취소 증빙을 제출해 관리자가 승인하면 1차 정산(80%)만 복구되고 2차 정산(20%)은
-- 0원 처리되는데(투어가 실제 진행 안 됐으므로), second_amount만 0으로 바꾸고
-- withholding_tax_amount/net_payout_amount는 재계산하지 않고 있었다. 관리자 정산 화면의
-- "실지급액"(net_payout_amount)이 실제 송금액으로 굵게 표시되는 값인데, 이게 옛날(2차 정산
-- 포함) 금액 그대로 남아 있어 승인 후에도 여전히 2차 정산분까지 과지급될 수 있었다.
-- 1차 정산 금액 기준으로 원천징수세액·실지급액을 다시 계산해서 반영한다.
-- invoices.instructor_amount도 함께 갱신해 admin_monthly_accounting(순수익 = gmv - 환불 -
-- 강사정산) 집계가 실제로 지급되는 금액과 어긋나지 않게 한다.
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
  set status = 'scheduled',
      second_amount = 0,
      withholding_tax_amount = round(first_amount * withholding_tax_rate),
      net_payout_amount = first_amount - round(first_amount * withholding_tax_rate)
  where booking_id = any(p_booking_ids);

  update public.invoices i
  set instructor_amount = p.first_amount
  from public.payouts p
  where p.booking_id = i.booking_id
    and p.booking_id = any(p_booking_ids);
end;
$$;

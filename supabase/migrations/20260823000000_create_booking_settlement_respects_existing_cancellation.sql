create or replace function public.create_booking_settlement(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_booking record;
  v_instructor_id text;
  v_business_type text;
  v_withholding_rate numeric := 0;
  v_withholding_amount numeric := 0;
  v_net_amount numeric;
  v_principal numeric;
  v_first_amount numeric;
  v_second_amount numeric;
  v_payout_id uuid;
  v_invoice_period date;
  v_invoice_seq int;
  v_invoice_id text;
  v_retained_fraction numeric;
  v_payout_status text;
begin
  if not (public.owns_booking(p_booking_id) or public.is_admin()) then
    raise exception 'not authorized to create settlement for this booking';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'booking % not found', p_booking_id;
  end if;

  if exists (select 1 from public.payouts where booking_id = p_booking_id) then
    return;
  end if;

  select instructor_id into v_instructor_id
  from public.tours
  where id = v_booking.tour_id;

  if v_instructor_id is null then
    raise exception 'tour for booking % not found', p_booking_id;
  end if;

  select business_type into v_business_type from public.instructors where id = v_instructor_id;

  if v_business_type = 'freelancer' or v_business_type is null then
    v_withholding_rate := 0.033;
  else
    v_withholding_rate := 0;
  end if;

  -- addBooking 직후 정상 호출되는 경우(v_booking.status='confirmed')는 항상 retained=1(정상
  -- 전액 정산). 이 함수는 "정산 누락 예약 재시도"(관리자가 뒤늦게 다시 호출) 경로로도 불리는데,
  -- 그 사이 다이버가 예약을 취소했을 수 있다 — 그 경우 cancel_booking_settlement이 이미 만들어진
  -- payout을 비례 축소하는 것과 동일한 결과가 나오도록, 처음부터 취소 시점의 refund_rate를
  -- 반영해서 만든다(그렇지 않으면 취소된 예약에 전액 정산이 생성되는 회귀가 재발한다).
  v_retained_fraction := case
    when v_booking.status = 'cancelled' then greatest(0, 1 - coalesce(v_booking.refund_rate, 1))
    else 1
  end;

  v_principal := coalesce(v_booking.base_price, 0) + coalesce(v_booking.options_cost, 0);
  v_first_amount := round(v_principal * 0.8 * v_retained_fraction);
  v_second_amount := round(v_principal * 0.2 * v_retained_fraction);
  v_withholding_amount := round((v_first_amount + v_second_amount) * v_withholding_rate);
  v_net_amount := v_first_amount + v_second_amount - v_withholding_amount;
  v_payout_status := case when v_retained_fraction <= 0 then 'cancelled' else 'scheduled' end;

  insert into public.payouts (
    id, instructor_id, booking_id, first_amount, second_amount, status,
    withholding_tax_rate, withholding_tax_amount, net_payout_amount, business_type_at_payout
  )
  values (
    gen_random_uuid(), v_instructor_id, p_booking_id, v_first_amount, v_second_amount, v_payout_status,
    v_withholding_rate, v_withholding_amount, v_net_amount, v_business_type
  )
  returning id into v_payout_id;

  v_invoice_period := date_trunc('month', now())::date;
  perform pg_advisory_xact_lock(hashtext('booking_settlement_invoice_seq_' || to_char(v_invoice_period, 'YYYYMM')));

  if exists (select 1 from public.invoices where booking_id = p_booking_id) then
    return;
  end if;

  select count(*) into v_invoice_seq from public.invoices where period = v_invoice_period;
  v_invoice_seq := v_invoice_seq + 1;
  v_invoice_id := 'INV-' || to_char(v_invoice_period, 'YYYYMM') || '-' || lpad(v_invoice_seq::text, 6, '0');

  insert into public.invoices (id, booking_id, payout_id, gmv_amount, platform_fee_amount, instructor_amount, refund_amount, period)
  values (
    v_invoice_id,
    p_booking_id,
    v_payout_id,
    coalesce(v_booking.total_paid, 0),
    coalesce(v_booking.platform_fee, 0),
    round(v_principal * v_retained_fraction),
    coalesce(v_booking.refund_amount, 0),
    v_invoice_period
  );
end;
$$;

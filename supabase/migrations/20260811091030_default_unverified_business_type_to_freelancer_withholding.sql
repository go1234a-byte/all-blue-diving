-- 사업자 유형을 아직 신고하지 않은(business_type IS NULL) 강사는 프리랜서와 동일하게
-- 3.3% 원천징수를 기본 적용한다. 기존에는 NULL이면 0%(사업자와 동일 취급)로 계산되어,
-- 세무상 원천징수 대상인데도 미신고 상태를 "사업자"처럼 취급해 세금을 떼지 않는
-- 문제가 있었다. individual/corporation으로 명시적으로 신고한 경우만 0%를 유지한다.
create or replace function public.create_booking_settlement(p_booking_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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

  v_principal := coalesce(v_booking.base_price, 0) + coalesce(v_booking.options_cost, 0);
  v_first_amount := round(v_principal * 0.8);
  v_second_amount := round(v_principal * 0.2);
  v_withholding_amount := round(v_principal * v_withholding_rate);
  v_net_amount := v_principal - v_withholding_amount;

  insert into public.payouts (
    id, instructor_id, booking_id, first_amount, second_amount, status,
    withholding_tax_rate, withholding_tax_amount, net_payout_amount, business_type_at_payout
  )
  values (
    gen_random_uuid(), v_instructor_id, p_booking_id, v_first_amount, v_second_amount, 'scheduled',
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
    v_principal,
    0,
    v_invoice_period
  );
end;
$function$;

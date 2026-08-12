
-- create_booking_settlement / cancel_booking_settlement 두 RPC는 이전 세션에서 Supabase
-- SQL Editor로 직접 생성되어 DB에는 존재하지만 supabase_migrations.schema_migrations에
-- 기록되지 않았던 스키마 드리프트였다(로컬 supabase/migrations/에도 대응 파일 없음).
-- 동작 변경 없이 동일한 정의를 apply_migration으로 재기록해 정식 마이그레이션 이력에 편입시킨다.

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
$$;

create or replace function public.cancel_booking_settlement(p_booking_id uuid, p_refund_amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not (public.owns_booking(p_booking_id) or public.is_admin()) then
    raise exception 'not authorized to cancel settlement for this booking';
  end if;

  update public.payouts
  set status = 'cancelled'
  where booking_id = p_booking_id
    and status <> 'released';

  update public.invoices
  set refund_amount = p_refund_amount
  where booking_id = p_booking_id;
end;
$$;

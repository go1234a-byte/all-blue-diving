
create or replace function public.validate_booking_price()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_tour record;
  v_participant_count integer;
  v_expected_base_price numeric;
  v_expected_options_cost numeric := 0;
  v_expected_subtotal numeric;
  v_expected_platform_fee numeric;
  v_expected_discount numeric := 0;
  v_expected_total numeric;
  v_coupon record;
  v_sel jsonb;
  v_opt_unit_price numeric;
begin
  select base_price, custom_options into v_tour
  from public.tours
  where id = new.tour_id;

  if not found then
    raise exception '존재하지 않는 투어입니다: %', new.tour_id;
  end if;

  v_participant_count := greatest(coalesce(new.participant_count, 1), 1);
  v_expected_base_price := v_tour.base_price * v_participant_count;

  for v_sel in select * from jsonb_array_elements(coalesce(new.selected_options, '[]'::jsonb))
  loop
    select (o->>'price')::numeric into v_opt_unit_price
    from jsonb_array_elements(coalesce(v_tour.custom_options, '[]'::jsonb)) o
    where o->>'name' = v_sel->>'name' and coalesce((o->>'isActive')::boolean, true)
    limit 1;

    if v_opt_unit_price is null then
      raise exception '유효하지 않은 옵션입니다: %', v_sel->>'name';
    end if;

    v_expected_options_cost := v_expected_options_cost + v_opt_unit_price * v_participant_count;
  end loop;

  v_expected_subtotal := v_expected_base_price + v_expected_options_cost;
  v_expected_platform_fee := round(v_expected_subtotal * 0.1);

  if new.coupon_code is not null then
    select * into v_coupon from public.coupons where code = new.coupon_code;
    if not found
      or not v_coupon.active
      or (v_coupon.expires_at is not null and v_coupon.expires_at < now())
      or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit)
      or v_expected_subtotal < v_coupon.min_purchase
    then
      raise exception '사용할 수 없는 쿠폰입니다: %', new.coupon_code;
    end if;

    v_expected_discount := case when v_coupon.discount_type = 'percent'
      then round(v_expected_subtotal * v_coupon.discount_value / 100.0)
      else v_coupon.discount_value::numeric end;
    if v_coupon.discount_type = 'percent' and v_coupon.max_discount is not null then
      v_expected_discount := least(v_expected_discount, v_coupon.max_discount);
    end if;
    v_expected_discount := least(v_expected_discount, v_expected_subtotal + v_expected_platform_fee);
  end if;

  v_expected_total := v_expected_subtotal + v_expected_platform_fee - v_expected_discount;

  if new.base_price is distinct from v_expected_base_price
    or new.options_cost is distinct from v_expected_options_cost
    or new.platform_fee is distinct from v_expected_platform_fee
    or coalesce(new.discount_amount, 0) is distinct from v_expected_discount
    or new.total_paid is distinct from v_expected_total
  then
    raise exception '가격 검증 실패: 청구 금액이 서버 계산값과 일치하지 않습니다. (base=% options=% fee=% discount=% total=%, expected base=% options=% fee=% discount=% total=%)',
      new.base_price, new.options_cost, new.platform_fee, coalesce(new.discount_amount,0), new.total_paid,
      v_expected_base_price, v_expected_options_cost, v_expected_platform_fee, v_expected_discount, v_expected_total;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_booking_price_trg on public.bookings;
create trigger validate_booking_price_trg
before insert or update of base_price, options_cost, platform_fee, total_paid, discount_amount, coupon_code, selected_options, participant_count, tour_id
on public.bookings
for each row execute function public.validate_booking_price();

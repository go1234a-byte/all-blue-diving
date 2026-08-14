-- 한정수량 쿠폰(usage_limit) 동시성 레이스: validate_booking_price 트리거는 쿠폰 유효성만
-- "조회"해서 검증하고, 실제 사용횟수 증가(used_count+1)는 프론트엔드가 예약 생성 이후 별도로
-- redeem_coupon RPC를 호출해서 처리했다. 검증과 소비가 서로 다른 트랜잭션으로 분리돼 있어서,
-- 같은 한정수량(예: usage_limit=1) 쿠폰으로 거의 동시에 두 건의 결제가 들어오면 둘 다
-- "아직 used_count < usage_limit"를 보고 통과해버릴 수 있었다 — redeem_coupon 자체는 원자적
-- UPDATE라 used_count가 한도를 넘어서지는 않지만(카운터 자체는 정확), 이미 두 예약 모두
-- 할인된 금액으로 확정된 뒤라 실질적으로 한도보다 많은 주문에 할인이 적용되는 문제였다.
--
-- 검증과 소비를 이 트리거 안에서 원자적 UPDATE...WHERE 한 번으로 합친다 — 같은 예약 INSERT
-- 트랜잭션 안에서 즉시 소비까지 끝내므로, 두 번째 동시 요청은 이 UPDATE가 0 rows를 갱신하는
-- 순간(방금 첫 번째 요청이 먼저 커밋해 한도를 채웠으므로) 바로 예외로 걸러진다.
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

    -- 검증 직후, 같은 트랜잭션 안에서 즉시 원자적으로 소비한다(where 절이 위 검증 조건을
    -- 그대로 반복 — 동시 요청 중 하나만 이 UPDATE를 통과한다).
    update public.coupons
    set used_count = used_count + 1
    where code = new.coupon_code
      and active
      and (expires_at is null or expires_at >= now())
      and (usage_limit is null or used_count < usage_limit)
      and min_purchase <= v_expected_subtotal;

    if not found then
      raise exception '사용할 수 없는 쿠폰입니다(이미 소진됨): %', new.coupon_code;
    end if;
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
-- (트리거 자체는 기존 것 그대로 재사용 — 함수만 교체됨)

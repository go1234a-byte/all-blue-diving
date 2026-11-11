-- 결제 구조 개선: 예약은 "서버가 정한 금액의 주문 → 토스 승인 → 서버가 예약 생성" 순서로만 만들어진다.
-- 지금까지는 결제 뒤 브라우저가 bookings에 직접 insert했고(결제 증빙 없음, 금액은 클라이언트가 보낸 값),
-- DB 트리거(block_bookings_until_payment_contract)가 막아 두고 있었다. 이 트리거는 그대로 둔다 — 서비스 롤
-- (auth.uid() 없음)과 관리자만 통과하므로, 앞으로 예약 생성은 finalize_paid_order(서비스 롤 전용)로만 가능하다.

-- 1) 예약에 결제 증빙 연결(기존 예약은 null)
alter table public.bookings add column if not exists order_id text;
alter table public.bookings add column if not exists payment_key text;
create unique index if not exists bookings_order_id_key on public.bookings (order_id) where order_id is not null;
create unique index if not exists bookings_payment_key_key on public.bookings (payment_key) where payment_key is not null;

-- 2) 주문 테이블: 클라이언트는 읽기만(본인 것), 쓰기는 아래 함수로만.
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique,
  diver_id text not null,
  tour_id uuid not null references public.tours(id),
  amount numeric not null check (amount >= 100),
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  payment_key text unique,
  payment_method text,
  booking_id uuid,
  failure_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payment_orders_diver_idx on public.payment_orders (diver_id, created_at desc);
alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from anon, authenticated;
grant select on public.payment_orders to authenticated;
drop policy if exists payment_orders_select_own on public.payment_orders;
create policy payment_orders_select_own on public.payment_orders for select
  using (diver_id = auth.uid()::text or public.is_admin());

-- 3) 금액 계산(쿠폰은 소비하지 않고 검증·계산만). 실제 소비와 최종 검증은 bookings insert 트리거(validate_booking_price)가 한다.
create or replace function public.quote_booking(
  p_tour_id uuid, p_participant_count integer, p_selected_options jsonb, p_coupon_code text
) returns table(base_price numeric, options_cost numeric, platform_fee numeric, discount_amount numeric, total numeric)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_tour record; v_n integer; v_base numeric; v_opts numeric := 0; v_sub numeric; v_fee numeric; v_disc numeric := 0;
  v_coupon record; v_sel jsonb; v_unit numeric;
begin
  select t.base_price, t.custom_options into v_tour from public.tours t where t.id = p_tour_id;
  if not found then raise exception '존재하지 않는 투어입니다'; end if;
  v_n := greatest(coalesce(p_participant_count, 1), 1);
  v_base := v_tour.base_price * v_n;
  for v_sel in select * from jsonb_array_elements(coalesce(p_selected_options, '[]'::jsonb)) loop
    select (o->>'price')::numeric into v_unit
    from jsonb_array_elements(coalesce(v_tour.custom_options, '[]'::jsonb)) o
    where o->>'name' = v_sel->>'name' and coalesce((o->>'isActive')::boolean, true) limit 1;
    if v_unit is null then raise exception '유효하지 않은 옵션입니다: %', v_sel->>'name'; end if;
    v_opts := v_opts + v_unit * v_n;
  end loop;
  v_sub := v_base + v_opts;
  v_fee := round(v_sub * 0.1);
  if p_coupon_code is not null then
    select * into v_coupon from public.coupons c where c.code = p_coupon_code;
    if not found or not v_coupon.active
       or (v_coupon.expires_at is not null and v_coupon.expires_at < now())
       or (v_coupon.usage_limit is not null and v_coupon.used_count >= v_coupon.usage_limit)
       or v_sub < v_coupon.min_purchase then
      raise exception '사용할 수 없는 쿠폰입니다: %', p_coupon_code;
    end if;
    v_disc := case when v_coupon.discount_type = 'percent' then round(v_sub * v_coupon.discount_value / 100.0) else v_coupon.discount_value::numeric end;
    if v_coupon.discount_type = 'percent' and v_coupon.max_discount is not null then v_disc := least(v_disc, v_coupon.max_discount); end if;
    v_disc := least(v_disc, v_sub + v_fee);
  end if;
  return query select v_base, v_opts, v_fee, v_disc, v_sub + v_fee - v_disc;
end;
$$;
revoke all on function public.quote_booking(uuid, integer, jsonb, text) from public, anon;
grant execute on function public.quote_booking(uuid, integer, jsonb, text) to authenticated, service_role;

-- 4) 결제 직전에 호출: 로그인한 다이버의 주문을 만들고 서버가 계산한 금액을 돌려준다.
create or replace function public.create_payment_order(
  p_tour_id uuid, p_participant_count integer, p_selected_options jsonb, p_coupon_code text,
  p_diver_name text, p_gender text, p_snoring boolean, p_smoking boolean, p_drinking boolean,
  p_room_note text, p_companions jsonb, p_companion_names text
) returns table(order_id text, amount numeric)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid text := auth.uid()::text; v_tour record; v_q record; v_n integer; v_oid text; v_taken integer;
begin
  if v_uid is null then raise exception '로그인이 필요합니다.'; end if;
  v_n := greatest(coalesce(p_participant_count, 1), 1);
  select t.id, t.status, t.max_participants, t.cancelled_at, t.admin_status into v_tour from public.tours t where t.id = p_tour_id;
  if not found or v_tour.status <> 'open' or v_tour.cancelled_at is not null or v_tour.admin_status is not null then
    raise exception '예약할 수 없는 투어입니다.';
  end if;
  if exists (select 1 from public.bookings b where b.tour_id = p_tour_id and b.diver_id = v_uid and b.status <> 'cancelled') then
    raise exception '이미 이 투어에 예약하셨습니다.';
  end if;
  select coalesce(sum(b.participant_count), 0) into v_taken from public.bookings b where b.tour_id = p_tour_id and b.status <> 'cancelled';
  if v_taken + v_n > v_tour.max_participants then
    raise exception '잔여 정원은 %명입니다.', greatest(v_tour.max_participants - v_taken, 0);
  end if;
  select * into v_q from public.quote_booking(p_tour_id, v_n, p_selected_options, p_coupon_code);
  if v_q.total < 100 then raise exception '결제 금액은 100원 이상이어야 합니다.'; end if;
  v_oid := 'allblue-' || (extract(epoch from clock_timestamp()) * 1000)::bigint || '-' || replace(gen_random_uuid()::text, '-', '');
  v_oid := left(v_oid, 64);
  insert into public.payment_orders (order_id, diver_id, tour_id, amount, payload) values (
    v_oid, v_uid, p_tour_id, v_q.total,
    jsonb_build_object(
      'diver_name', coalesce(nullif(trim(p_diver_name), ''), '다이버'),
      'base_price', v_q.base_price, 'options_cost', v_q.options_cost, 'selected_options', coalesce(p_selected_options, '[]'::jsonb),
      'platform_fee', v_q.platform_fee, 'total_paid', v_q.total, 'on_site_balance', 0,
      'coupon_code', p_coupon_code, 'discount_amount', case when v_q.discount_amount > 0 then v_q.discount_amount else null end,
      'gender', coalesce(p_gender, 'male'), 'snoring', coalesce(p_snoring, false), 'smoking', coalesce(p_smoking, false),
      'drinking', coalesce(p_drinking, false), 'room_note', nullif(trim(coalesce(p_room_note, '')), ''),
      'participant_count', v_n, 'companions', coalesce(p_companions, '[]'::jsonb), 'companion_names', p_companion_names
    )
  );
  return query select v_oid, v_q.total;
end;
$$;
revoke all on function public.create_payment_order(uuid, integer, jsonb, text, text, text, boolean, boolean, boolean, text, jsonb, text) from public, anon;
grant execute on function public.create_payment_order(uuid, integer, jsonb, text, text, text, boolean, boolean, boolean, text, jsonb, text) to authenticated;

-- 5) 토스 승인 직후 서버(서비스 롤)가 호출: 주문 → 예약 생성. 같은 주문은 한 번만(멱등).
create or replace function public.finalize_paid_order(p_order_id text, p_payment_key text, p_method text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare o public.payment_orders; v_id uuid; p jsonb;
begin
  select * into o from public.payment_orders where order_id = p_order_id for update;
  if not found then raise exception '주문을 찾을 수 없습니다.'; end if;
  if o.status = 'paid' then return o.booking_id; end if;
  if o.status <> 'pending' then raise exception '결제할 수 없는 주문입니다(%).', o.status; end if;
  p := o.payload;
  insert into public.bookings (
    tour_id, diver_id, diver_name, base_price, options_cost, selected_options, platform_fee, total_paid, on_site_balance,
    coupon_code, discount_amount, payment_method, gender, snoring, smoking, drinking, room_note, participant_count,
    companion_names, companions, deposit_status, status, order_id, payment_key
  ) values (
    o.tour_id, o.diver_id, p->>'diver_name', (p->>'base_price')::numeric, (p->>'options_cost')::numeric, p->'selected_options',
    (p->>'platform_fee')::numeric, (p->>'total_paid')::numeric, 0,
    p->>'coupon_code', (p->>'discount_amount')::integer, p_method, p->>'gender', (p->>'snoring')::boolean, (p->>'smoking')::boolean,
    (p->>'drinking')::boolean, p->>'room_note', (p->>'participant_count')::integer,
    p->>'companion_names', coalesce(p->'companions', '[]'::jsonb), 'paid', 'confirmed', o.order_id, p_payment_key
  ) returning id into v_id;
  update public.payment_orders set status = 'paid', payment_key = p_payment_key, payment_method = p_method, booking_id = v_id, paid_at = now()
  where id = o.id;
  return v_id;
end;
$$;
revoke all on function public.finalize_paid_order(text, text, text) from public, anon, authenticated;
grant execute on function public.finalize_paid_order(text, text, text) to service_role;

-- 6) 승인 실패·환불 기록용(서비스 롤 전용)
create or replace function public.mark_payment_order(p_order_id text, p_status text, p_reason text)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update public.payment_orders set status = p_status, failure_reason = left(p_reason, 500)
  where order_id = p_order_id and status in ('pending', 'failed') and p_status in ('failed', 'refunded');
$$;
revoke all on function public.mark_payment_order(text, text, text) from public, anon, authenticated;
grant execute on function public.mark_payment_order(text, text, text) to service_role;

-- 7) 차단 트리거 메시지만 바꾼다(동작 동일: 서비스 롤·관리자·심사용 데모 계정만 직접 insert 가능).
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
  raise exception '예약은 결제를 통해서만 만들 수 있습니다. 결제 화면에서 다시 시도해 주세요.';
end;
$$;

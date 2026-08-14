-- 20260813150000에서 시도한 `revoke update (refund_rate, refund_amount) on public.bookings
-- from authenticated`도 profiles와 동일하게 이 플랫폼에서 실제로 적용되지 않는 것을 확인했다.
-- GRANT/REVOKE 대신 트리거로 대체한다.
--
-- profiles와 달리 여기는 "admin만 허용"이 아니라 "cancel_booking_with_refund RPC를 거쳤을
-- 때만 허용"이 규칙이다(다이버 본인 취소도 정당한 경로이므로 is_admin()만으로는 못 막는다).
-- RPC가 자기 UPDATE 직전에 트랜잭션 로컬 설정(app.allow_refund_write)을 켜두고, 트리거는 그
-- 설정이 켜져 있을 때만 통과시킨다 — 트랜잭션이 끝나면 자동으로 꺼지므로 다른 요청에 영향을
-- 주지 않는다.
create or replace function public.guard_bookings_refund_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (new.refund_rate is distinct from old.refund_rate or new.refund_amount is distinct from old.refund_amount)
     and coalesce(current_setting('app.allow_refund_write', true), '') <> 'on' then
    raise exception 'refund_rate/refund_amount can only be changed via cancel_booking_with_refund';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_bookings_refund_columns_trg on public.bookings;
create trigger guard_bookings_refund_columns_trg
before update on public.bookings
for each row
execute function public.guard_bookings_refund_columns();

-- cancel_booking_with_refund이 자기 UPDATE 직전에 위 가드를 통과시키도록 재정의(로직은 동일,
-- perform set_config(...) 한 줄만 추가).
create or replace function public.cancel_booking_with_refund(
  p_booking_id uuid,
  p_reason text,
  p_full_refund boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_booking record;
  v_start_date date;
  v_days_remaining int;
  v_refund_rate numeric;
  v_refund_amount numeric;
  v_is_privileged boolean;
begin
  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'booking % not found', p_booking_id;
  end if;

  v_is_privileged := public.is_admin() or public.owns_tour(v_booking.tour_id);

  if not (public.owns_booking(p_booking_id) or v_is_privileged) then
    raise exception 'not authorized to cancel this booking';
  end if;

  if v_booking.status = 'cancel_pending_review' and v_is_privileged then
    null;
  elsif v_booking.status <> 'confirmed' then
    raise exception 'booking is not in a cancellable state';
  end if;

  if p_full_refund and v_is_privileged then
    v_refund_rate := 1.0;
  else
    select start_date into v_start_date from public.tours where id = v_booking.tour_id;
    v_days_remaining := v_start_date - current_date;

    v_refund_rate := case
      when v_days_remaining >= 30 then 1.0
      when v_days_remaining >= 15 then 0.5
      when v_days_remaining >= 7 then 0.3
      else 0.0
    end;
  end if;

  v_refund_amount := round(coalesce(v_booking.total_paid, 0) * v_refund_rate);

  perform set_config('app.allow_refund_write', 'on', true);

  update public.bookings
  set status = 'cancelled',
      cancel_reason = p_reason,
      refund_rate = v_refund_rate,
      refund_amount = v_refund_amount,
      cancel_requested_at = case when p_full_refund and v_is_privileged then now() else cancel_requested_at end
  where id = p_booking_id;

  perform public.cancel_booking_settlement(p_booking_id, v_refund_amount);
end;
$$;

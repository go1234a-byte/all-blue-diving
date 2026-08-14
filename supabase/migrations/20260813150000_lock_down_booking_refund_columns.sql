-- bookings.refund_rate/refund_amount는 취소 시 실제로 돌려줘야 할 환불액을 결정하는 값인데,
-- bookings_update_own_or_tour_owner_or_admin 정책이 "본인 예약 row인지"만 확인하고 이 두
-- 컬럼 값 자체에는 아무 제약이 없었다 — profiles.role 취약점과 같은 유형이다. 다이버가 자기
-- 예약을 직접 UPDATE해서, 출발 임박(0% 환불 구간)에 취소해도 refund_rate=1(100%)을 임의로
-- 써넣을 수 있었다. cancel_booking_settlement RPC도 p_refund_amount를 그대로 믿고
-- invoices.refund_amount에 기록해서, bookings 테이블을 아예 안 건드리고 이 RPC만 직접
-- 호출해도 회계 기록을 조작할 수 있었다.
--
-- 두 컬럼의 UPDATE 권한을 회수하고, 실제 환불율(잔여일수 기준 정책 또는 운영 정책상 전액환불)을
-- 서버에서 재계산하는 RPC로만 쓰게 한다. 다이버 자기취소(CancelBookingDialog)와 강사의 개별
-- 예약 취소(TourCancelByInstructorCard)는 잔여일수 기준 정책, 관리자/강사의 강제 취소(최소인원
-- 미달, 강제취소, 취소요청 승인)는 전액환불 — 이 두 갈래는 기존 프론트 코드에서도 그대로였다.
revoke update (refund_rate, refund_amount) on public.bookings from authenticated;

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

  -- 일반 취소는 'confirmed'에서만 가능하다. 'cancel_pending_review'(증빙 심사 대기)는 admin/
  -- 투어 소유 강사가 심사를 승인(resolveCancellationReview)할 때만 여기서 'cancelled'로
  -- 전환된다 — 다이버 본인은 심사 대기 중인 예약을 이 경로로 취소할 수 없다.
  if v_booking.status = 'cancel_pending_review' and v_is_privileged then
    null; -- 승인 경로, 통과
  elsif v_booking.status <> 'confirmed' then
    raise exception 'booking is not in a cancellable state';
  end if;

  -- 강제 전액환불(p_full_refund)은 관리자/투어를 소유한 강사만 쓸 수 있다 — 최소인원 미달
  -- 취소, 투어 강제취소, 취소요청 승인 등 "운영 정책상 100% 환불" 케이스 전용이다. 다이버
  -- 본인이 이 값을 true로 보내도 v_is_privileged가 아니면 무시되고 아래 잔여일수 기준 정책이
  -- 그대로 적용된다 — 클라이언트가 이 파라미터로 환불율을 임의로 결정할 수 없다.
  if p_full_refund and v_is_privileged then
    v_refund_rate := 1.0;
  else
    select start_date into v_start_date from public.tours where id = v_booking.tour_id;
    v_days_remaining := v_start_date - current_date;

    -- src/lib/refund.ts의 computeRefundRate와 동일한 규정(그 파일이 유일한 소스라는 주석이
    -- 있으니, 정책이 바뀌면 반드시 여기도 같이 고칠 것) — 이 함수가 실제 환불액을 결정하는
    -- 유일한 서버 측 소스다.
    v_refund_rate := case
      when v_days_remaining >= 30 then 1.0
      when v_days_remaining >= 15 then 0.5
      when v_days_remaining >= 7 then 0.3
      else 0.0
    end;
  end if;

  v_refund_amount := round(coalesce(v_booking.total_paid, 0) * v_refund_rate);

  update public.bookings
  set status = 'cancelled',
      cancel_reason = p_reason,
      refund_rate = v_refund_rate,
      refund_amount = v_refund_amount,
      -- 기존 프론트 코드에서 강제 전액환불 3곳(최소인원 미달/강제취소/이의신청 승인)만
      -- cancel_requested_at을 채웠고, 다이버 자기취소/이의신청 승인 단건 처리는 채우지 않았다
      -- — 그 구분을 그대로 유지한다.
      cancel_requested_at = case when p_full_refund and v_is_privileged then now() else cancel_requested_at end
  where id = p_booking_id;

  perform public.cancel_booking_settlement(p_booking_id, v_refund_amount);
end;
$$;

-- cancel_booking_settlement은 이제 위 RPC를 거쳐서만 호출되는 게 정상 경로다. 외부에서 이
-- RPC가 직접 호출되는 경우에 대비해, 클라이언트가 넘긴 p_refund_amount를 그대로 믿지 않고
-- bookings에 실제로 기록된 값과 대조한다 — 다르면 거부한다(정상 흐름에서는
-- cancel_booking_with_refund가 이미 옳은 값을 써놓은 뒤에만 호출하므로 항상 일치한다).
--
-- 겸사겸사 발견한 기존 버그도 같이 고친다: 기존 인가 조건(owns_booking 또는 is_admin)은
-- "강사가 자기 투어의 취소를 처리하는 경우"(resolveUnderMinDecision/cancelTourByInstructor —
-- 강사는 다이버 본인이 아니고 관리자도 아님)를 빠뜨리고 있어서, 강사가 처리할 때마다 이 RPC가
-- "not authorized"로 조용히 실패하고 있었다(예약 취소 자체는 처리됐지만 정산은 안 되돌아감).
-- owns_booking_tour(투어를 소유한 강사인지)를 추가해서 막는다.
create or replace function public.cancel_booking_settlement(p_booking_id uuid, p_refund_amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_actual_refund_amount numeric;
begin
  if not (public.owns_booking(p_booking_id) or public.owns_booking_tour(p_booking_id) or public.is_admin()) then
    raise exception 'not authorized to cancel settlement for this booking';
  end if;

  select refund_amount into v_actual_refund_amount from public.bookings where id = p_booking_id;
  if v_actual_refund_amount is distinct from p_refund_amount then
    raise exception 'refund amount mismatch — call cancel_booking_with_refund instead of calling this RPC directly';
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

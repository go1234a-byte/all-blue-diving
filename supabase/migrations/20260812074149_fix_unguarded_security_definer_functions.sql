-- 1) apply_tour_auto_close trusted a client-supplied p_meets_minimum instead of
--    recomputing it, letting any caller force-close any open tour with a false
--    claim. New signature drops that param and recomputes everything server-side
--    from the same policy in src/lib/tourAutoClose.ts.
drop function if exists public.apply_tour_auto_close(uuid, boolean);

create or replace function public.apply_tour_auto_close(p_tour_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tour record;
  v_confirmed_count integer;
  v_meets_minimum boolean;
begin
  select * into v_tour from public.tours where id = p_tour_id;
  if not found then
    return;
  end if;

  if v_tour.status <> 'open' or v_tour.auto_close_processed or v_tour.admin_status is not null then
    return;
  end if;

  -- 24h creation grace period (RECRUITMENT_AUTO_CLOSE_GRACE_PERIOD_HOURS)
  if v_tour.created_at > now() - interval '24 hours' then
    return;
  end if;

  -- past (start_date - 30 days) (RECRUITMENT_AUTO_CLOSE_DAYS_BEFORE_START)
  if current_date < (v_tour.start_date - 30) then
    return;
  end if;

  select count(*) into v_confirmed_count
  from public.bookings
  where tour_id = p_tour_id and status = 'confirmed';

  v_meets_minimum := v_confirmed_count >= v_tour.min_participants;

  if v_meets_minimum then
    update public.tours
    set status = 'closed', auto_close_processed = true
    where id = p_tour_id and status = 'open' and auto_close_processed = false;
  else
    update public.tours
    set status = 'closed', auto_close_processed = true, under_min_decision_pending = true
    where id = p_tour_id and status = 'open' and auto_close_processed = false;
  end if;
end;
$function$;

-- 2) get_tour_participants_masked had no check that the caller is actually
--    connected to the tour, so anyone who knew a tour_id could pull every
--    participant's gender/smoking/drinking/snoring/room info.
create or replace function public.get_tour_participants_masked(p_tour_id uuid)
returns table(id uuid, diver_id text, diver_name_masked text, gender text, snoring boolean, smoking boolean, drinking boolean, room_note text, room_no text, status text, participant_count integer, selected_options jsonb)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if not (
    public.is_admin()
    or public.owns_tour(p_tour_id)
    or exists (
      select 1 from public.bookings mine
      where mine.tour_id = p_tour_id and mine.diver_id = auth.uid()::text
    )
  ) then
    raise exception 'not authorized to view participants for this tour';
  end if;

  return query
  select
    b.id,
    b.diver_id,
    case
      when b.diver_name is null or length(b.diver_name) <= 1 then coalesce(b.diver_name, '')
      else left(b.diver_name, 1) || repeat('*', length(b.diver_name) - 1)
    end as diver_name_masked,
    b.gender,
    b.snoring,
    b.smoking,
    b.drinking,
    b.room_note,
    b.room_no,
    b.status,
    b.participant_count,
    b.selected_options
  from public.bookings b
  where b.tour_id = p_tour_id
    and b.status <> 'cancelled';
end;
$function$;

-- 3) redeem_coupon and report_review had no identity check at all — anon or any
--    authenticated user could burn arbitrary coupons or mass-flag any review.
--    Minimal fix: require a logged-in caller (full per-user rate limiting would
--    need a redemptions/reports table — flagged as a follow-up, not done here).
create or replace function public.redeem_coupon(p_coupon_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'authentication required to redeem a coupon';
  end if;

  update public.coupons
  set used_count = used_count + 1
  where id = p_coupon_id
    and active = true
    and (usage_limit is null or used_count < usage_limit);
end;
$function$;

create or replace function public.report_review(p_review_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'authentication required to report a review';
  end if;

  update public.reviews set reported = true where id = p_review_id;
end;
$function$;

grant execute on function public.apply_tour_auto_close(uuid) to anon, authenticated;
grant execute on function public.get_tour_participants_masked(uuid) to anon, authenticated;

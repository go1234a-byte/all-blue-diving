-- 하루 1회 시간 기준 알림 생성 (추가만). 미적용·미검증 상태로 작성됨.
-- 호출은 service_role 전용 (Vercel Cron → rpc). 클라이언트에서 실행할 수 없다.

create or replace function public.tour_generate_checklist_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 4단계 자리: 준비물 리마인드 알림을 여기에 추가한다. 지금은 0건.
  return 0;
end;
$$;

create or replace function public.tour_generate_daily_alerts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n_deadline int := 0;
  n_checklist int := 0;
begin
  -- 찜한 투어의 모집 마감 D-7, D-1
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url, dedupe_key)
  select f.profile_id::text, t.id,
         'deadline_d' || d.days,
         '모집 마감 D-' || d.days,
         t.title || ' 모집이 곧 마감돼요',
         '/tour/' || t.id::text,
         'deadline_d' || d.days || ':' || t.id::text || ':' || f.profile_id::text
  from (values (7), (1)) as d(days)
  join public.tours t on t.recruitment_deadline = current_date + d.days
  join public.favorites f on f.target_type = 'tour' and f.target_id = t.id::text
  where t.cancelled_at is null
    and t.admin_status is null
    and t.status = 'open'
    and not exists (
      select 1 from public.bookings b
      where b.tour_id = t.id and b.diver_id = f.profile_id::text and b.status <> 'cancelled'
    )
    and not exists (
      select 1 from public.tour_notification_settings s
      where s.diver_id = f.profile_id::text and s.push_enabled = false
    )
  on conflict (dedupe_key) do nothing;
  get diagnostics n_deadline = row_count;

  n_checklist := public.tour_generate_checklist_reminders();
  return n_deadline + n_checklist;
end;
$$;

revoke all on function public.tour_generate_checklist_reminders() from public, anon, authenticated;
revoke all on function public.tour_generate_daily_alerts() from public, anon, authenticated;
grant execute on function public.tour_generate_checklist_reminders() to service_role;
grant execute on function public.tour_generate_daily_alerts() to service_role;

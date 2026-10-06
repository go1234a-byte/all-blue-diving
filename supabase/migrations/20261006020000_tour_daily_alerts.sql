-- 하루 1회 시간 기준 알림 생성 (추가만). 미적용·미검증 상태로 작성됨.
-- 4-2: 준비물 리마인드(tour_generate_checklist_reminders) 실제 구현 포함.
-- 호출은 service_role 전용 (Vercel Cron → rpc). 클라이언트에서 실행할 수 없다.

-- 출발 D-7 / D-1 준비물 리마인드: 확정 예약자 중 아직 다 챙기지 않은 다이버에게 1건씩 (같은 날 재실행 중복 없음).
-- 대상: 준비물 상태 행이 없음(아직 열어보지 않음) 또는 checked_count < total_count
--       또는 강사 항목 중 체크도 숨김도 하지 않은 것이 있음(강사가 나중에 추가한 경우).
-- 제외: 전부 체크한 다이버, 취소된 예약, 취소·정지 투어, checklist_reminders_enabled = false 인 다이버.
-- 날짜는 DB의 current_date를 쓴다. Vercel Cron이 KST 10:00(UTC 01:00)에 실행하므로 UTC 날짜 = KST 날짜.
create or replace function public.tour_generate_checklist_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n_checklist int := 0;
begin
  insert into public.tour_diver_notifications (diver_id, tour_id, kind, title, body, url, dedupe_key)
  select b.diver_id, t.id, 'checklist_d' || d.days,
         t.title || ' · 준비물 확인 D-' || d.days,
         case
           when s.diver_id is null then '출발 전 준비물을 확인해 보세요'
           when s.checked_count >= s.total_count then '강사님이 준비물을 추가했어요. 확인해 보세요'
           else '아직 챙기지 않은 준비물 ' || (s.total_count - s.checked_count) || '개'
         end,
         '/trip/' || t.id::text || '/checklist',
         'checklist_d' || d.days || ':' || t.id::text || ':' || b.diver_id
  from (values (7), (1)) as d(days)
  join public.tours t on t.start_date = current_date + d.days
  join public.bookings b on b.tour_id = t.id and b.status = 'confirmed'
  left join public.tour_checklist_state s on s.diver_id = b.diver_id and s.tour_id = t.id
  where t.cancelled_at is null
    and t.admin_status is null
    and (
      -- 1) 상태 행이 없음(아직 안 열어봄)  2) 집계상 덜 챙김  3) 강사 항목 중 체크도 숨김도 안 한 것이 있음
      s.diver_id is null
      or s.checked_count < s.total_count
      or exists (
        select 1
        from jsonb_array_elements(case when jsonb_typeof(t.checklist_items) = 'array' then t.checklist_items else '[]'::jsonb end) e
        where coalesce(e->>'key', '') <> ''
          and not ((e->>'key') = any(s.checked_keys))
          and not ((e->>'key') = any(s.hidden_keys))
      )
    )
    and not exists (
      select 1 from public.tour_notification_settings n
      where n.diver_id = b.diver_id and n.checklist_reminders_enabled = false
    )
  on conflict (dedupe_key) do nothing;
  get diagnostics n_checklist = row_count;
  return n_checklist;
exception when others then
  raise warning 'tour_generate_checklist_reminders 실패: %', sqlerrm;
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
      where s.diver_id = f.profile_id::text and s.favorite_alerts_enabled = false
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

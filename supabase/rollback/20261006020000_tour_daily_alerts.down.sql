-- 롤백: 일일 알림 함수 제거 (추가만 했으므로 이 두 함수만 지운다)
drop function if exists public.tour_generate_daily_alerts();
drop function if exists public.tour_generate_checklist_reminders();

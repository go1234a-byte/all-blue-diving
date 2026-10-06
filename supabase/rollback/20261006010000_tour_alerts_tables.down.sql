-- 롤백 2순위: 구독 상한 트리거와 테이블 (트리거 롤백 후 실행)
drop trigger if exists tour_alert_subscriptions_cap on public.tour_alert_subscriptions;
drop function if exists public.tour_alert_subscriptions_cap();
drop table if exists public.tour_checklist_state;
drop table if exists public.tour_alert_subscriptions;
drop table if exists public.tour_notification_settings;
drop table if exists public.tour_diver_notifications;
alter table public.tours drop column if exists checklist_items;

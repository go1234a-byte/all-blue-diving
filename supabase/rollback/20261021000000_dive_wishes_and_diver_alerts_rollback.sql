-- 20261021000000_dive_wishes_and_diver_alerts.sql 되돌리기 (수동 실행용)
-- 주의: dive_wishes / tour_seat_alerts / diver_alerts 데이터가 함께 삭제됩니다.
drop trigger if exists notify_dive_wishers_trg on public.tours;
drop trigger if exists notify_seat_watchers_trg on public.bookings;
drop function if exists public.notify_dive_wishers();
drop function if exists public.notify_seat_watchers();
drop function if exists public.get_dive_wish_demand();
alter publication supabase_realtime drop table public.diver_alerts;
drop table if exists public.diver_alerts;
drop table if exists public.tour_seat_alerts;
drop table if exists public.dive_wishes;

-- 롤백 1순위: 트리거 → 함수 (테이블보다 먼저). 트리거를 먼저 전부 지운 뒤 함수를 지운다.
drop trigger if exists tour_alerts_seats_on_booking_update on public.bookings;
drop trigger if exists tour_alerts_seats_on_booking_insert on public.bookings;
drop trigger if exists tour_alerts_seats_on_tours on public.tours;
drop trigger if exists tour_alerts_price_drop on public.tours;
drop trigger if exists tour_alerts_on_tours_insert on public.tours;
drop trigger if exists tour_alerts_on_bookings on public.bookings;
-- 이전 버전(tour_changed 트리거)이 적용돼 있었다면 지운다 (없으면 무시)
drop trigger if exists tour_alerts_on_tours on public.tours;

drop function if exists public.tour_alerts_on_booking_seats();
drop function if exists public.tour_alerts_on_tour_seats();
drop function if exists public.tour_alerts_on_price_drop();
drop function if exists public.tour_alerts_on_new_tour();
drop function if exists public.tour_alerts_on_booking_change();
-- 이전 버전(tour_changed 트리거)이 적용돼 있었다면 그 함수도 지운다 (없으면 무시)
drop function if exists public.tour_alerts_on_tour_change();
drop function if exists public.tour_alerts_apply_seat_events(uuid, text, integer, integer);
drop function if exists public.tour_alerts_favorite_recipients(uuid);
drop function if exists public.tour_alerts_confirmed_count(uuid);

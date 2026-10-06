-- 롤백 1순위: 트리거 → 함수 (테이블보다 먼저)
drop trigger if exists tour_alerts_on_tours_insert on public.tours;
drop trigger if exists tour_alerts_on_bookings on public.bookings;
drop trigger if exists tour_alerts_on_tours on public.tours;
drop function if exists public.tour_alerts_on_new_tour();
drop function if exists public.tour_alerts_on_booking_change();
drop function if exists public.tour_alerts_on_tour_change();

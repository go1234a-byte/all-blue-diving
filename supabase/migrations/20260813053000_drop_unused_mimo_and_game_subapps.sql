-- 다이빙 투어 예약 플랫폼과 무관한 별개 서브앱(살롱 예약 "Mimo", 다이빙 미니게임)을
-- 정리한다. 프론트엔드 라우트/컴포넌트는 이미 제거했고, 4개 테이블 모두 실사용
-- 데이터 0건인 것을 확인한 뒤 진행한다.
drop table if exists public.mimo_reservations cascade;
drop table if exists public.mimo_salons cascade;
drop table if exists public.mimo_users cascade;
drop table if exists public.game_players cascade;

drop function if exists public.settle_dive_score(text, text, integer);
drop function if exists public.set_equipped_skin(text, text);
drop function if exists public.consume_game_heart(text);
drop function if exists public.grant_continue_heart(text);

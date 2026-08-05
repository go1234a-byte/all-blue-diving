-- ALL BLUE 다이빙 플랫폼 — 롤백: 보안 강화 2단계(profiles 조회 잠금) 되돌리기
--
-- fix_profiles_select_lockdown.sql 적용 후 화면에서 회원정보(본인 것 포함)가 안 보이거나
-- 마이페이지/투어 참가자 목록 등이 깨지면, 이 파일을 Supabase SQL Editor에서 실행해
-- 즉시 이전 상태(profiles 테이블 전체 공개 조회)로 되돌릴 수 있습니다.
--
-- 주의: profiles_directory 뷰와 헬퍼 함수(is_profile_staff_for, is_tour_companion_of)는
-- 그대로 둬도 무해합니다(정책이 안 쓰면 그냥 안 불릴 뿐). 코드 패치까지 되돌리려면
-- 별도로 안내드린 코드 롤백 절차를 따라주세요.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_public" on public.profiles
  for select using (true);

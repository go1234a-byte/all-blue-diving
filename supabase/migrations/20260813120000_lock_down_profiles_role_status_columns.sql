-- profiles.role/status는 클라이언트가 직접 UPDATE할 수 있으면 안 되는 권한 컬럼이다.
-- profiles_update_own 정책이 (auth.uid() = id)만 확인하고 있어서, 로그인한 사용자 누구나
-- anon key로 본인 role을 'admin'으로 바꿔치기하면 그대로 통과했다(권한 상승 취약점).
-- 반대 방향으로도 문제였다: 관리자가 다른 사용자의 status를 정지 처리하는 setProfileStatus도
-- 같은 정책(자기 자신 row만 UPDATE 가능)에 막혀 실제로는 항상 실패하고 있었다(성공 토스트만
-- 뜨고 DB엔 반영 안 됨).
--
-- payouts(20260812015205)와 동일한 패턴으로 고친다: role/status는 컬럼 권한 자체를 회수해서
-- 일반 클라이언트 UPDATE로는 절대 못 건드리게 막고, 관리자 조작은 SECURITY DEFINER RPC로만
-- 허용한다. 이름/연락처 등 나머지 프로필 컬럼은 기존 profiles_update_own 정책 그대로 본인이
-- 수정 가능하다(이 REVOKE는 role/status 두 컬럼에만 적용됨).
revoke update (role, status) on public.profiles from authenticated;

create or replace function public.admin_set_profile_status(p_profile_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized to change profile status';
  end if;

  if p_status not in ('active', 'warned', 'suspended') then
    raise exception 'invalid profile status: %', p_status;
  end if;

  update public.profiles
  set status = p_status
  where id = p_profile_id;
end;
$$;

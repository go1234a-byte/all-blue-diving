-- 20260813120000에서 시도한 `revoke update (role, status) on public.profiles from authenticated`가
-- 이 프로젝트(EnterCloud Managed Supabase)에서는 실제로 적용되지 않는 것을 배포 후 직접
-- 테스트로 확인했다 — SQL Editor에서 revoke를 재실행해도, `set role authenticated;`로 직접
-- 전환해 UPDATE를 시도해도 계속 성공했다(has_column_privilege도 계속 true). 정확한 원인은
-- 알 수 없지만(관리형 플랫폼이 grant를 주기적으로 되돌리는 것으로 추정), GRANT/REVOKE에
-- 의존하지 않는 트리거 기반 가드로 대체한다 — 트리거는 REVOKE처럼 조용히 무력화될 수 없고
-- UPDATE가 실행될 때마다 항상 실제로 실행된다.
create or replace function public.guard_profiles_role_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_admin() then
    raise exception 'role/status can only be changed by an admin (use admin_set_profile_status)';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profiles_role_status_trg on public.profiles;
create trigger guard_profiles_role_status_trg
before update on public.profiles
for each row
execute function public.guard_profiles_role_status();

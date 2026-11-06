-- 데이터 되돌리기(20261106000100)를 먼저 실행한 뒤 이 파일을 실행한다.
-- 주의: 되돌리면 이 마이그레이션이 막은 관리자 역할 삽입·강사 자가 승인 구멍이 다시 열린다.
drop trigger if exists promote_profile_on_instructor_approval_trg on public.instructors;
drop function if exists public.promote_profile_on_instructor_approval();
drop trigger if exists guard_instructors_admin_fields_trg on public.instructors;
drop function if exists public.guard_instructors_admin_fields();
drop trigger if exists guard_profiles_role_on_insert_trg on public.profiles;
drop function if exists public.guard_profiles_role_on_insert();

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

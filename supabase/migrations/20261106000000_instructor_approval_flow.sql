-- 회원가입을 하나로 통일하고, 강사는 "가입 후 전환 신청 → 관리자 승인"으로만 될 수 있게 한다.
--
-- 예전 구멍 두 가지를 함께 막는다.
--   1. profiles INSERT에는 역할 검사가 없어 가입자가 API로 role='admin'을 넣을 수 있었다
--      (guard_profiles_role_status는 UPDATE에만 걸려 있다).
--   2. 본인 instructors 행을 수정할 수 있어 verified_status를 스스로 true로 바꿀 수 있었다.
--
-- auth.uid()가 없는 호출(SQL Editor·service role)은 사용자 요청이 아니므로 검사하지 않는다.
-- 이 전제는 profiles/instructors의 쓰기 RLS가 auth.uid()와 비교해 anon을 먼저 막기 때문에 성립한다.
-- anon에 열린 정책이나 anon이 실행할 수 있는 SECURITY DEFINER RPC로 이 테이블에 쓰게 되면 가드를 다시 봐야 한다.

-- 가입 시 역할은 항상 다이버. 스토어에 남아 있는 구버전 앱의 강사 가입은 role='instructor'를 보내므로
-- 오류로 막지 않고 다이버로 낮춘다 — 이어서 만드는 instructors 행이 그대로 승인 대기 신청이 된다.
create or replace function public.guard_profiles_role_on_insert()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if new.role = 'admin' then
    raise exception 'admin role can only be granted by an admin';
  end if;
  new.role := 'diver';
  return new;
end;
$$;

drop trigger if exists guard_profiles_role_on_insert_trg on public.profiles;
create trigger guard_profiles_role_on_insert_trg
before insert on public.profiles
for each row
execute function public.guard_profiles_role_on_insert();

create or replace function public.guard_profiles_role_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'role/status can only be changed by an admin (use admin_set_profile_status)';
  end if;
  return new;
end;
$$;

-- 승인·반려·경고는 관리자만. 반려된 신청자는 다시 신청하려고 반려 표시를 지우는 것만 할 수 있다.
create or replace function public.guard_instructors_admin_fields()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if exists (select 1 from public.instructors where profile_id = new.profile_id) then
      raise exception 'instructor application already exists for this account';
    end if;
    new.verified_status := false;
    new.verified_at := null;
    new.verified_by := null;
    new.rejected_at := null;
    new.rejected_by := null;
    new.rejection_reason := null;
    new.penalty_count := 0;
    return new;
  end if;

  if new.verified_status is distinct from old.verified_status
     or new.verified_at is distinct from old.verified_at
     or new.verified_by is distinct from old.verified_by
     or new.rejected_by is distinct from old.rejected_by
     or new.penalty_count is distinct from old.penalty_count
     or new.profile_id is distinct from old.profile_id then
    raise exception 'instructor approval fields can only be changed by an admin';
  end if;

  if (new.rejected_at is distinct from old.rejected_at and new.rejected_at is not null)
     or (new.rejection_reason is distinct from old.rejection_reason and new.rejection_reason is not null) then
    raise exception 'instructor approval fields can only be changed by an admin';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_instructors_admin_fields_trg on public.instructors;
create trigger guard_instructors_admin_fields_trg
before insert or update on public.instructors
for each row
execute function public.guard_instructors_admin_fields();

-- 승인되는 순간 강사 권한을 준다. 승인 경로가 어디든 여기 한 곳을 지난다.
-- 인증을 나중에 취소해도 역할은 유지한다 — 이미 연 투어의 예약·정산을 계속 처리해야 하고,
-- 신규 투어는 enforce_tour_creation_quota가 verified_status로 막는다.
create or replace function public.promote_profile_on_instructor_approval()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.profiles
  set role = 'instructor'
  where id::text = new.profile_id and role = 'diver';
  return new;
end;
$$;

drop trigger if exists promote_profile_on_instructor_approval_trg on public.instructors;
create trigger promote_profile_on_instructor_approval_trg
after update of verified_status on public.instructors
for each row
when (new.verified_status and not old.verified_status)
execute function public.promote_profile_on_instructor_approval();

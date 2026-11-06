-- 컬럼은 남긴다(저장된 보험 서류 경로와 확인 기록 보존). 가드는 20261106000000 판으로 되돌린다.
drop trigger if exists clear_bank_verification_on_account_change_trg on public.profiles;
drop function if exists public.clear_bank_verification_on_account_change();
drop trigger if exists require_documents_for_instructor_approval_trg on public.instructors;
drop function if exists public.require_documents_for_instructor_approval();
drop function if exists public.instructor_document_exists(text, text);

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

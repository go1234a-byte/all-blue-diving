-- 강사 승인 전에 필수 서류와 계좌 대조를 DB에서 강제한다. 예전에는 화면에서만 검사해서, API로 서류 없이
-- 신청한 건도 관리자가 승인 버튼을 누를 수 있었다. 이미 승인된 강사는 승인 전환 시점이 아니므로 영향이 없다.
-- 예금주 자동 조회를 붙이기 전까지는 관리자가 통장 사본과 신분증의 이름을 대조한 기록이 계좌 확인을 대신한다.
alter table public.instructors
  add column if not exists bank_verified_at timestamp with time zone,
  add column if not exists bank_verified_by text,
  add column if not exists insurance_file_names text[] default '{}'::text[],
  add column if not exists insurance_file_paths text[] default '{}'::text[];

-- 경로 문자열은 신청자가 아무 값이나 넣을 수 있으므로 실제 파일이 본인 폴더에 있는지 확인한다.
create or replace function public.instructor_document_exists(p_profile_id text, p_path text)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select coalesce(p_path, '') <> '' and exists (
    select 1 from storage.objects o
    where o.bucket_id = 'instructor-documents'
      and o.name = p_path
      and (storage.foldername(o.name))[1] = p_profile_id
  );
$$;

create or replace function public.require_documents_for_instructor_approval()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_profile public.profiles%rowtype;
  v_missing text[] := '{}';
begin
  if auth.uid() is null then
    return new;
  end if;
  select * into v_profile from public.profiles where id::text = new.profile_id;

  if not public.instructor_document_exists(new.profile_id, v_profile.id_document_path) then
    v_missing := v_missing || '신분증 사본'::text;
  end if;
  if not public.instructor_document_exists(new.profile_id, v_profile.bankbook_path) then
    v_missing := v_missing || '통장 사본'::text;
  end if;
  if coalesce(v_profile.bank_name, '') = '' or coalesce(v_profile.account_holder, '') = ''
     or coalesce(v_profile.account_number, '') = '' then
    v_missing := v_missing || '정산 계좌 정보'::text;
  end if;
  if coalesce(array_length(new.license_file_paths, 1), 0) = 0 or exists (
    select 1 from unnest(new.license_file_paths) p
    where not public.instructor_document_exists(new.profile_id, p)
  ) then
    v_missing := v_missing || '자격증 서류'::text;
  end if;
  if new.business_type is null or new.business_type not in ('individual', 'corporation')
     or not public.instructor_document_exists(new.profile_id, new.business_license_path) then
    v_missing := v_missing || '사업자등록증'::text;
  end if;
  if not new.pledge_signed then
    v_missing := v_missing || '전자 서약'::text;
  end if;
  if new.bank_verified_at is null then
    v_missing := v_missing || '계좌 대조 확인'::text;
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception '승인할 수 없습니다. 부족한 항목: %', array_to_string(v_missing, ', ');
  end if;
  return new;
end;
$$;

drop trigger if exists require_documents_for_instructor_approval_trg on public.instructors;
create trigger require_documents_for_instructor_approval_trg
before update of verified_status on public.instructors
for each row
when (new.verified_status and not old.verified_status)
execute function public.require_documents_for_instructor_approval();

-- 대조한 뒤 계좌를 바꾸면 확인을 무효로 한다. 안 그러면 확인과 승인 사이에 계좌를 바꿔치기할 수 있다.
create or replace function public.clear_bank_verification_on_account_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update public.instructors
  set bank_verified_at = null, bank_verified_by = null
  where profile_id = new.id::text and bank_verified_at is not null;
  return new;
end;
$$;

drop trigger if exists clear_bank_verification_on_account_change_trg on public.profiles;
create trigger clear_bank_verification_on_account_change_trg
after update of bank_name, account_holder, account_number, bankbook_path on public.profiles
for each row
when (new.bank_name is distinct from old.bank_name
   or new.account_holder is distinct from old.account_holder
   or new.account_number is distinct from old.account_number
   or new.bankbook_path is distinct from old.bankbook_path)
execute function public.clear_bank_verification_on_account_change();

-- 계좌 확인 값은 관리자만 쓴다. 신청자는 재신청할 때 지우는 것만 할 수 있다.
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
    new.bank_verified_at := null;
    new.bank_verified_by := null;
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
     or (new.rejection_reason is distinct from old.rejection_reason and new.rejection_reason is not null)
     or (new.bank_verified_at is distinct from old.bank_verified_at and new.bank_verified_at is not null)
     or (new.bank_verified_by is distinct from old.bank_verified_by and new.bank_verified_by is not null) then
    raise exception 'instructor approval fields can only be changed by an admin';
  end if;

  return new;
end;
$$;

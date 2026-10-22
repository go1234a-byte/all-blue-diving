-- 사업자등록증을 내지 않은 강사는 신규 투어 등록 불가. 화면(TourCreateForm)에서만 막던 것을
-- DB에서도 막는다. 인증(관리자 승인) 여부도 예전엔 화면에서만 검사했으므로 같이 넣는다.
--
-- 등록증 경로(business_license_path)는 강사 본인이 instructors 행을 수정해 아무 값이나 넣을 수
-- 있으므로, 실제 파일이 instructor-documents 버킷의 본인 폴더에 있는지까지 확인한다.
-- 이미 열린 투어의 예약·정산은 막지 않는다(진행 중인 다이버 예약 보호).

create or replace function public.enforce_tour_creation_quota()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_active_count integer;
  v_same_month_count integer;
  v_instructor public.instructors%rowtype;
begin
  -- 관리자는 이 쿼터의 대상이 아니다(예: 운영 목적 대리 등록). 강사 본인 생성만 제한한다.
  if public.is_admin() then
    return new;
  end if;

  select * into v_instructor from public.instructors where id = new.instructor_id;

  if not coalesce(v_instructor.verified_status, false) then
    raise exception '관리자 승인 후 투어를 등록할 수 있습니다.';
  end if;

  if v_instructor.business_type is null
     or v_instructor.business_type not in ('individual', 'corporation')
     or not exists (
       select 1 from storage.objects o
       where o.bucket_id = 'instructor-documents'
         and o.name = v_instructor.business_license_path
         and (storage.foldername(o.name))[1] = v_instructor.profile_id
     ) then
    raise exception '사업자등록증 제출 후 투어를 등록할 수 있습니다.';
  end if;

  select count(*) into v_active_count
  from public.tours
  where instructor_id = new.instructor_id and status <> 'closed';

  if v_active_count >= 3 then
    raise exception '강사 1인당 투어는 최대 3개까지 생성할 수 있습니다.';
  end if;

  select count(*) into v_same_month_count
  from public.tours
  where instructor_id = new.instructor_id
    and status <> 'closed'
    and date_trunc('month', start_date) = date_trunc('month', new.start_date);

  if v_same_month_count > 0 then
    raise exception '같은 출발월에 이미 등록된 투어가 있습니다. 투어는 같은 달에 1개까지만 등록할 수 있습니다.';
  end if;

  return new;
end;
$function$;

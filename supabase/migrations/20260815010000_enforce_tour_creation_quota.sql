-- "강사 1인당 투어 최대 3개, 같은 출발월엔 1개"라는 규칙이 TourCreateForm.tsx의
-- 클라이언트 검증(JS)에만 있고 서버에는 전혀 없었다. devtools/직접 API 호출로 폼을
-- 거치지 않고 supabase.from("tours").insert()를 부르면 무제한으로 투어를 만들 수
-- 있었다(실제 재현: 같은 계정으로 5개월에 걸쳐 5개 투어 생성 시도 -> 전부 통과 확인).
-- 이 세션에서 여러 번 고친 것과 같은 유형(클라이언트 전용 검증)의 구멍이라 트리거로 막는다.
create or replace function public.enforce_tour_creation_quota()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_active_count integer;
  v_same_month_count integer;
begin
  -- 관리자는 이 쿼터의 대상이 아니다(예: 운영 목적 대리 등록). 강사 본인 생성만 제한한다.
  if public.is_admin() then
    return new;
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
$$;

create trigger enforce_tour_creation_quota_trg
before insert on public.tours
for each row execute function public.enforce_tour_creation_quota();

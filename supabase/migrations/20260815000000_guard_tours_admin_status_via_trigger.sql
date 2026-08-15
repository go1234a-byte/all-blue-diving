-- tours_update_own_or_admin RLS 정책은 "본인 투어인지"만 확인하고 admin_status 값
-- 자체엔 제약이 없었다. profiles.role/status와 같은 유형의 구멍 — 강사가 devtools로
-- 자기 투어 UPDATE를 직접 호출해 admin_status를 null로 지워서, 관리자가 정지시킨
-- 투어를 본인이 직접 재개시킬 수 있었다(실제 재현 확인). admin_status는 관리자만
-- 쓸 수 있는 필드로 트리거로 잠근다(REVOKE는 이 플랫폼에서 안 먹는 걸 이미 확인함).
create or replace function public.guard_tours_admin_status()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if new.admin_status is distinct from old.admin_status and not public.is_admin() then
    raise exception 'admin_status can only be changed by an admin';
  end if;
  return new;
end;
$$;

create trigger guard_tours_admin_status_trg
before update on public.tours
for each row execute function public.guard_tours_admin_status();

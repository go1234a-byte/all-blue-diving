-- get_buddy_stats가 dive_logs.max_depth_m/duration_sec(둘 다 numeric 계열)을 double precision으로
-- 선언해서 "structure of query does not match function result type"로 실패하던 것을 수정.
-- 실제 컬럼 타입에 맞춰 numeric으로 바꾼다. (실기 테스트로 발견 — 2026-10-15)
-- OUT 파라미터 타입이 바뀌는 경우 create or replace가 거부되므로 drop 후 재생성.
drop function if exists public.get_buddy_stats(uuid);

create or replace function public.get_buddy_stats(p_target uuid)
returns table (
  dive_count bigint,
  max_depth_m numeric,
  total_bottom_min numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.buddy_links
    where status = 'accepted'
      and ((requester_id = auth.uid() and buddy_id = p_target)
        or (requester_id = p_target and buddy_id = auth.uid()))
  ) then
    raise exception 'NOT_BUDDIES';
  end if;

  return query
    select
      count(*)::bigint,
      coalesce(max(dl.max_depth_m), 0),
      coalesce(sum(dl.duration_sec) / 60.0, 0)
    from public.dive_logs dl
    where dl.user_id = p_target;
end;
$$;

grant execute on function public.get_buddy_stats(uuid) to authenticated;

-- 다이브 컴퓨터 컴패니언: 버디 공유·통계 비교. 이메일로 버디를 요청하고, 서로 수락하면 기본
-- 통계(다이빙 횟수·최대 수심·총 바닥 시간)만 비교해 볼 수 있다. auth.users.email은 클라이언트에
-- 직접 노출하지 않고, security definer 함수 안에서만 조회한다(이메일 전체 조회/열거 방지).

create table public.buddy_links (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  buddy_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (requester_id, buddy_id),
  check (requester_id <> buddy_id)
);

alter table public.buddy_links enable row level security;

-- 읽기·삭제는 당사자 둘만. 쓰기(요청·수락)는 전부 아래 security definer 함수를 통해서만 —
-- 이메일 조회와 "이미 버디인지" 같은 검증을 클라이언트가 직접 못 하게 하기 위함.
create policy "buddy_links_select_own" on public.buddy_links
  for select using (auth.uid() = requester_id or auth.uid() = buddy_id);

create policy "buddy_links_delete_own" on public.buddy_links
  for delete using (auth.uid() = requester_id or auth.uid() = buddy_id);

-- 이메일로 버디 요청. 이미 같은 방향 요청이 있으면 그 요청의 id를 그대로 돌려준다(중복 생성 방지).
create or replace function public.request_buddy(p_buddy_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  new_id uuid;
begin
  select id into target_id from auth.users where lower(email) = lower(trim(p_buddy_email));
  if target_id is null then
    raise exception 'NO_SUCH_ACCOUNT';
  end if;
  if target_id = auth.uid() then
    raise exception 'CANNOT_ADD_SELF';
  end if;

  insert into public.buddy_links (requester_id, buddy_id, status)
    values (auth.uid(), target_id, 'pending')
    on conflict (requester_id, buddy_id) do nothing
    returning id into new_id;

  if new_id is null then
    select id into new_id from public.buddy_links
      where requester_id = auth.uid() and buddy_id = target_id;
  end if;
  return new_id;
end;
$$;

grant execute on function public.request_buddy(text) to authenticated;

-- 받은 요청을 수락 — buddy_id 본인만, pending 상태에서만 가능.
create or replace function public.accept_buddy_request(p_link_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.buddy_links
    set status = 'accepted'
    where id = p_link_id and buddy_id = auth.uid() and status = 'pending';
  return found;
end;
$$;

grant execute on function public.accept_buddy_request(uuid) to authenticated;

-- 내 버디 목록(양방향) — 상대방의 이메일·이름을 여기서만 안전하게 덧붙여 돌려준다. 이미 나와
-- buddy_links 행으로 엮여 있는 상대만 보이므로, 임의 이메일 조회(enumeration) 경로가 아니다.
create or replace function public.my_buddy_links()
returns table (
  id uuid,
  other_user_id uuid,
  other_email text,
  other_name text,
  status text,
  am_requester boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    bl.id,
    case when bl.requester_id = auth.uid() then bl.buddy_id else bl.requester_id end as other_user_id,
    u.email,
    p.name,
    bl.status,
    bl.requester_id = auth.uid() as am_requester,
    bl.created_at
  from public.buddy_links bl
  join auth.users u
    on u.id = case when bl.requester_id = auth.uid() then bl.buddy_id else bl.requester_id end
  left join public.profiles p on p.id = u.id
  where bl.requester_id = auth.uid() or bl.buddy_id = auth.uid()
  order by bl.created_at desc;
$$;

grant execute on function public.my_buddy_links() to authenticated;

-- 수락된 버디끼리만: 다이빙 횟수·최대 수심·총 바닥 시간(분) 집계. 원본 dive_logs 행은 절대
-- 돌려주지 않는다 — 집계값만.
create or replace function public.get_buddy_stats(p_target uuid)
returns table (
  dive_count bigint,
  max_depth_m double precision,
  total_bottom_min double precision
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

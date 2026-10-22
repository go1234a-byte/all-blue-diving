-- 버디 요청으로 가입 여부를 알아낼 수 있던 문제(계정 열거) 수정.
--
-- 예전엔 request_buddy가 없는 메일에 NO_SUCH_ACCOUNT를 돌려줬고, 있는 메일이면 my_buddy_links에
-- 대기 요청과 상대 이름까지 떠서 "이 메일이 가입돼 있는가"를 확인할 수 있었다.
-- 이제 요청은 메일 주소로 거는 초대다: 계정이 있든 없든 똑같이 저장·응답하고, 상대 계정은
-- 받는 사람이 수락하는 순간에만 연결한다. 수락 전 보낸 요청에는 내가 입력한 메일만 보인다.
-- 적용 시점 buddy_links 0건 — 백필 불필요.

alter table public.buddy_links add column buddy_email text;
update public.buddy_links bl set buddy_email = lower(u.email) from auth.users u where u.id = bl.buddy_id;
alter table public.buddy_links alter column buddy_email set not null;
alter table public.buddy_links alter column buddy_id drop not null;
alter table public.buddy_links drop constraint buddy_links_requester_id_buddy_id_key;
alter table public.buddy_links add constraint buddy_links_requester_email_key unique (requester_id, buddy_email);

-- 받는 사람 = buddy_id가 나이거나, 아직 연결 전이고 내 메일로 온 초대.
drop policy "buddy_links_select_own" on public.buddy_links;
create policy "buddy_links_select_own" on public.buddy_links
  for select using (
    auth.uid() = requester_id or auth.uid() = buddy_id
    or (buddy_id is null and buddy_email = lower(auth.jwt() ->> 'email'))
  );

drop policy "buddy_links_delete_own" on public.buddy_links;
create policy "buddy_links_delete_own" on public.buddy_links
  for delete using (
    auth.uid() = requester_id or auth.uid() = buddy_id
    or (buddy_id is null and buddy_email = lower(auth.jwt() ->> 'email'))
  );

-- 계정 조회 없이 초대만 남긴다. 자기 자신 검사는 내 메일과만 비교하므로 남의 가입 여부를 드러내지 않는다.
create or replace function public.request_buddy(p_buddy_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text := lower(trim(p_buddy_email));
  my_email text;
  new_id uuid;
begin
  select lower(email) into my_email from auth.users where id = auth.uid();
  if target_email = my_email then
    raise exception 'CANNOT_ADD_SELF';
  end if;

  insert into public.buddy_links (requester_id, buddy_email, status)
    values (auth.uid(), target_email, 'pending')
    on conflict (requester_id, buddy_email) do nothing
    returning id into new_id;

  if new_id is null then
    select id into new_id from public.buddy_links
      where requester_id = auth.uid() and buddy_email = target_email;
  end if;
  return new_id;
end;
$$;

-- 수락할 때 비로소 내 계정을 연결한다.
create or replace function public.accept_buddy_request(p_link_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  my_email text;
begin
  select lower(email) into my_email from auth.users where id = auth.uid();
  update public.buddy_links
    set status = 'accepted', buddy_id = auth.uid()
    where id = p_link_id and status = 'pending' and requester_id <> auth.uid()
      and (buddy_id = auth.uid() or (buddy_id is null and buddy_email = my_email));
  return found;
end;
$$;

-- 반환 형식은 그대로(배포된 앱 호환). 수락 전 보낸 요청은 other_user_id 자리에 요청 id를 넣고
-- (앱은 수락된 버디에만 통계 조회에 쓴다), 메일은 내가 입력한 값, 이름은 null.
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
  with me as (select lower(email) as email from auth.users where id = auth.uid())
  select
    bl.id,
    case
      when bl.requester_id <> auth.uid() then bl.requester_id
      when bl.status = 'accepted' then bl.buddy_id
      else bl.id
    end,
    case
      when bl.requester_id <> auth.uid() then ru.email
      else bl.buddy_email
    end,
    case
      when bl.requester_id <> auth.uid() then rp.name
      when bl.status = 'accepted' then bp.name
    end,
    bl.status,
    bl.requester_id = auth.uid(),
    bl.created_at
  from public.buddy_links bl
  cross join me
  left join auth.users ru on ru.id = bl.requester_id
  left join public.profiles rp on rp.id = bl.requester_id
  left join public.profiles bp on bp.id = bl.buddy_id
  where bl.requester_id = auth.uid()
     or bl.buddy_id = auth.uid()
     or (bl.buddy_id is null and bl.buddy_email = me.email)
  order by bl.created_at desc;
$$;

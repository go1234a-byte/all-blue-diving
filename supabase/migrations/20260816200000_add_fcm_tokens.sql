-- 네이티브(안드로이드 Capacitor 앱) 푸시 토큰 저장용 테이블.
-- 기존 push_subscriptions는 웹 Push API 구독(endpoint/p256dh/auth) 전용 스키마라 FCM
-- 토큰(단순 문자열)을 억지로 끼워 넣기보다 별도 테이블로 분리한다. send-push Edge
-- Function은 profile_id 기준으로 이 테이블과 push_subscriptions를 모두 조회해 있는
-- 쪽으로 발송한다.
create table public.fcm_tokens (
  id uuid default gen_random_uuid() not null,
  profile_id uuid not null,
  token text not null,
  platform text not null default 'android',
  created_at timestamp with time zone default now() not null
);

alter table public.fcm_tokens add constraint fcm_tokens_pkey primary key (id);
alter table public.fcm_tokens add constraint fcm_tokens_token_key unique (token);
alter table public.fcm_tokens add constraint fcm_tokens_profile_id_fkey foreign key (profile_id) references public.profiles(id) on delete cascade;

alter table public.fcm_tokens enable row level security;

create policy fcm_tokens_select_own on public.fcm_tokens for select using (auth.uid() = profile_id);
create policy fcm_tokens_insert_own on public.fcm_tokens for insert with check (auth.uid() = profile_id);
create policy fcm_tokens_update_own on public.fcm_tokens for update using (auth.uid() = profile_id);
create policy fcm_tokens_delete_own on public.fcm_tokens for delete using (auth.uid() = profile_id);

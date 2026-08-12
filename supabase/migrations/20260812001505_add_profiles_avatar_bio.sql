alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
comment on column public.profiles.avatar_url is '회원(다이버 등)이 마이페이지에서 직접 등록하는 프로필 사진 공개 URL. "uploads" 공개 버킷에 저장.';
comment on column public.profiles.bio is '회원(다이버 등)이 마이페이지에서 직접 작성하는 자기소개.';

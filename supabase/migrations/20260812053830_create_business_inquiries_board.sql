-- 기업/단체(워크샵·사내 행사 등) 단체 다이빙 투어 전용 문의 게시판.
-- 회원가입 안 한 기업 담당자도 남길 수 있어야 해서 로그인 여부와 무관하게 등록(insert)은
-- 누구나 가능하지만, 다른 사람이 남긴 문의 내용(연락처 등 개인정보 포함)은 볼 수 없도록
-- 조회/수정은 관리자만 가능하게 잠근다. support_tickets(로그인 필수, 회원 전용)와는
-- 별도의 게시판이다.
create table public.business_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null,
  message text not null,
  status text not null default '접수' check (status in ('접수', '답변완료')),
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.business_inquiries is '기업/단체(워크샵·사내 행사 등) 단체 다이빙 투어 문의 게시판. 비회원도 접수 가능하지만 조회/답변은 관리자 전용.';

alter table public.business_inquiries enable row level security;

create policy "business_inquiries_public_insert" on public.business_inquiries
  for insert with check (true);

create policy "business_inquiries_select_admin" on public.business_inquiries
  for select using (public.is_admin());

create policy "business_inquiries_update_admin" on public.business_inquiries
  for update using (public.is_admin()) with check (public.is_admin());

create index business_inquiries_created_at_idx on public.business_inquiries (created_at desc);

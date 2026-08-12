-- 기업/단체 문의 게시판을 비회원 접수 가능(공개)에서 회원(다이버)/강사 전용으로 되돌린다.
-- 관리자도 로그인 상태이므로 자연스럽게 포함된다.
drop policy if exists "business_inquiries_public_insert" on public.business_inquiries;

create policy "business_inquiries_insert_authenticated" on public.business_inquiries
  for insert with check (auth.uid() is not null);

comment on table public.business_inquiries is '기업/단체(워크샵·사내 행사 등) 단체 다이빙 투어 문의 게시판. 로그인한 다이버/강사(관리자 포함)만 접수 가능, 조회/답변은 관리자 전용.';

-- 신분증/통장사본/자격증처럼 민감한 개인정보 서류는 기존 공개(public) "uploads" 버킷에
-- 넣으면 URL만 알면 누구나 열람 가능해 위험하다. 본인 또는 관리자만 열람 가능한
-- 비공개 버킷을 새로 만든다.
insert into storage.buckets (id, name, public)
values ('instructor-documents', 'instructor-documents', false)
on conflict (id) do nothing;

-- 업로드: 로그인한 사용자는 자기 uid로 시작하는 경로에만 업로드 가능
create policy "instructor_documents_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'instructor-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 조회: 본인 소유 경로이거나 관리자만 (서명된 URL 발급도 이 정책을 통과해야 함)
create policy "instructor_documents_select_own_or_admin"
on storage.objects for select
to authenticated
using (
  bucket_id = 'instructor-documents'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

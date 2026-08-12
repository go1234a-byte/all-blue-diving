-- 신분증 사본 / 통장 사본의 실제 파일 저장 경로 (기존 bankbook_file_name은 파일명 표시용으로 유지)
alter table public.profiles
  add column if not exists id_document_path text,
  add column if not exists bankbook_path text;

-- 강사 자격증 서류의 실제 파일 저장 경로들 (기존 license_file_names는 파일명 표시용으로 유지)
alter table public.instructors
  add column if not exists license_file_paths text[];

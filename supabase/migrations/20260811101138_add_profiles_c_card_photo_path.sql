-- 다이버가 자격증(C-Card) 사진을 실제로 업로드해 관리자가 확인할 수 있게 한다.
-- 기존에 c_card_agency/c_card_number는 텍스트 입력만 있고 실제 사진 파일은 저장되지 않아
-- 관리자가 진위를 확인할 방법이 전혀 없었다. id_document_path/bankbook_path와 동일하게
-- 비공개 "instructor-documents" 버킷(경로는 업로더 본인 auth uid로 시작 — 이름과 달리
-- 버킷 RLS는 역할 구분 없이 "본인 소유 경로 또는 관리자"만 허용하는 범용 정책이라 그대로
-- 재사용 가능)에 저장하고, 저장 경로만 이 컬럼에 남긴다.
alter table public.profiles
  add column if not exists c_card_photo_path text;

comment on column public.profiles.c_card_photo_path is '다이버 자격증(C-Card) 사진 실제 저장 경로 (instructor-documents 비공개 버킷, 서명된 URL 발급용). 컬럼명과 달리 다이버/강사 공용 버킷이다.';

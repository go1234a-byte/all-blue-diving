-- ALL BLUE — 강사 가입 시 사업자등록증 제출. 추가만(기존 객체 변경·삭제 없음). 미적용·미검증 상태로 작성됨.
--
-- 강사 유형에서 "프리랜서(사업자등록 없음)"를 없애고 개인/법인사업자만 받기로 하면서,
-- 사업자 유형을 신고할 때 실제 사업자등록증 사본을 함께 제출받는다. license_file_paths(자격증)와
-- 같은 방식 — 실제 파일은 instructor-documents 비공개 버킷에 올리고, 여기엔 저장 경로만 남는다.

alter table public.instructors add column if not exists business_license_file_name text;
alter table public.instructors add column if not exists business_license_path text;

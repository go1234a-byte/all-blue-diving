alter table public.instructors
  add column if not exists documents_pending_review boolean not null default false;

comment on column public.instructors.documents_pending_review is
  '강사가 마이페이지에서 신분증/자격증/통장사본 등 제출 서류를 수정(재제출)했지만 관리자가 아직 재확인하지 않은 상태인지 여부. true면 관리자 강사 승인 큐에 다시 노출되고 승인 버튼이 "수정요청"으로 표시된다.';

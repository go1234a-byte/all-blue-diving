-- 관리자 ↔ 강사 전용 비공개 안내(서류 보완 요청, 반려 사유 등) 메모 스레드.
-- 기존 arbitration_messages(비밀 중재방)와는 별개 — 이의신청/분쟁 조정이 아니라
-- 관리자가 강사에게 서류 보완, 반려 사유 등 일반 안내를 남기는 용도이며,
-- 승인 여부와 무관하게 모든 강사에게 사용 가능하다.
create table public.instructor_admin_notes (
  id uuid primary key default gen_random_uuid(),
  instructor_id text not null references public.instructors(id) on delete cascade,
  sender_role text not null check (sender_role in ('admin', 'instructor')),
  sender_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

comment on table public.instructor_admin_notes is '관리자-강사 전용 비공개 안내 메모(서류 보완 요청/반려 사유 등). 관리자와 해당 강사 본인만 열람 가능.';

alter table public.instructor_admin_notes enable row level security;

create policy instructor_admin_notes_select on public.instructor_admin_notes
  for select using (is_admin() OR owns_instructor(instructor_id));

create policy instructor_admin_notes_insert on public.instructor_admin_notes
  for insert with check (is_admin() OR (owns_instructor(instructor_id) AND sender_role = 'instructor'));

create index instructor_admin_notes_instructor_id_idx on public.instructor_admin_notes (instructor_id, created_at);

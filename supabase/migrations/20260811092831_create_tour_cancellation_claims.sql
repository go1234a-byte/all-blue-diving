-- 강사가 본인 귀책이 아닌 사유(예: 샵 중복예약)로 확정된 투어를 취소하면서 증빙(카톡 예약확인 등)을
-- 함께 제출하는 건. 취소 시점에 확정 예약은 전액환불되고 관련 정산은 일반 취소와 동일하게
-- payouts.status='cancelled'로 처리되지만, 관리자가 증빙을 검토해 승인하면 1차 정산(80%)만
-- 되살려 다시 지급 대상으로 되돌린다(2차 정산 20%는 투어가 실제 진행되지 않았으므로 0원 처리).
create table public.tour_cancellation_claims (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  instructor_id text not null references public.instructors(id) on delete cascade,
  reason text not null,
  evidence_file_urls text[] not null default '{}',
  affected_booking_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.tour_cancellation_claims is '강사 귀책이 아닌 사유로 확정 투어를 취소하며 증빙을 제출하는 건. 관리자 승인 시 1차 정산(80%)만 되살아나고 2차 정산(20%)은 0원 처리된다.';

alter table public.tour_cancellation_claims enable row level security;

create policy tour_cancellation_claims_select on public.tour_cancellation_claims
  for select using (is_admin() OR owns_instructor(instructor_id));

create policy tour_cancellation_claims_insert on public.tour_cancellation_claims
  for insert with check (owns_instructor(instructor_id));

create policy tour_cancellation_claims_update on public.tour_cancellation_claims
  for update using (is_admin()) with check (is_admin());

create index tour_cancellation_claims_tour_id_idx on public.tour_cancellation_claims (tour_id);
create index tour_cancellation_claims_instructor_id_idx on public.tour_cancellation_claims (instructor_id, created_at);

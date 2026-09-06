-- 투어 그룹채팅 내 "정산 가계부 + 계산기"
-- tour_settlements: 한 투어당 1행 (강사만 편집). entries = 일자별 지출/인원.
-- tour_settlement_confirmations: 예약 다이버별 "정산 확인" 기록.

create table public.tour_settlements (
  tour_id uuid primary key references public.tours(id) on delete cascade,
  entries jsonb not null default '[]'::jsonb, -- [{dayNumber:int, headcount:int, expenses:[{label:text, amount:numeric}]}]
  instructor_settled_at timestamptz,          -- 강사가 "정산 완료" 누른 시점 (설정되면 편집 잠금)
  updated_at timestamptz not null default now()
);
alter table public.tour_settlements enable row level security;

create table public.tour_settlement_confirmations (
  tour_id uuid not null references public.tours(id) on delete cascade,
  diver_id uuid not null references public.profiles(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (tour_id, diver_id)
);
alter table public.tour_settlement_confirmations enable row level security;

-- SELECT: 담당 강사 / 관리자 / 그 투어 예약 다이버
create policy "tour_settlements_select" on public.tour_settlements for select using (
  public.owns_tour(tour_id) or public.is_admin()
  or exists (select 1 from public.bookings b where b.tour_id = tour_settlements.tour_id and b.diver_id = auth.uid()::text)
);
-- INSERT/UPDATE/DELETE: 담당 강사 / 관리자만
create policy "tour_settlements_write" on public.tour_settlements for all
  using (public.owns_tour(tour_id) or public.is_admin())
  with check (public.owns_tour(tour_id) or public.is_admin());

create policy "tsc_select" on public.tour_settlement_confirmations for select using (
  public.owns_tour(tour_id) or public.is_admin()
  or exists (select 1 from public.bookings b where b.tour_id = tour_settlement_confirmations.tour_id and b.diver_id = auth.uid()::text)
);
create policy "tsc_insert_own" on public.tour_settlement_confirmations for insert with check (
  diver_id = auth.uid()
  and exists (
    select 1 from public.bookings b
    where b.tour_id = tour_settlement_confirmations.tour_id
      and b.diver_id = auth.uid()::text
      and b.status <> 'cancelled'
  )
);
create policy "tsc_delete_own" on public.tour_settlement_confirmations for delete using (diver_id = auth.uid());

alter publication supabase_realtime add table public.tour_settlements;
alter publication supabase_realtime add table public.tour_settlement_confirmations;

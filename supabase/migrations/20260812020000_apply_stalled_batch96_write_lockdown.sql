-- 2026-08-03 batch96("RLS 쓰기 권한 잠금")이 기록만 되고 실제로는 반영되지 않았던 부분을
-- 뒤늦게 적용한다. 헬퍼 함수(is_admin/owns_instructor/owns_tour/owns_booking/owns_booking_tour)는
-- 이미 라이브에 있으므로 정책 교체만 진행한다. payouts는 별도 마이그레이션으로 이미
-- RPC 전용으로 더 강하게 잠갔으므로 여기서 건드리지 않는다.

-- tours
drop policy if exists "tours_public_insert" on public.tours;
drop policy if exists "tours_public_update" on public.tours;
create policy "tours_insert_own" on public.tours
  for insert with check (public.owns_instructor(instructor_id));
create policy "tours_update_own_or_admin" on public.tours
  for update using (public.owns_instructor(instructor_id) or public.is_admin())
  with check (public.owns_instructor(instructor_id) or public.is_admin());
create policy "tours_delete_admin" on public.tours
  for delete using (public.is_admin());

-- bookings
drop policy if exists "bookings_public_insert" on public.bookings;
drop policy if exists "bookings_public_update" on public.bookings;
create policy "bookings_insert_own" on public.bookings
  for insert with check (diver_id = auth.uid()::text);
create policy "bookings_update_own_or_tour_owner_or_admin" on public.bookings
  for update using (
    diver_id = auth.uid()::text or public.owns_tour(tour_id) or public.is_admin()
  )
  with check (
    diver_id = auth.uid()::text or public.owns_tour(tour_id) or public.is_admin()
  );

-- reviews
drop policy if exists "reviews_public_insert" on public.reviews;
drop policy if exists "reviews_public_update" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (diver_id = auth.uid()::text);
create policy "reviews_update_own_or_instructor_or_admin" on public.reviews
  for update using (
    diver_id = auth.uid()::text
    or (instructor_id is not null and public.owns_instructor(instructor_id))
    or public.is_admin()
  )
  with check (
    diver_id = auth.uid()::text
    or (instructor_id is not null and public.owns_instructor(instructor_id))
    or public.is_admin()
  );

-- reports
drop policy if exists "reports_public_insert" on public.reports;
drop policy if exists "reports_public_update" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() is not null);
create policy "reports_update_admin" on public.reports
  for update using (public.is_admin()) with check (public.is_admin());

-- inquiries
drop policy if exists "inquiries_public_insert" on public.inquiries;
drop policy if exists "inquiries_public_update" on public.inquiries;
create policy "inquiries_insert_own" on public.inquiries
  for insert with check (diver_id = auth.uid()::text);
create policy "inquiries_update_admin" on public.inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- coupons
drop policy if exists "coupons_insert_all" on public.coupons;
drop policy if exists "coupons_update_all" on public.coupons;
drop policy if exists "coupons_delete_all" on public.coupons;
create policy "coupons_insert_admin" on public.coupons
  for insert with check (public.is_admin());
create policy "coupons_update_admin" on public.coupons
  for update using (public.is_admin()) with check (public.is_admin());
create policy "coupons_delete_admin" on public.coupons
  for delete using (public.is_admin());

-- instructors
drop policy if exists "instructors_public_insert" on public.instructors;
drop policy if exists "instructors_public_update" on public.instructors;
create policy "instructors_insert_own" on public.instructors
  for insert with check (profile_id = auth.uid()::text);
create policy "instructors_update_own_or_admin" on public.instructors
  for update using (profile_id = auth.uid()::text or public.is_admin())
  with check (profile_id = auth.uid()::text or public.is_admin());

-- centers
drop policy if exists "centers_public_insert" on public.centers;
drop policy if exists "centers_public_update" on public.centers;
create policy "centers_insert_instructor_or_admin" on public.centers
  for insert with check (
    public.is_admin()
    or exists(select 1 from public.profiles where id = auth.uid() and role = 'instructor')
  );
create policy "centers_update_admin" on public.centers
  for update using (public.is_admin()) with check (public.is_admin());
create policy "centers_delete_admin" on public.centers
  for delete using (public.is_admin());

-- support_tickets
drop policy if exists "support_tickets_public_insert" on public.support_tickets;
drop policy if exists "support_tickets_public_update" on public.support_tickets;
create policy "support_tickets_insert_authenticated" on public.support_tickets
  for insert with check (auth.uid() is not null);
create policy "support_tickets_update_admin" on public.support_tickets
  for update using (public.is_admin()) with check (public.is_admin());

-- penalties_log (insert만 — update는 이미 별도 드리프트로 admin 전용 정책이 라이브에 존재)
drop policy if exists "penalties_log_public_insert" on public.penalties_log;
create policy "penalties_log_insert_admin" on public.penalties_log
  for insert with check (public.is_admin());

-- chat_messages (insert만 — select는 이미 batch99에서 잠김)
drop policy if exists "chat_messages_public_insert" on public.chat_messages;
create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    sender_profile_id = auth.uid()::text
    and (
      public.owns_tour(tour_id)
      or exists(select 1 from public.bookings where tour_id = chat_messages.tour_id and diver_id = auth.uid()::text)
      or public.is_admin()
    )
  );

-- qa_checklist_results (관리자 전용 내부 도구 — select까지 포함해서 잠금)
drop policy if exists "qa_checklist_results_public_select" on public.qa_checklist_results;
drop policy if exists "qa_checklist_results_public_upsert" on public.qa_checklist_results;
drop policy if exists "qa_checklist_results_public_update" on public.qa_checklist_results;
create policy "qa_checklist_results_admin_select" on public.qa_checklist_results
  for select using (public.is_admin());
create policy "qa_checklist_results_admin_insert" on public.qa_checklist_results
  for insert with check (public.is_admin());
create policy "qa_checklist_results_admin_update" on public.qa_checklist_results
  for update using (public.is_admin()) with check (public.is_admin());

-- deleted_accounts (이메일/전화번호 민감정보 — select까지 포함해서 잠금)
drop policy if exists "deleted_accounts_service_only_select" on public.deleted_accounts;
drop policy if exists "deleted_accounts_service_only_insert" on public.deleted_accounts;
create policy "deleted_accounts_admin_select" on public.deleted_accounts
  for select using (public.is_admin());
create policy "deleted_accounts_insert_self_or_admin" on public.deleted_accounts
  for insert with check (original_user_id = auth.uid() or public.is_admin());

-- 채팅/리뷰/문의/신고 쪽에서 발견한 같은 유형의 구멍들을 한 번에 막는다: RLS가 "본인 소유
-- row인지"만 확인하고 실제 값(누구를 사칭하는지, 진짜 내 예약이 맞는지, 상태를 뭘로
-- 시작하는지)은 검증하지 않던 곳들.

-- ════════════════════════════════════════════════════════════════
-- 1) reviews — 예약하지도 않은 투어에 가짜 후기(평점 조작), 후기당 예약 1개 강제,
--    강사가 다이버의 원본 후기 내용을 고쳐쓰거나 몰래 숨기는(deleted) 것 방지
-- ════════════════════════════════════════════════════════════════
-- not valid: 기존 행은 검증하지 않고(혹시 있을 레거시 데이터로 인한 마이그레이션 실패 방지),
-- 앞으로의 insert/update부터만 강제한다.
alter table public.reviews add constraint reviews_rating_check check (rating >= 1 and rating <= 5) not valid;

-- 예약 1건당 후기 1개만 허용(기존 legacy로 booking_id가 null인 행은 예외로 둔다).
create unique index if not exists reviews_one_per_booking
  on public.reviews (booking_id)
  where booking_id is not null;

drop policy if exists "reviews_insert_own" on public.reviews;
create policy "reviews_insert_own" on public.reviews
  for insert with check (
    diver_id = auth.uid()::text
    and booking_id is not null
    and exists (
      select 1 from public.bookings b
      where b.id = reviews.booking_id
        and b.diver_id = auth.uid()::text
        and b.tour_id = reviews.tour_id
    )
    and instructor_id is not distinct from (select instructor_id from public.tours where id = reviews.tour_id)
  );

create or replace function public.guard_reviews_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.instructor_id is not null and public.owns_instructor(old.instructor_id) then
    -- 강사는 본인 답글(instructor_reply/instructor_reply_at) 외에는 아무것도 못 바꾼다 —
    -- 다이버가 남긴 평점/코멘트를 고쳐쓰거나 deleted로 몰래 숨기는 걸 막는다.
    if new.rating is distinct from old.rating
      or new.title is distinct from old.title
      or new.comment is distinct from old.comment
      or new.category_ratings is distinct from old.category_ratings
      or new.photos is distinct from old.photos
      or new.video_url is distinct from old.video_url
      or new.deleted is distinct from old.deleted
      or new.reported is distinct from old.reported
      or new.diver_id is distinct from old.diver_id
      or new.booking_id is distinct from old.booking_id
      or new.tour_id is distinct from old.tour_id
      or new.instructor_id is distinct from old.instructor_id
    then
      raise exception 'instructors may only edit instructor_reply/instructor_reply_at';
    end if;
    return new;
  end if;

  if old.diver_id = auth.uid()::text then
    -- 본인 다이버는 자기 평가 내용은 고칠 수 있어도, 신고/삭제 등 운영 필드나 소유권
    -- 컬럼은 못 건드린다.
    if new.instructor_reply is distinct from old.instructor_reply
      or new.instructor_reply_at is distinct from old.instructor_reply_at
      or new.deleted is distinct from old.deleted
      or new.reported is distinct from old.reported
      or new.diver_id is distinct from old.diver_id
      or new.booking_id is distinct from old.booking_id
      or new.tour_id is distinct from old.tour_id
      or new.instructor_id is distinct from old.instructor_id
    then
      raise exception 'divers may not edit moderation fields';
    end if;
    return new;
  end if;

  raise exception 'not authorized to update this review';
end;
$$;

drop trigger if exists guard_reviews_columns_trg on public.reviews;
create trigger guard_reviews_columns_trg
before update on public.reviews
for each row
execute function public.guard_reviews_columns();

-- ════════════════════════════════════════════════════════════════
-- 2) chat_messages — sender_profile_id는 이미 auth.uid()로 고정돼 있었지만 sender_role은
--    검증되지 않아, 투어 채팅 참가자인 다이버가 sender_role='instructor'(또는 'admin')로
--    보내 담당 강사/운영자를 사칭할 수 있었다.
-- ════════════════════════════════════════════════════════════════
drop policy if exists "chat_messages_insert_participant" on public.chat_messages;
create policy "chat_messages_insert_participant" on public.chat_messages
  for insert with check (
    sender_profile_id = auth.uid()::text
    and sender_role = (
      case
        when public.is_admin() then 'admin'
        when public.owns_tour(tour_id) then 'instructor'
        else 'diver'
      end
    )
    and (
      public.owns_tour(tour_id)
      or exists(select 1 from public.bookings where tour_id = chat_messages.tour_id and diver_id = auth.uid()::text)
      or public.is_admin()
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 3) support_tickets — user_id가 전혀 검증되지 않아, 다른 사용자 id로 문의를 위조해서
--    상대방 "내 문의" 목록에 본인이 쓴 것처럼 보이게 할 수 있었다.
-- ════════════════════════════════════════════════════════════════
drop policy if exists "support_tickets_insert_authenticated" on public.support_tickets;
create policy "support_tickets_insert_own" on public.support_tickets
  for insert with check (
    user_id = auth.uid()::text
    and (
      booking_id is null
      or exists(select 1 from public.bookings b where b.id::text = support_tickets.booking_id and b.diver_id = auth.uid()::text)
    )
  );

-- ════════════════════════════════════════════════════════════════
-- 4) reports — status가 검증되지 않아 신고를 처음부터 'resolved' 등으로 위조해 관리자
--    처리 대기열(status='pending' 필터)에서 누락시킬 수 있었다.
-- ════════════════════════════════════════════════════════════════
drop policy if exists "reports_insert_authenticated" on public.reports;
create policy "reports_insert_authenticated" on public.reports
  for insert with check (auth.uid() is not null and status = 'pending');

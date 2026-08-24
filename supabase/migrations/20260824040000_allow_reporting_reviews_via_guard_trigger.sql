-- guard_reviews_columns()는 "본인 강사"(instructor_reply만) / "본인 다이버"(모더레이션
-- 필드 제외) 두 분기만 허용하고, 그 외에는 전부 'not authorized to update this review'로
-- 막고 있었다. 그런데 report_review() RPC(신고 기능)는 정확히 이 "그 외" — 리뷰 작성자도
-- 담당 강사도 아닌 제3자가 reported만 true로 바꾸는 것 — 을 위한 함수라서, SECURITY
-- DEFINER로 RLS 정책은 우회해도 이 트리거는 우회하지 못해 신고가 100% 실패하고 있었다.
-- 라이브로 리뷰 등록 알림을 검증하다가 발견함(신고 버튼을 눌러도 항상 에러).
-- reported를 true로 켜는 것 외에 아무 컬럼도 바뀌지 않는 경우에 한해, 로그인한 사용자
-- 누구나 통과하도록 좁게 허용한다.
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

  if auth.uid() is not null
    and new.reported = true
    and old.reported is distinct from new.reported
    and new.rating is not distinct from old.rating
    and new.title is not distinct from old.title
    and new.comment is not distinct from old.comment
    and new.category_ratings is not distinct from old.category_ratings
    and new.photos is not distinct from old.photos
    and new.video_url is not distinct from old.video_url
    and new.deleted is not distinct from old.deleted
    and new.instructor_reply is not distinct from old.instructor_reply
    and new.instructor_reply_at is not distinct from old.instructor_reply_at
    and new.diver_id is not distinct from old.diver_id
    and new.booking_id is not distinct from old.booking_id
    and new.tour_id is not distinct from old.tour_id
    and new.instructor_id is not distinct from old.instructor_id
  then
    return new;
  end if;

  if old.instructor_id is not null and public.owns_instructor(old.instructor_id) then
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

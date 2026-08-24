-- reviews.visibility 컬럼이 실제 DB에 한 번도 존재한 적이 없었다 — Review 타입/ReviewDialog
-- UI(전체공개/강사·관리자만 공개)/addReview의 INSERT는 전부 이 컬럼이 있다고 가정하고
-- 작성돼 있었지만, 이를 추가하는 마이그레이션이 애초에 없었다. 그 결과 실사용 중 후기
-- 등록을 시도하면 매번 PGRST204("Could not find the 'visibility' column")로 100% 실패하고
-- 있었다 — 라이브로 리뷰 등록 알림 기능을 검증하다가 발견함. 지금까지 등록된 후기가 0건인
-- 것도 이 버그 때문일 가능성이 높다.
alter table public.reviews
  add column visibility text not null default 'public'
  check (visibility in ('public', 'instructor_only'));

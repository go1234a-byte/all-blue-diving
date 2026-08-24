-- setInstructorVerified(verified=true)가 새로 강사 인증 승인 알림(application_approved)을
-- 발행하도록 고쳤는데, instructor_notifications.type CHECK 제약이 이 값을 몰라 insert가
-- 23514(check_violation)로 조용히 실패하고 있었다(persistInstructorNotification은 실패해도
-- throw하지 않아 관리자 화면에는 에러가 안 보임 — 라이브로 승인 버튼을 눌러보다가 발견).
alter table public.instructor_notifications drop constraint instructor_notifications_type_check;
alter table public.instructor_notifications add constraint instructor_notifications_type_check
  check (type = any (array[
    'new_booking',
    'forced_refund_penalty',
    'min_participants_cancelled',
    'min_participants_proceed',
    'min_participants_decision_needed',
    'application_rejected',
    'application_approved',
    'document_review_completed'
  ]));

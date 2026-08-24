-- addArbitrationMessage가 관리자→강사 방향으로 새 알림 타입(arbitration_message)을 발행하도록
-- 고쳤다. 지난 마이그레이션(application_approved 추가)과 같은 이유로 CHECK 제약도 같이
-- 넓혀야 실제 insert가 통과한다 — 이번엔 미리 반영해서 같은 실수를 반복하지 않는다.
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
    'document_review_completed',
    'arbitration_message'
  ]));

-- addReview가 담당 강사에게 새 후기 알림(new_review)을 발행하도록 고쳤다. 지난 두 번의
-- 알림 타입 추가와 같은 이유로 CHECK 제약도 같이 넓힌다.
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
    'arbitration_message',
    'new_review'
  ]));

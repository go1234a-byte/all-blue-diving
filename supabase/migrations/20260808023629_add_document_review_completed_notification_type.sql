alter table public.instructor_notifications drop constraint instructor_notifications_type_check;
alter table public.instructor_notifications add constraint instructor_notifications_type_check
  check (type = ANY (ARRAY[
    'new_booking'::text,
    'forced_refund_penalty'::text,
    'min_participants_cancelled'::text,
    'min_participants_proceed'::text,
    'min_participants_decision_needed'::text,
    'application_rejected'::text,
    'document_review_completed'::text
  ]));

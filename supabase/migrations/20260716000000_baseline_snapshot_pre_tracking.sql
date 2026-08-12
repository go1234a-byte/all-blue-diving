-- ALL BLUE 다이빙 플랫폼 — 마이그레이션 이력 편입 이전(2026-08-12 이전) 라이브 스키마 스냅샷.
--
-- 배경: 2026-07-16 ~ 2026-08-03 사이 작성된 supabase/migrations/_superseded_pre_20260812/
-- 의 21개 기록 파일과 저장소 루트의 fix_*.py/fix_*.sh/fix_*.sql/fix_*.patch 스크립트
-- 90여 개가 그때그때 Supabase 대시보드 SQL Editor(또는 MCP execute_sql)로 직접 실행되며
-- 스키마가 쌓여왔는데, 이 중 supabase_migrations.schema_migrations(Supabase CLI/MCP
-- apply_migration이 추적하는 정식 이력 테이블)에 등록된 것은 하나도 없었다. 완벽한 시대순
-- 재구성은 스크립트 90여 개를 전부 대조해야 해서 비현실적이라 판단해, 2026-08-12 시점의
-- 라이브 스키마를 정보 스키마(information_schema/pg_catalog)로 직접 조회해 그대로 스냅샷
-- 찍은 단일 baseline으로 대체한다. 이후 변경분(2026-08-08 ~)은 이 파일 뒤에 정상적으로
-- 개별 마이그레이션 파일로 이어진다.
--
-- 알려진 예외 1건: 이 스냅샷 시점 이후 발견된 사실이지만, _superseded_pre_20260812/
-- migration_20260803_000000004(batch96 "RLS 쓰기 권한 잠금")는 안의 헬퍼 함수만 라이브에
-- 반영되고 정책(RLS policy) 변경은 반영되지 않았다 — 그래서 아래 baseline도 tours/reviews/
-- instructors/centers/coupons/qa_checklist_results/deleted_accounts/penalties_log(insert)/
-- chat_messages(insert)를 batch96 이전(공개 `using (true)`) 상태 그대로 담는다. 이건 실제
-- 라이브 상태를 있는 그대로 반영한 것일 뿐 — PG 연동 전 별도로 반드시 처리해야 할 보안
-- 이슈로 남아있다 (자세한 내용은 _superseded_pre_20260812/README.md 참고).

-- ════════════════════════════════════════════════════════════════
-- 0) 확장(extensions)
-- ════════════════════════════════════════════════════════════════
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ════════════════════════════════════════════════════════════════
-- 1) 테이블
-- ════════════════════════════════════════════════════════════════

create table public.arbitration_messages (
  id uuid default gen_random_uuid() not null,
  room_id text not null,
  instructor_id text not null,
  sender_role text not null,
  sender_name text not null,
  body text not null,
  attachment_names text[] default '{}'::text[] not null,
  attachment_urls text[] default '{}'::text[] not null,
  created_at timestamp with time zone default now() not null
);

comment on table public.arbitration_messages is '강사↔최고관리자 비밀 중재방(이의신청/분쟁조정) 대화 기록. 수정/삭제 정책을 두지 않아
   등록된 메시지는 변경할 수 없다 — 화면에 안내된 "관련 규정에 의거한 보관"과 실제로
   일치시키기 위함.';

create table public.bookings (
  id uuid default gen_random_uuid() not null,
  tour_id uuid not null,
  diver_id text not null,
  diver_name text not null,
  base_price numeric not null,
  options_cost numeric default 0 not null,
  selected_options jsonb default '[]'::jsonb not null,
  platform_fee numeric default 0 not null,
  total_paid numeric default 0 not null,
  on_site_balance numeric default 0 not null,
  payment_method text not null,
  gender text not null,
  snoring boolean default false not null,
  smoking boolean default false not null,
  room_no text,
  deposit_status text default 'paid'::text not null,
  status text default 'confirmed'::text not null,
  cancel_reason text,
  refund_rate numeric,
  refund_amount numeric,
  cancel_requested_at timestamp with time zone,
  evidence_file_names text[],
  created_at timestamp with time zone default now() not null,
  coupon_code text,
  discount_amount integer,
  flight_info text,
  passport_info text,
  drinking boolean default false not null,
  room_note text,
  participant_count integer default 1 not null,
  companion_names text,
  companions jsonb default '[]'::jsonb not null
);

create table public.centers (
  id uuid default gen_random_uuid() not null,
  name text not null,
  country text,
  address text not null,
  google_map text,
  homepage text,
  instagram text,
  phone text,
  features text[] default '{}'::text[] not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  status text default 'pending'::text not null,
  rejection_reason text,
  reviewed_by text,
  reviewed_at timestamp with time zone
);

create table public.chat_messages (
  id uuid default gen_random_uuid() not null,
  tour_id uuid not null,
  sender_profile_id text not null,
  sender_name text not null,
  sender_role text not null,
  body text not null,
  created_at timestamp with time zone default now() not null
);

create table public.coupons (
  id uuid default gen_random_uuid() not null,
  code text not null,
  discount_type text not null,
  discount_value integer not null,
  min_purchase integer default 0 not null,
  max_discount integer,
  expires_at timestamp with time zone,
  usage_limit integer,
  used_count integer default 0 not null,
  active boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table public.deleted_accounts (
  id uuid default gen_random_uuid() not null,
  original_user_id uuid not null,
  email text,
  phone text,
  deleted_at timestamp with time zone default now() not null
);

create table public.game_players (
  uid text not null,
  nickname text default '다이버'::text not null,
  current_points integer default 0 not null,
  max_depth integer default 0 not null,
  equipped_skin text default 'default'::text not null,
  inventory text[] default '{}'::text[] not null,
  daily_points_earned integer default 0 not null,
  daily_points_date date default CURRENT_DATE not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  hearts_remaining integer default 5 not null,
  hearts_reset_date date default CURRENT_DATE not null
);

create table public.inquiries (
  id uuid default gen_random_uuid() not null,
  tour_id uuid,
  booking_id uuid,
  diver_id text not null,
  category text not null,
  message text not null,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.instructor_notifications (
  id uuid default gen_random_uuid() not null,
  instructor_id text not null,
  tour_id text default ''::text not null,
  booking_id text,
  tour_title text not null,
  diver_name text,
  selected_option_names text[],
  settlement_amount numeric,
  message text,
  type text not null,
  read boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.instructors (
  id text not null,
  profile_id text,
  name text not null,
  avatar_url text,
  agency text,
  license_file_names text[] default '{}'::text[],
  signature_data_url text,
  verified_status boolean default false not null,
  total_logs integer default 0 not null,
  experience_years integer default 0 not null,
  completion_rate numeric default 0 not null,
  rating numeric default 0 not null,
  penalty_count integer default 0 not null,
  bio text,
  created_at timestamp with time zone default now() not null,
  verified_at timestamp with time zone,
  verified_by text,
  pledge_signed boolean default false not null,
  pledge_signed_at timestamp with time zone,
  pledge_version text,
  languages text[],
  rejected_at timestamp with time zone,
  rejected_by text,
  rejection_reason text,
  business_type text,
  settlement_consents jsonb default '{}'::jsonb not null,
  level text,
  specialty_tags text[],
  teaching_philosophy text,
  favorite_diving text,
  sns_instagram text,
  sns_youtube text,
  sns_facebook text,
  sns_blog text,
  sns_homepage text,
  penalty_reason text
);

create table public.invoices (
  id text not null,
  booking_id uuid not null,
  payout_id uuid,
  gmv_amount numeric not null,
  platform_fee_amount numeric not null,
  instructor_amount numeric not null,
  refund_amount numeric default 0 not null,
  period date not null,
  issued_at timestamp with time zone default now() not null
);

comment on table public.invoices is '예약 확정 시점의 금액 스냅샷. 월별 회계 리포트와 세금계산서 대응의 근거 데이터.';

create table public.mimo_reservations (
  reservation_id uuid default gen_random_uuid() not null,
  user_id text not null,
  salon_id text not null,
  service_name text not null,
  price numeric not null,
  start_time timestamp with time zone not null,
  status text default 'pending'::text not null,
  payment_method text,
  payment_status text default 'unpaid'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.mimo_salons (
  id text not null,
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  status boolean default true not null,
  categories text[] default '{}'::text[] not null,
  photos text[] default '{}'::text[] not null,
  services jsonb default '[]'::jsonb not null,
  rating numeric default 0 not null,
  created_at timestamp with time zone default now() not null
);

create table public.mimo_users (
  uid text not null,
  name text not null,
  phone text,
  favorites text[] default '{}'::text[] not null,
  created_at timestamp with time zone default now() not null
);

create table public.notices (
  id uuid default gen_random_uuid() not null,
  title text not null,
  content text not null,
  category text default '일반'::text not null,
  pinned boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.payouts (
  id uuid default gen_random_uuid() not null,
  instructor_id text not null,
  booking_id uuid,
  first_amount numeric default 0 not null,
  second_amount numeric default 0 not null,
  status text default 'scheduled'::text not null,
  created_at timestamp with time zone default now() not null,
  scheduled_at timestamp with time zone,
  paid_at timestamp with time zone,
  refunded_at timestamp with time zone,
  withholding_tax_rate numeric default 0 not null,
  withholding_tax_amount numeric default 0 not null,
  net_payout_amount numeric,
  business_type_at_payout text
);

create table public.penalties_log (
  id uuid default gen_random_uuid() not null,
  instructor_id text not null,
  violation_type text not null,
  description text,
  created_at timestamp with time zone default now() not null,
  voided boolean default false not null
);

create table public.policies (
  id uuid default gen_random_uuid() not null,
  category text not null,
  sort_order integer default 0 not null,
  title text not null,
  description text,
  rate text,
  created_at timestamp with time zone default now() not null
);

create table public.profiles (
  id uuid not null,
  role text default 'diver'::text not null,
  name text not null,
  phone text,
  gender text,
  status text default 'active'::text not null,
  snoring boolean default false,
  smoking boolean default false,
  deleted_at timestamp with time zone,
  pledge_settlement_agreed boolean default false not null,
  pledge_settlement_agreed_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  c_card_agency text,
  c_card_number text,
  log_count integer,
  emergency_contact_name text,
  emergency_contact_phone text,
  insurance_info text,
  birth_date date,
  bank_name text,
  account_holder text,
  account_number text,
  bankbook_file_name text
);

create table public.push_subscriptions (
  id uuid default gen_random_uuid() not null,
  profile_id uuid not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone default now() not null
);

create table public.qa_checklist_results (
  item_id integer not null,
  status text default '미확인'::text not null,
  note text,
  checked_at timestamp with time zone,
  updated_at timestamp with time zone default now() not null
);

create table public.refunds (
  id uuid default gen_random_uuid() not null,
  booking_id uuid not null,
  amount numeric not null,
  reason text,
  refunded_by uuid default auth.uid(),
  created_at timestamp with time zone default now() not null
);

comment on table public.refunds is '예약별 환불 이력. bookings.refundAmount(누적값)와 별개로 개별 환불 건을 추적한다.';

create table public.reports (
  id uuid default gen_random_uuid() not null,
  target_type text not null,
  target_id text not null,
  target_name text not null,
  violation_type text not null,
  description text default ''::text,
  status text default 'pending'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.reviews (
  id uuid default gen_random_uuid() not null,
  tour_id uuid not null,
  booking_id uuid,
  diver_id text not null,
  instructor_id text,
  rating numeric not null,
  title text,
  comment text default ''::text,
  category_ratings jsonb,
  photos text[] default '{}'::text[] not null,
  video_url text,
  reported boolean default false not null,
  deleted boolean default false not null,
  created_at timestamp with time zone default now() not null,
  instructor_reply text,
  instructor_reply_at timestamp with time zone
);

create table public.support_tickets (
  id uuid default gen_random_uuid() not null,
  user_id text not null,
  booking_id text,
  type text not null,
  category text,
  title text,
  content text not null,
  attachment_names text[] default '{}'::text[] not null,
  status text default '접수'::text not null,
  admin_reply text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.tours (
  id uuid default gen_random_uuid() not null,
  instructor_id text not null,
  center_id uuid,
  title text not null,
  country text not null,
  site text not null,
  activity_types text[] default '{}'::text[] not null,
  certification_level text not null,
  main_image_url text not null,
  gallery_urls text[] default '{}'::text[] not null,
  start_date date not null,
  end_date date not null,
  recruitment_deadline date not null,
  base_price numeric not null,
  water_temp_c numeric default 0 not null,
  visibility_m numeric default 0 not null,
  rating numeric default 0 not null,
  max_participants integer default 1 not null,
  status text default 'open'::text not null,
  description text default ''::text not null,
  inclusions text[] default '{}'::text[] not null,
  exclusions text[] default '{}'::text[] not null,
  prep_notes text default ''::text not null,
  custom_options jsonb default '[]'::jsonb not null,
  is_confirmed boolean default true not null,
  created_at timestamp with time zone default now() not null,
  min_participants integer default 1 not null,
  under_min_policy text default 'cancel'::text not null,
  auto_close_processed boolean default false not null,
  pledge_signer_name text,
  pledge_agreed_at timestamp with time zone,
  pledge_signature_data_url text,
  instructor_notice text,
  itinerary_days jsonb,
  under_min_decision_pending boolean default false not null,
  flight_info jsonb,
  min_log_count integer,
  tags text[] default '{}'::text[],
  meeting_point text,
  meeting_time text
);

-- ════════════════════════════════════════════════════════════════
-- 2) 제약조건 (PK/FK/UNIQUE/CHECK)
-- ════════════════════════════════════════════════════════════════

alter table public.arbitration_messages add constraint arbitration_messages_pkey primary key (id);
alter table public.arbitration_messages add constraint arbitration_messages_sender_role_check check ((sender_role = ANY (ARRAY['instructor'::text, 'admin'::text])));

alter table public.bookings add constraint bookings_pkey primary key (id);
alter table public.bookings add constraint bookings_tour_id_fkey foreign key (tour_id) references tours(id) on delete cascade;
alter table public.bookings add constraint bookings_deposit_status_check check ((deposit_status = ANY (ARRAY['pending'::text, 'paid'::text])));
alter table public.bookings add constraint bookings_status_check check ((status = ANY (ARRAY['confirmed'::text, 'cancelled'::text, 'cancel_pending_review'::text])));

alter table public.centers add constraint centers_pkey primary key (id);
alter table public.centers add constraint centers_status_check check ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));

alter table public.chat_messages add constraint chat_messages_pkey primary key (id);
alter table public.chat_messages add constraint chat_messages_tour_id_fkey foreign key (tour_id) references tours(id) on delete cascade;
alter table public.chat_messages add constraint chat_messages_sender_role_check check ((sender_role = ANY (ARRAY['diver'::text, 'instructor'::text, 'admin'::text])));

alter table public.coupons add constraint coupons_pkey primary key (id);
alter table public.coupons add constraint coupons_code_key unique (code);
alter table public.coupons add constraint coupons_discount_type_check check ((discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])));
alter table public.coupons add constraint coupons_discount_value_check check ((discount_value > 0));

alter table public.deleted_accounts add constraint deleted_accounts_pkey primary key (id);

alter table public.game_players add constraint game_players_pkey primary key (uid);

alter table public.inquiries add constraint inquiries_pkey primary key (id);
alter table public.inquiries add constraint inquiries_booking_id_fkey foreign key (booking_id) references bookings(id) on delete cascade;
alter table public.inquiries add constraint inquiries_tour_id_fkey foreign key (tour_id) references tours(id) on delete cascade;
alter table public.inquiries add constraint inquiries_status_check check ((status = ANY (ARRAY['pending'::text, 'answered'::text])));

alter table public.instructor_notifications add constraint instructor_notifications_pkey primary key (id);
-- 주의: 원래(batch96 이전) check 목록. 'document_review_completed' 값은 이후
-- 20260808023629_add_document_review_completed_notification_type.sql 에서 추가된다.
alter table public.instructor_notifications add constraint instructor_notifications_type_check
  check (type = ANY (ARRAY[
    'new_booking'::text,
    'forced_refund_penalty'::text,
    'min_participants_cancelled'::text,
    'min_participants_proceed'::text,
    'min_participants_decision_needed'::text,
    'application_rejected'::text
  ]));

alter table public.instructors add constraint instructors_pkey primary key (id);
alter table public.instructors add constraint instructors_business_type_check check ((business_type = ANY (ARRAY['individual'::text, 'corporation'::text, 'freelancer'::text])));

alter table public.invoices add constraint invoices_pkey primary key (id);
alter table public.invoices add constraint invoices_booking_id_key unique (booking_id);
alter table public.invoices add constraint invoices_booking_id_fkey foreign key (booking_id) references bookings(id) on delete restrict;
alter table public.invoices add constraint invoices_payout_id_fkey foreign key (payout_id) references payouts(id) on delete set null;

alter table public.mimo_reservations add constraint mimo_reservations_pkey primary key (reservation_id);
alter table public.mimo_reservations add constraint mimo_reservations_salon_id_fkey foreign key (salon_id) references mimo_salons(id) on delete cascade;
alter table public.mimo_reservations add constraint mimo_reservations_user_id_fkey foreign key (user_id) references mimo_users(uid) on delete cascade;
alter table public.mimo_reservations add constraint mimo_reservations_status_check check ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'completed'::text, 'cancelled'::text])));

alter table public.mimo_salons add constraint mimo_salons_pkey primary key (id);

alter table public.mimo_users add constraint mimo_users_pkey primary key (uid);

alter table public.notices add constraint notices_pkey primary key (id);

alter table public.payouts add constraint payouts_pkey primary key (id);
alter table public.payouts add constraint payouts_booking_id_fkey foreign key (booking_id) references bookings(id) on delete cascade;
alter table public.payouts add constraint payouts_status_check check ((status = ANY (ARRAY['scheduled'::text, 'held'::text, 'released'::text, 'cancelled'::text])));

alter table public.penalties_log add constraint penalties_log_pkey primary key (id);
alter table public.penalties_log add constraint penalties_log_instructor_id_fkey foreign key (instructor_id) references instructors(id) on delete cascade;

alter table public.policies add constraint policies_pkey primary key (id);
alter table public.policies add constraint policies_category_check check ((category = ANY (ARRAY['refund'::text, 'violation'::text, 'enforcement'::text])));

alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.profiles add constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;
alter table public.profiles add constraint profiles_gender_check check ((gender = ANY (ARRAY['male'::text, 'female'::text])));
alter table public.profiles add constraint profiles_role_check check ((role = ANY (ARRAY['diver'::text, 'instructor'::text, 'admin'::text])));
alter table public.profiles add constraint profiles_status_check check ((status = ANY (ARRAY['active'::text, 'warned'::text, 'suspended'::text])));

alter table public.push_subscriptions add constraint push_subscriptions_pkey primary key (id);
alter table public.push_subscriptions add constraint push_subscriptions_endpoint_key unique (endpoint);
alter table public.push_subscriptions add constraint push_subscriptions_profile_id_fkey foreign key (profile_id) references profiles(id) on delete cascade;

alter table public.qa_checklist_results add constraint qa_checklist_results_pkey primary key (item_id);
alter table public.qa_checklist_results add constraint qa_checklist_results_status_check check ((status = ANY (ARRAY['미확인'::text, 'Pass'::text, 'Fail'::text, 'N/A'::text, '진행중'::text])));

alter table public.refunds add constraint refunds_pkey primary key (id);
alter table public.refunds add constraint refunds_booking_id_fkey foreign key (booking_id) references bookings(id) on delete cascade;
alter table public.refunds add constraint refunds_amount_check check ((amount >= (0)::numeric));

alter table public.reports add constraint reports_pkey primary key (id);
alter table public.reports add constraint reports_status_check check ((status = ANY (ARRAY['pending'::text, 'resolved'::text])));
alter table public.reports add constraint reports_target_type_check check ((target_type = ANY (ARRAY['instructor'::text, 'diver'::text])));

alter table public.reviews add constraint reviews_pkey primary key (id);
alter table public.reviews add constraint reviews_booking_id_fkey foreign key (booking_id) references bookings(id) on delete cascade;
alter table public.reviews add constraint reviews_tour_id_fkey foreign key (tour_id) references tours(id) on delete cascade;

alter table public.support_tickets add constraint support_tickets_pkey primary key (id);
alter table public.support_tickets add constraint support_tickets_status_check check ((status = ANY (ARRAY['접수'::text, '검토중'::text, '답변완료'::text, '종료'::text])));
alter table public.support_tickets add constraint support_tickets_type_check check ((type = ANY (ARRAY['inquiry'::text, 'dispute'::text, 'report'::text])));

alter table public.tours add constraint tours_pkey primary key (id);
alter table public.tours add constraint tours_center_id_fkey foreign key (center_id) references centers(id);
alter table public.tours add constraint tours_status_check check ((status = ANY (ARRAY['open'::text, 'closed'::text])));
alter table public.tours add constraint tours_under_min_policy_check check ((under_min_policy = ANY (ARRAY['proceed'::text, 'cancel'::text])));

-- ════════════════════════════════════════════════════════════════
-- 3) 인덱스 (제약조건이 자동 생성하는 것 제외 — 별도 생성분만)
-- ════════════════════════════════════════════════════════════════

create index arbitration_messages_instructor_id_idx on public.arbitration_messages using btree (instructor_id);
create index arbitration_messages_room_id_idx on public.arbitration_messages using btree (room_id);
create index game_players_max_depth_idx on public.game_players using btree (max_depth desc);
create index instructor_notifications_created_at_idx on public.instructor_notifications using btree (created_at desc);
create index instructor_notifications_instructor_id_idx on public.instructor_notifications using btree (instructor_id);
create index invoices_booking_id_idx on public.invoices using btree (booking_id);
create index invoices_period_idx on public.invoices using btree (period);
create index push_subscriptions_profile_id_idx on public.push_subscriptions using btree (profile_id);
create index refunds_booking_id_idx on public.refunds using btree (booking_id);

-- ════════════════════════════════════════════════════════════════
-- 4) 컬럼 코멘트
-- ════════════════════════════════════════════════════════════════

comment on column public.instructors.business_type is '가입 시 선택: individual(개인사업자) / corporation(법인사업자) / freelancer(프리랜서, 사업자 없음)';
comment on column public.instructors.settlement_consents is '가입 시 필수 동의 기록. 예: {"feeConfirmed": true, "taxPolicyConfirmed": true, "scheduleConfirmed": true, "termsAgreed": true, "privacyAgreed": true, "agreedAt": "2026-08-05T12:00:00Z"}';
comment on column public.payouts.scheduled_at is '정산 예정일 (자동 정산 스케줄러 또는 관리자가 설정)';
comment on column public.payouts.paid_at is '실제 지급 완료 일시 (status가 released로 바뀔 때 기록)';
comment on column public.payouts.refunded_at is '이 정산 건이 환불로 취소된 경우 그 일시';
comment on column public.payouts.withholding_tax_rate is '정산 생성 시점에 적용한 원천징수 세율 (예: 프리랜서 강사 0.033, 사업자 강사 0)';
comment on column public.payouts.withholding_tax_amount is '원천징수세액 = round((first_amount + second_amount) * withholding_tax_rate)';
comment on column public.payouts.net_payout_amount is '실제 강사 계좌로 지급되는 금액 = first_amount + second_amount - withholding_tax_amount';
comment on column public.payouts.business_type_at_payout is '정산 생성 시점의 instructors.business_type 스냅샷. NULL이면 당시 사업자 유형 미확인 상태였음을 의미.';
comment on column public.profiles.bank_name is '정산 계좌 은행명 (강사 가입 시 입력)';
comment on column public.profiles.account_holder is '정산 계좌 예금주명';
comment on column public.profiles.account_number is '정산 계좌번호';
comment on column public.profiles.bankbook_file_name is '업로드한 통장사본 파일명 (파일 자체는 저장하지 않음 - 기존 신분증/자격증 서류와 동일한 방식)';

-- ════════════════════════════════════════════════════════════════
-- 5) RLS 활성화
-- ════════════════════════════════════════════════════════════════

alter table public.arbitration_messages enable row level security;
alter table public.bookings enable row level security;
alter table public.centers enable row level security;
alter table public.chat_messages enable row level security;
alter table public.coupons enable row level security;
alter table public.deleted_accounts enable row level security;
alter table public.game_players enable row level security;
alter table public.inquiries enable row level security;
alter table public.instructor_notifications enable row level security;
alter table public.instructors enable row level security;
alter table public.invoices enable row level security;
alter table public.mimo_reservations enable row level security;
alter table public.mimo_salons enable row level security;
alter table public.mimo_users enable row level security;
alter table public.notices enable row level security;
alter table public.payouts enable row level security;
alter table public.penalties_log enable row level security;
alter table public.policies enable row level security;
alter table public.profiles enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.qa_checklist_results enable row level security;
alter table public.refunds enable row level security;
alter table public.reports enable row level security;
alter table public.reviews enable row level security;
alter table public.support_tickets enable row level security;
alter table public.tours enable row level security;

-- ════════════════════════════════════════════════════════════════
-- 6) 헬퍼 함수 (batch96/97/98에서 만들어졌으나 이 시점 이전에 이미 라이브에 존재)
-- ════════════════════════════════════════════════════════════════

create or replace function public.is_admin()
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$function$;

create or replace function public.owns_instructor(p_instructor_id text)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists(
    select 1 from public.instructors
    where id = p_instructor_id and profile_id = auth.uid()::text
  );
$function$;

create or replace function public.owns_tour(p_tour_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists(
    select 1 from public.tours
    where id = p_tour_id and public.owns_instructor(instructor_id)
  );
$function$;

create or replace function public.owns_booking(p_booking_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists(
    select 1 from public.bookings
    where id = p_booking_id and diver_id = auth.uid()::text
  );
$function$;

create or replace function public.owns_booking_tour(p_booking_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists(
    select 1 from public.bookings b
    where b.id = p_booking_id and public.owns_tour(b.tour_id)
  );
$function$;

create or replace function public.is_profile_staff_for(p_profile_id text)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    auth.uid()::text = p_profile_id
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
      where b.diver_id = p_profile_id and public.owns_tour(b.tour_id)
    );
$function$;

create or replace function public.is_tour_companion_of(p_profile_id text)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    public.is_profile_staff_for(p_profile_id)
    or exists (
      select 1 from public.bookings mine
      join public.bookings theirs
        on theirs.tour_id = mine.tour_id and theirs.diver_id = p_profile_id
      where mine.diver_id = auth.uid()::text
    );
$function$;

create or replace function public.is_booking_staff(p_diver_id text, p_tour_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    auth.uid()::text = p_diver_id
    or public.is_admin()
    or public.owns_tour(p_tour_id);
$function$;

create or replace function public.is_booking_companion(p_diver_id text, p_tour_id uuid)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select
    public.is_booking_staff(p_diver_id, p_tour_id)
    or exists (
      select 1 from public.bookings mine
      where mine.tour_id = p_tour_id and mine.diver_id = auth.uid()::text
    );
$function$;

create or replace function public.is_recently_deleted_account(p_email text)
 returns boolean
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select exists(
    select 1 from public.deleted_accounts
    where email = p_email and deleted_at >= (now() - interval '6 months')
  );
$function$;

-- ════════════════════════════════════════════════════════════════
-- 7) 그 외 RPC 함수
-- ════════════════════════════════════════════════════════════════

create or replace function public.apply_tour_auto_close(p_tour_id uuid, p_meets_minimum boolean)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if p_meets_minimum then
    update public.tours
    set status = 'closed', auto_close_processed = true
    where id = p_tour_id and status = 'open' and auto_close_processed = false;
  else
    update public.tours
    set status = 'closed', auto_close_processed = true, under_min_decision_pending = true
    where id = p_tour_id and status = 'open' and auto_close_processed = false;
  end if;
end;
$function$;

create or replace function public.report_review(p_review_id uuid)
 returns void
 language sql
 security definer
 set search_path to 'public'
as $function$
  update public.reviews set reported = true where id = p_review_id;
$function$;

create or replace function public.redeem_coupon(p_coupon_id uuid)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.coupons
  set used_count = used_count + 1
  where id = p_coupon_id
    and active = true
    and (usage_limit is null or used_count < usage_limit);
end;
$function$;

create or replace function public.consume_game_heart(p_uid text)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_today date := current_date;
  v_hearts integer;
  v_reset_date date;
begin
  insert into public.game_players (uid)
  values (p_uid)
  on conflict (uid) do nothing;

  select hearts_remaining, hearts_reset_date
    into v_hearts, v_reset_date
  from public.game_players
  where uid = p_uid
  for update;

  if v_reset_date <> v_today then
    v_hearts := 5;
  end if;

  v_hearts := greatest(v_hearts - 1, 0);

  update public.game_players
  set hearts_remaining = v_hearts,
      hearts_reset_date = v_today,
      updated_at = now()
  where uid = p_uid;

  return v_hearts;
end;
$function$;

create or replace function public.grant_continue_heart(p_uid text)
 returns integer
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_today date := current_date;
  v_hearts integer;
  v_reset_date date;
begin
  insert into public.game_players (uid)
  values (p_uid)
  on conflict (uid) do nothing;

  select hearts_remaining, hearts_reset_date
    into v_hearts, v_reset_date
  from public.game_players
  where uid = p_uid
  for update;

  if v_reset_date <> v_today then
    v_hearts := 5;
  end if;

  v_hearts := v_hearts + 1;

  update public.game_players
  set hearts_remaining = v_hearts,
      hearts_reset_date = v_today,
      updated_at = now()
  where uid = p_uid;

  return v_hearts;
end;
$function$;

create or replace function public.set_equipped_skin(p_uid text, p_skin text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.game_players
  set equipped_skin = p_skin,
      updated_at = now()
  where uid = p_uid
    and (p_skin = 'default' or p_skin = any(inventory));
end;
$function$;

create or replace function public.settle_dive_score(p_uid text, p_nickname text, p_depth integer)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_today date := current_date;
  v_daily_earned integer;
  v_raw_points integer;
  v_bonus integer := 0;
  v_allowed_points integer;
  v_prev_max_depth integer;
  v_new_max_depth integer;
  v_is_new_record boolean;
  v_prev_rank1_uid text;
  v_new_rank1_uid text;
  v_became_rank1 boolean := false;
  v_total_points integer;
begin
  insert into public.game_players (uid, nickname)
  values (p_uid, coalesce(p_nickname, '다이버'))
  on conflict (uid) do nothing;

  select daily_points_earned, max_depth
    into v_daily_earned, v_prev_max_depth
  from public.game_players
  where uid = p_uid
  for update;

  if (select daily_points_date from public.game_players where uid = p_uid) <> v_today then
    v_daily_earned := 0;
  end if;

  if p_depth >= 300 then
    v_bonus := 2000;
  elsif p_depth >= 100 then
    v_bonus := 500;
  end if;

  v_raw_points := (p_depth * 10) + v_bonus;
  v_allowed_points := greatest(least(v_raw_points, 5000 - v_daily_earned), 0);

  v_new_max_depth := greatest(v_prev_max_depth, p_depth);
  v_is_new_record := p_depth > v_prev_max_depth;

  update public.game_players
  set nickname = coalesce(p_nickname, nickname),
      current_points = current_points + v_allowed_points,
      max_depth = v_new_max_depth,
      daily_points_earned = v_daily_earned + v_allowed_points,
      daily_points_date = v_today,
      updated_at = now()
  where uid = p_uid
  returning current_points into v_total_points;

  select uid into v_new_rank1_uid
  from public.game_players
  order by max_depth desc, updated_at asc
  limit 1;

  select uid into v_prev_rank1_uid
  from public.game_players
  where 'skin_legendary_diver' = any(inventory)
  limit 1;

  if v_new_rank1_uid is not null and v_new_rank1_uid is distinct from v_prev_rank1_uid then
    if v_prev_rank1_uid is not null then
      update public.game_players
      set inventory = array_remove(inventory, 'skin_legendary_diver'),
          equipped_skin = case when equipped_skin = 'skin_legendary_diver' then 'default' else equipped_skin end
      where uid = v_prev_rank1_uid;
    end if;

    update public.game_players
    set inventory = array_append(inventory, 'skin_legendary_diver'),
        equipped_skin = 'skin_legendary_diver'
    where uid = v_new_rank1_uid
      and not ('skin_legendary_diver' = any(inventory));

    if v_new_rank1_uid = p_uid then
      v_became_rank1 := true;
    end if;
  end if;

  return jsonb_build_object(
    'earnedPoints', v_allowed_points,
    'totalPoints', v_total_points,
    'isNewRecord', v_is_new_record,
    'maxDepth', v_new_max_depth,
    'becameRank1', v_became_rank1
  );
end;
$function$;

create or replace function public.increment_instructor_penalty_count()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  update public.instructors
  set penalty_count = penalty_count + 1
  where id = new.instructor_id;
  return new;
end;
$function$;

-- 강사 본인 정산 요약 (마이페이지 정산센터). instructor_notifications/admin_monthly_accounting와
-- 마찬가지로 어느 fix_*.py 스크립트가 라이브에 반영했는지 로컬 기록이 없던 항목 — 이 baseline에
-- 편입해 이제부터는 이력이 추적된다.
create or replace function public.get_instructor_settlement_summary(p_year integer, p_month integer)
 returns table(period date, booking_count bigint, gmv numeric, platform_fee_amount numeric, instructor_amount_scheduled numeric, instructor_amount_paid numeric, refund_amount numeric, next_payout_date timestamp with time zone)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_instructor_id text;
begin
  select id into v_instructor_id from public.instructors where profile_id = auth.uid()::text;
  if v_instructor_id is null then
    raise exception 'not an instructor';
  end if;

  return query
  select
    date_trunc('month', i.period)::date as period,
    count(*) as booking_count,
    sum(i.gmv_amount) as gmv,
    sum(i.platform_fee_amount) as platform_fee_amount,
    sum(i.instructor_amount) filter (where p.status in ('scheduled', 'held')) as instructor_amount_scheduled,
    sum(i.instructor_amount) filter (where p.status = 'released') as instructor_amount_paid,
    sum(i.refund_amount) as refund_amount,
    min(p.scheduled_at) filter (where p.status in ('scheduled', 'held')) as next_payout_date
  from public.invoices i
  join public.payouts p on p.id = i.payout_id
  where p.instructor_id = v_instructor_id
    and date_trunc('month', i.period) = make_date(p_year, p_month, 1)
  group by date_trunc('month', i.period)::date;
end;
$function$;

create or replace function public.get_admin_monthly_accounting(p_year integer, p_month integer)
 returns table(period date, booking_count bigint, gmv numeric, platform_fee_revenue numeric, refund_amount numeric, net_revenue numeric, instructor_payout_total numeric, estimated_vat numeric)
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
  select
    a.period,
    a.booking_count,
    a.gmv,
    a.platform_fee_revenue,
    a.refund_amount,
    a.net_revenue,
    a.instructor_payout_total,
    -- 예상 부가세: 플랫폼 순매출에 부가세가 포함되어 있다고 가정하고 역산.
    -- (net_revenue ÷ 1.1) × 0.1. ** 실제 세무 처리 방식은 세무사 확인 필요 —
    -- 이 값은 참고용 추정치이며 신고 근거자료로 그대로 쓰면 안 됨. **
    round(a.net_revenue / 1.1 * 0.1) as estimated_vat
  from public.admin_monthly_accounting a
  where date_trunc('month', a.period) = make_date(p_year, p_month, 1);
end;
$function$;

create or replace function public.get_tour_participants_masked(p_tour_id uuid)
 returns table(id uuid, diver_id text, diver_name_masked text, gender text, snoring boolean, smoking boolean, drinking boolean, room_note text, room_no text, status text, participant_count integer, selected_options jsonb)
 language sql
 security definer
 set search_path to 'public'
as $function$
  select
    b.id,
    b.diver_id,
    -- 이름 마스킹: 첫 글자만 노출하고 나머지는 * 처리 (예: "테스트다이버1" -> "테*****")
    case
      when b.diver_name is null or length(b.diver_name) <= 1 then coalesce(b.diver_name, '')
      else left(b.diver_name, 1) || repeat('*', length(b.diver_name) - 1)
    end as diver_name_masked,
    b.gender,
    b.snoring,
    b.smoking,
    b.drinking,
    b.room_note,
    b.room_no,
    b.status,
    b.participant_count,
    b.selected_options
  from public.bookings b
  where b.tour_id = p_tour_id
    and b.status <> 'cancelled';
$function$;

-- ════════════════════════════════════════════════════════════════
-- 8) 트리거
-- ════════════════════════════════════════════════════════════════

create trigger trg_increment_instructor_penalty_count after insert on public.penalties_log for each row execute function increment_instructor_penalty_count();

-- ════════════════════════════════════════════════════════════════
-- 9) 뷰
-- ════════════════════════════════════════════════════════════════

create or replace view public.admin_monthly_accounting as
 SELECT (date_trunc('month'::text, (period)::timestamp with time zone))::date AS period,
    count(*) AS booking_count,
    sum(gmv_amount) AS gmv,
    sum(platform_fee_amount) AS platform_fee_revenue,
    sum(refund_amount) AS refund_amount,
    (sum(platform_fee_amount) - sum(refund_amount)) AS net_revenue,
    sum(instructor_amount) AS instructor_payout_total
   FROM invoices i
  GROUP BY ((date_trunc('month'::text, (period)::timestamp with time zone))::date);

create or replace view public.public_profiles as
select
  id,
  role,
  name,
  status,
  created_at
from public.profiles
where deleted_at is null;

grant select on public.public_profiles to anon, authenticated;

create or replace view public.public_tour_booking_counts as
select
  tour_id,
  COALESCE(sum(COALESCE(participant_count, 1)), (0)::bigint) as confirmed_count
from public.bookings
where status = 'confirmed'
group by tour_id;

grant select on public.public_tour_booking_counts to anon, authenticated;

create or replace view public.bookings_directory as
select
  b.id,
  b.tour_id,
  b.diver_id,
  b.status,
  b.created_at,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.diver_name else null end as diver_name,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.gender else null end as gender,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.room_no else null end as room_no,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.snoring else null end as snoring,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.smoking else null end as smoking,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.drinking else null end as drinking,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.participant_count else null end as participant_count,
  case when public.is_booking_companion(b.diver_id, b.tour_id) then b.selected_options else null end as selected_options,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.base_price else null end as base_price,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.options_cost else null end as options_cost,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.platform_fee else null end as platform_fee,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.total_paid else null end as total_paid,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.on_site_balance else null end as on_site_balance,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.coupon_code else null end as coupon_code,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.discount_amount else null end as discount_amount,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.payment_method else null end as payment_method,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.room_note else null end as room_note,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.deposit_status else null end as deposit_status,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.cancel_reason else null end as cancel_reason,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.refund_rate else null end as refund_rate,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.refund_amount else null end as refund_amount,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.cancel_requested_at else null end as cancel_requested_at,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.evidence_file_names else null end as evidence_file_names,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.flight_info else null end as flight_info,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.passport_info else null end as passport_info,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.companion_names else null end as companion_names,
  case when public.is_booking_staff(b.diver_id, b.tour_id) then b.companions else null end as companions
from public.bookings b;

grant select on public.bookings_directory to anon, authenticated;

create or replace view public.payouts_directory as
select
  p.id,
  p.booking_id,
  p.instructor_id,
  p.status,
  p.created_at,
  case when (public.owns_instructor(p.instructor_id) or public.is_admin()) then p.first_amount else null end as first_amount,
  case when (public.owns_instructor(p.instructor_id) or public.is_admin()) then p.second_amount else null end as second_amount,
  case when (public.owns_instructor(p.instructor_id) or public.is_admin()) then p.withholding_tax_rate else null end as withholding_tax_rate,
  case when (public.owns_instructor(p.instructor_id) or public.is_admin()) then p.withholding_tax_amount else null end as withholding_tax_amount,
  case when (public.owns_instructor(p.instructor_id) or public.is_admin()) then p.net_payout_amount else null end as net_payout_amount,
  case when (public.owns_instructor(p.instructor_id) or public.is_admin()) then p.business_type_at_payout else null end as business_type_at_payout
from public.payouts p;

grant select on public.payouts_directory to anon, authenticated;

-- profiles_directory: 이 baseline 시점의 최초 버전. 2026-08-08 마이그레이션
-- (20260808015813_add_bank_and_document_fields_to_profiles_directory.sql)에서
-- bank_name/account_holder/account_number/bankbook_file_name/bankbook_path/
-- id_document_path 컬럼이 뒤에 추가된 버전으로 CREATE OR REPLACE 된다.
create or replace view public.profiles_directory as
select
  p.id,
  p.role,
  p.name,
  p.status,
  p.created_at,
  case when public.is_tour_companion_of(p.id::text) then p.birth_date else null end as birth_date,
  case when public.is_tour_companion_of(p.id::text) then p.c_card_agency else null end as c_card_agency,
  case when public.is_tour_companion_of(p.id::text) then p.log_count else null end as log_count,
  case when public.is_profile_staff_for(p.id::text) then p.phone else null end as phone,
  case when public.is_profile_staff_for(p.id::text) then p.gender else null end as gender,
  case when public.is_profile_staff_for(p.id::text) then p.snoring else null end as snoring,
  case when public.is_profile_staff_for(p.id::text) then p.smoking else null end as smoking,
  case when public.is_profile_staff_for(p.id::text) then p.c_card_number else null end as c_card_number,
  case when public.is_profile_staff_for(p.id::text) then p.emergency_contact_name else null end as emergency_contact_name,
  case when public.is_profile_staff_for(p.id::text) then p.emergency_contact_phone else null end as emergency_contact_phone,
  case when public.is_profile_staff_for(p.id::text) then p.insurance_info else null end as insurance_info
from public.profiles p
where p.deleted_at is null;

grant select on public.profiles_directory to anon, authenticated;

-- ════════════════════════════════════════════════════════════════
-- 10) RLS 정책
--
-- 주의: tours/reviews/instructors/centers/coupons/qa_checklist_results/
-- deleted_accounts/penalties_log(insert)/chat_messages(insert)는 batch96에서
-- 등록/수정을 본인·관리자로 좁히려 했으나 실제로는 반영되지 않아, 지금도 아래처럼
-- 완전히 공개(using (true))된 상태다. 라이브 상태를 있는 그대로 스냅샷한 것 —
-- PG 연동 전 반드시 별도로 처리해야 한다.
-- ════════════════════════════════════════════════════════════════

create policy arbitration_messages_select on public.arbitration_messages for select using ((is_admin() OR owns_instructor(instructor_id)));
create policy arbitration_messages_insert on public.arbitration_messages for insert with check ((is_admin() OR (owns_instructor(instructor_id) AND (sender_role = 'instructor'::text))));

create policy bookings_public_insert on public.bookings for insert with check (true);
create policy bookings_select_own_or_tour_owner_or_admin on public.bookings for select using (((diver_id = (auth.uid())::text) OR owns_tour(tour_id) OR is_admin()));
create policy bookings_public_update on public.bookings for update using (true) with check (true);

create policy centers_public_select on public.centers for select using (true);
create policy centers_public_insert on public.centers for insert with check (true);
create policy centers_public_update on public.centers for update using (true) with check (true);

create policy chat_messages_public_insert on public.chat_messages for insert with check (true);
create policy chat_messages_select_participant_or_admin on public.chat_messages for select using ((owns_tour(tour_id) OR is_admin() OR (EXISTS ( SELECT 1 FROM bookings b WHERE ((b.tour_id = chat_messages.tour_id) AND (b.diver_id = (auth.uid())::text))))));

create policy coupons_select_public on public.coupons for select using (true);
create policy coupons_insert_all on public.coupons for insert with check (true);
create policy coupons_update_all on public.coupons for update using (true);
create policy coupons_delete_all on public.coupons for delete using (true);

create policy deleted_accounts_service_only_select on public.deleted_accounts for select using (true);
create policy deleted_accounts_service_only_insert on public.deleted_accounts for insert with check (true);

create policy game_players_select_all on public.game_players for select using (true);
create policy game_players_insert_self_zero on public.game_players for insert with check (((current_points = 0) AND (max_depth = 0) AND (inventory = '{}'::text[])));

create policy inquiries_public_insert on public.inquiries for insert with check (true);
create policy inquiries_select_own_or_admin on public.inquiries for select using (((diver_id = (auth.uid())::text) OR is_admin()));
create policy inquiries_public_update on public.inquiries for update using (true) with check (true);

create policy instructor_notifications_select on public.instructor_notifications for select using ((is_admin() OR owns_instructor(instructor_id)));
create policy instructor_notifications_insert on public.instructor_notifications for insert with check ((is_admin() OR owns_instructor(instructor_id) OR (EXISTS ( SELECT 1 FROM tours t WHERE (((t.id)::text = instructor_notifications.tour_id) AND (t.instructor_id = instructor_notifications.instructor_id))))));
create policy instructor_notifications_update on public.instructor_notifications for update using ((is_admin() OR owns_instructor(instructor_id))) with check ((is_admin() OR owns_instructor(instructor_id)));

create policy instructors_public_select on public.instructors for select using (true);
create policy instructors_public_insert on public.instructors for insert with check (true);
create policy instructors_public_update on public.instructors for update using (true) with check (true);

create policy invoices_select_admin_or_own on public.invoices for select using ((is_admin() OR (EXISTS ( SELECT 1 FROM bookings b WHERE ((b.id = invoices.booking_id) AND ((b.diver_id = (auth.uid())::text) OR owns_tour(b.tour_id)))))));
create policy invoices_insert_own_booking_or_admin on public.invoices for insert with check ((is_admin() OR (EXISTS ( SELECT 1 FROM bookings b WHERE ((b.id = invoices.booking_id) AND ((b.diver_id = (auth.uid())::text) OR owns_tour(b.tour_id)))))));

create policy mimo_reservations_public_all on public.mimo_reservations for all using (true) with check (true);
create policy mimo_salons_public_select on public.mimo_salons for select using (true);
create policy mimo_users_public_all on public.mimo_users for all using (true) with check (true);

create policy notices_select_all on public.notices for select using (true);
create policy notices_admin_insert on public.notices for insert with check (is_admin());
create policy notices_admin_update on public.notices for update using (is_admin());
create policy notices_admin_delete on public.notices for delete using (is_admin());

-- payouts: 이 baseline 시점엔 원래(예약자/누구나) insert/update가 열려 있었다.
-- 2026-08-12 20260812015205_lock_down_payouts_write_rls.sql 에서 이 두 정책을
-- 제거하고 SECURITY DEFINER RPC로만 쓰도록 잠갔다.
create policy payouts_public_insert on public.payouts for insert with check (true);
create policy payouts_select_own_instructor_or_admin on public.payouts for select using ((owns_instructor(instructor_id) OR is_admin()));
create policy payouts_public_update on public.payouts for update using (true) with check (true);

create policy penalties_log_public_select on public.penalties_log for select using (true);
create policy penalties_log_public_insert on public.penalties_log for insert with check (true);
-- 이 UPDATE 정책은 21개 구 기록 파일 어디에도 없던 추가 드리프트 — 아마 저장소 루트의
-- fix_penalty_suspend_removal_v2.py 등이 penalties_log.voided 컬럼과 함께 반영한 것으로
-- 추정되나 정확한 출처는 확인 불가. 라이브 상태 그대로 스냅샷.
create policy penalties_log_update_admin on public.penalties_log for update using (is_admin()) with check (is_admin());

create policy policies_public_select on public.policies for select using (true);

create policy profiles_insert_own on public.profiles for insert with check ((auth.uid() = id));
create policy profiles_select_own_or_admin on public.profiles for select using (((auth.uid() = id) OR is_admin()));
create policy profiles_update_own on public.profiles for update using ((auth.uid() = id)) with check ((auth.uid() = id));

create policy push_subscriptions_select_own on public.push_subscriptions for select using ((auth.uid() = profile_id));
create policy push_subscriptions_insert_own on public.push_subscriptions for insert with check ((auth.uid() = profile_id));
create policy push_subscriptions_update_own on public.push_subscriptions for update using ((auth.uid() = profile_id));
create policy push_subscriptions_delete_own on public.push_subscriptions for delete using ((auth.uid() = profile_id));

create policy qa_checklist_results_public_select on public.qa_checklist_results for select using (true);
create policy qa_checklist_results_public_upsert on public.qa_checklist_results for insert with check (true);
create policy qa_checklist_results_public_update on public.qa_checklist_results for update using (true) with check (true);

create policy refunds_select_admin_or_own on public.refunds for select using ((is_admin() OR (EXISTS ( SELECT 1 FROM bookings b WHERE ((b.id = refunds.booking_id) AND ((b.diver_id = (auth.uid())::text) OR owns_tour(b.tour_id)))))));
create policy refunds_insert_admin_only on public.refunds for insert with check (is_admin());

create policy reports_select_admin on public.reports for select using (is_admin());
create policy reports_public_insert on public.reports for insert with check (true);
create policy reports_public_update on public.reports for update using (true) with check (true);

create policy reviews_public_select on public.reviews for select using (true);
create policy reviews_public_insert on public.reviews for insert with check (true);
create policy reviews_public_update on public.reviews for update using (true) with check (true);

create policy support_tickets_select_own_or_admin on public.support_tickets for select using (((user_id = (auth.uid())::text) OR is_admin()));
create policy support_tickets_public_insert on public.support_tickets for insert with check (true);
create policy support_tickets_public_update on public.support_tickets for update using (true) with check (true);

create policy tours_public_select on public.tours for select using (true);
create policy tours_public_insert on public.tours for insert with check (true);
create policy tours_public_update on public.tours for update using (true) with check (true);

-- ════════════════════════════════════════════════════════════════
-- 11) Storage 버킷 + 정책
-- ════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "authenticated upload to uploads"
on storage.objects for insert
to authenticated
with check (bucket_id = 'uploads');

-- ════════════════════════════════════════════════════════════════
-- 12) Realtime publication
-- ════════════════════════════════════════════════════════════════

alter publication supabase_realtime add table public.arbitration_messages;
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.instructor_notifications;
alter publication supabase_realtime add table public.instructors;

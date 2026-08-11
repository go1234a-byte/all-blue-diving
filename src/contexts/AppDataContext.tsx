import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ArbitrationMessage,
  InstructorAdminNote,
  Booking,
  Center,
  ChatMessage,
  Coupon,
  DiveCenter,
  Inquiry,
  InquiryCategory,
  InstructorBusinessType,
  InstructorNotification,
  InstructorProfile,
  Notice,
  Payout,
  Penalty,
  Profile,
  Report,
  Review,
  ReviewCategoryRatings,
  SelectedOption,
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
  Tour,
  TourCancellationClaim,
  TourCancellationClaimStatus,
  TourItineraryDay,
  TourOption,
  UnderMinParticipantsPolicy, CompanionInfo,} from "@/types";
import { MOCK_ADMIN_PROFILE, MOCK_DIVE_CENTERS } from "@/data/mockData";
import { computeSettlement } from "@/lib/pricing";
import { computeRefundRate, computeRefundAmount } from "@/lib/refund";
import { shouldEvaluateAutoClose, MIN_PARTICIPANTS_AUTO_CANCEL_REASON, ADMIN_FORCED_CLOSURE_REASON } from "@/lib/tourAutoClose";
import { sendPushToProfile } from "@/lib/push";
import { maskName } from "@/lib/masking";
import { supabase } from "@/integrations/supabase/client";

const BOOKMARK_STORAGE_KEY = "allblue-bookmarked-tours";
const INSTRUCTOR_BOOKMARK_STORAGE_KEY = "allblue-bookmarked-instructors";

function mapPenaltyRow(row: {
  id: string;
  instructor_id: string;
  violation_type: string;
  description: string | null;
  voided?: boolean | null;
  created_at: string;
}): Penalty {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    violationType: row.violation_type as Penalty["violationType"],
    description: row.description ?? "",
    voided: row.voided ?? false,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfileRow(row: any): Profile {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    phone: row.phone ?? "",
    gender: row.gender ?? "male",
    status: row.status,
    createdAt: row.created_at,
    snoring: row.snoring ?? false,
    smoking: row.smoking ?? false,
    birthDate: row.birth_date ?? undefined,
    cCardAgency: row.c_card_agency ?? undefined,
    cCardNumber: row.c_card_number ?? undefined,
    cCardPhotoPath: row.c_card_photo_path ?? undefined,
    logCount: row.log_count ?? undefined,
    emergencyContactName: row.emergency_contact_name ?? undefined,
    emergencyContactPhone: row.emergency_contact_phone ?? undefined,
    insuranceInfo: row.insurance_info ?? undefined,
    bankName: row.bank_name ?? undefined,
    accountHolder: row.account_holder ?? undefined,
    accountNumber: row.account_number ?? undefined,
    bankbookFileName: row.bankbook_file_name ?? undefined,
    bankbookPath: row.bankbook_path ?? undefined,
    idDocumentPath: row.id_document_path ?? undefined,
  };
}

function mapInstructorRow(row: {
  id: string;
  profile_id: string | null;
  created_at: string;
  name: string;
  avatar_url: string | null;
  agency: string | null;
  level?: string | null;
  license_file_names: string[] | null;
  license_file_paths?: string[] | null;
  documents_pending_review?: boolean | null;
  signature_data_url: string | null;
  verified_status: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  pledge_signed?: boolean | null;
  pledge_signed_at?: string | null;
  pledge_version?: string | null;
  business_type?: string | null;
  total_logs: number;
  experience_years: number;
  completion_rate: number;
  rating: number;
  penalty_count: number;
  penalty_reason?: string | null;
  bio: string | null;
  languages?: string[] | null;
  specialty_tags?: string[] | null;
  teaching_philosophy?: string | null;
  favorite_diving?: string | null;
  sns_instagram?: string | null;
  sns_youtube?: string | null;
  sns_facebook?: string | null;
  sns_blog?: string | null;
  sns_homepage?: string | null;
}): InstructorProfile {
  return {
    id: row.id,
    profileId: row.profile_id ?? "",
    createdAt: row.created_at,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    agency: row.agency ?? undefined,
    level: row.level ?? undefined,
    licenseFileNames: row.license_file_names ?? [],
    licenseFilePaths: row.license_file_paths ?? [],
    documentsPendingReview: row.documents_pending_review ?? false,
    signatureDataUrl: row.signature_data_url ?? undefined,
    verified: row.verified_status,
    verifiedAt: row.verified_at ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
    pledgeSigned: row.pledge_signed ?? false,
    pledgeSignedAt: row.pledge_signed_at ?? undefined,
    pledgeVersion: row.pledge_version ?? undefined,
    businessType: (row.business_type as InstructorProfile["businessType"]) ?? undefined,
    totalLogs: row.total_logs,
    experienceYears: row.experience_years,
    completionRate: Number(row.completion_rate),
    rating: Number(row.rating),
    penaltyCount: row.penalty_count,
    penaltyReason: row.penalty_reason ?? undefined,
    bio: row.bio ?? "",
    languages: row.languages ?? undefined,
    specialtyTags: row.specialty_tags ?? undefined,
    teachingPhilosophy: row.teaching_philosophy ?? undefined,
    favoriteDiving: row.favorite_diving ?? undefined,
    snsInstagram: row.sns_instagram ?? undefined,
    snsYoutube: row.sns_youtube ?? undefined,
    snsFacebook: row.sns_facebook ?? undefined,
    snsBlog: row.sns_blog ?? undefined,
    snsHomepage: row.sns_homepage ?? undefined,
  };
}

function mapCenterRow(row: {
  id: string;
  name: string;
  country: string | null;
  address: string;
  google_map: string | null;
  homepage: string | null;
  instagram: string | null;
  phone: string | null;
  features: string[] | null;
  status?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}): Center {
  return {
    id: row.id,
    name: row.name,
    country: row.country ?? undefined,
    address: row.address,
    googleMap: row.google_map ?? undefined,
    homepage: row.homepage ?? undefined,
    instagram: row.instagram ?? undefined,
    phone: row.phone ?? undefined,
    features: row.features ?? [],
    // status 컬럼이 아직 마이그레이션 전이라 없을 수도 있으므로 기본값은 approved로 둔다
    // (기존에 이미 등록된 센터들이 갑자기 전부 "승인 대기"로 바뀌어 노출되지 않는 사고 방지).
    status: (row.status as Center["status"]) ?? "approved",
    rejectionReason: row.rejection_reason ?? undefined,
    createdAt: row.created_at,
  };
}

function mapSupportTicketRow(row: {
  id: string;
  user_id: string;
  booking_id: string | null;
  type: string;
  category: string | null;
  title: string | null;
  content: string;
  attachment_names: string[] | null;
  status: string;
  admin_reply: string | null;
  created_at: string;
}): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    bookingId: row.booking_id ?? undefined,
    type: row.type as SupportTicketType,
    category: row.category ?? undefined,
    title: row.title ?? undefined,
    content: row.content,
    attachmentNames: row.attachment_names ?? [],
    status: row.status as SupportTicketStatus,
    adminReply: row.admin_reply ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTourRow(row: any): Tour {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    centerId: row.center_id ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    title: row.title,
    country: row.country,
    site: row.site,
    activityTypes: row.activity_types ?? [],
    minLogCount: row.min_log_count ?? undefined,
    tags: row.tags ?? [],
    certificationLevel: row.certification_level,
    mainImageUrl: row.main_image_url,
    galleryUrls: row.gallery_urls ?? [],
    startDate: row.start_date,
    endDate: row.end_date,
    recruitmentDeadline: row.recruitment_deadline,
    basePrice: Number(row.base_price),
    waterTempC: Number(row.water_temp_c ?? 0),
    visibilityM: Number(row.visibility_m ?? 0),
    rating: Number(row.rating ?? 0),
    maxParticipants: row.max_participants,
    minParticipants: row.min_participants ?? 1,
    underMinPolicy: (row.under_min_policy ?? "cancel") as Tour["underMinPolicy"],
    autoCloseProcessed: row.auto_close_processed ?? false,
    underMinDecisionPending: row.under_min_decision_pending ?? false,
    status: row.status,
    description: row.description ?? "",
    inclusions: row.inclusions ?? [],
    exclusions: row.exclusions ?? [],
    prepNotes: row.prep_notes ?? "",
    customOptions: (row.custom_options ?? []) as TourOption[],
    isConfirmed: row.is_confirmed,
    pledgeSignerName: row.pledge_signer_name ?? undefined,
    pledgeAgreedAt: row.pledge_agreed_at ?? undefined,
    pledgeSignatureDataUrl: row.pledge_signature_data_url ?? undefined,
    instructorNotice: row.instructor_notice ?? undefined,
    itineraryDays: (row.itinerary_days ?? undefined) as Tour["itineraryDays"],
    adminStatus: (row.admin_status ?? undefined) as Tour["adminStatus"],
    meetingPoint: row.meeting_point ?? "",
    meetingTime: row.meeting_time ?? "",
    flightInfo: (row.flight_info ?? undefined) as Tour["flightInfo"],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBookingRow(row: any): Booking {
  return {
    id: row.id,
    tourId: row.tour_id,
    diverId: row.diver_id,
    diverName: row.diver_name,
    basePrice: Number(row.base_price),
    optionsCost: Number(row.options_cost),
    selectedOptions: (row.selected_options ?? []) as SelectedOption[],
    platformFee: Number(row.platform_fee),
    totalPaid: Number(row.total_paid),
    onSiteBalance: Number(row.on_site_balance),
    couponCode: row.coupon_code ?? undefined,
    discountAmount: row.discount_amount !== null && row.discount_amount !== undefined ? Number(row.discount_amount) : undefined,
    paymentMethod: row.payment_method,
    gender: row.gender,
    snoring: row.snoring,
    smoking: row.smoking,
    drinking: row.drinking ?? false,
    roomNote: row.room_note ?? undefined,
    roomNo: row.room_no ?? undefined,
    depositStatus: row.deposit_status,
    status: row.status,
    createdAt: row.created_at,
    cancelReason: row.cancel_reason ?? undefined,
    refundRate: row.refund_rate !== null ? Number(row.refund_rate) : undefined,
    refundAmount: row.refund_amount !== null ? Number(row.refund_amount) : undefined,
    cancelRequestedAt: row.cancel_requested_at ?? undefined,
    evidenceFileNames: row.evidence_file_names ?? undefined,
    flightInfo: row.flight_info ?? undefined,
    passportInfo: row.passport_info ?? undefined,
    participantCount: row.participant_count != null ? Number(row.participant_count) : 1,
    companionNames: row.companion_names ?? undefined,
    companions: Array.isArray(row.companions) ? (row.companions as CompanionInfo[]) : [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCouponRow(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minPurchase: Number(row.min_purchase ?? 0),
    maxDiscount: row.max_discount !== null && row.max_discount !== undefined ? Number(row.max_discount) : undefined,
    expiresAt: row.expires_at ?? undefined,
    usageLimit: row.usage_limit !== null && row.usage_limit !== undefined ? Number(row.usage_limit) : undefined,
    usedCount: Number(row.used_count ?? 0),
    active: row.active,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReviewRow(row: any): Review {
  return {
    id: row.id,
    tourId: row.tour_id,
    bookingId: row.booking_id,
    diverId: row.diver_id,
    instructorId: row.instructor_id ?? undefined,
    rating: Number(row.rating),
    title: row.title ?? undefined,
    comment: row.comment ?? "",
    categoryRatings: (row.category_ratings ?? undefined) as ReviewCategoryRatings | undefined,
    photos: row.photos ?? [],
    videoUrl: row.video_url ?? undefined,
    visibility: (row.visibility as Review["visibility"]) ?? "public",
    reported: row.reported,
    deleted: row.deleted,
    createdAt: row.created_at,
    instructorReply: row.instructor_reply ?? undefined,
    instructorReplyAt: row.instructor_reply_at ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapReportRow(row: any): Report {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    targetName: row.target_name,
    violationType: row.violation_type,
    description: row.description ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPayoutRow(row: any): Payout {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    bookingId: row.booking_id,
    firstAmount: Number(row.first_amount),
    secondAmount: Number(row.second_amount),
    status: row.status,
    // 원천징수 관련 컬럼은 payouts_directory 뷰에서 본인 강사/관리자에게만 값이 내려오고,
    // 그 외 열람자에게는 null로 마스킹되어 온다 (금액 필드와 동일한 보안 정책).
    withholdingTaxRate:
      row.withholding_tax_rate === null || row.withholding_tax_rate === undefined
        ? undefined
        : Number(row.withholding_tax_rate),
    withholdingTaxAmount:
      row.withholding_tax_amount === null || row.withholding_tax_amount === undefined
        ? undefined
        : Number(row.withholding_tax_amount),
    netPayoutAmount:
      row.net_payout_amount === null || row.net_payout_amount === undefined
        ? undefined
        : Number(row.net_payout_amount),
    businessTypeAtPayout: row.business_type_at_payout ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInquiryRow(row: any): Inquiry {
  return {
    id: row.id,
    tourId: row.tour_id,
    bookingId: row.booking_id,
    diverId: row.diver_id,
    category: row.category,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapChatMessageRow(row: any): ChatMessage {
  return {
    id: row.id,
    tourId: row.tour_id,
    senderProfileId: row.sender_profile_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    body: row.body,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapArbitrationMessageRow(row: any): ArbitrationMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    instructorId: row.instructor_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    body: row.body,
    attachmentNames: row.attachment_names ?? undefined,
    attachmentUrls: row.attachment_urls ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInstructorAdminNoteRow(row: any): InstructorAdminNote {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    senderRole: row.sender_role,
    senderName: row.sender_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTourCancellationClaimRow(row: any): TourCancellationClaim {
  return {
    id: row.id,
    tourId: row.tour_id,
    instructorId: row.instructor_id,
    reason: row.reason,
    evidenceFileUrls: row.evidence_file_urls ?? [],
    affectedBookingIds: row.affected_booking_ids ?? [],
    status: row.status,
    adminNote: row.admin_note ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInstructorNotificationRow(row: any): InstructorNotification {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    tourId: row.tour_id,
    bookingId: row.booking_id ?? undefined,
    tourTitle: row.tour_title,
    diverName: row.diver_name ?? undefined,
    selectedOptionNames: row.selected_option_names ?? undefined,
    settlementAmount: row.settlement_amount ?? undefined,
    message: row.message ?? undefined,
    createdAt: row.created_at,
    read: row.read,
    type: row.type,
  };
}

/**
 * instructor_notifications 테이블에 알림을 기록한다(insert-only, fire-and-forget).
 * 실제 상태 갱신은 실시간 구독(INSERT 이벤트)이 담당하므로 여기서는 로컬 state를
 * 직접 건드리지 않는다 — arbitration_messages/chat_messages와 동일한 패턴.
 */
async function persistInstructorNotification(
  notification: Omit<InstructorNotification, "id" | "read">,
): Promise<void> {
  const { error } = await supabase.from("instructor_notifications").insert({
    instructor_id: notification.instructorId,
    tour_id: notification.tourId,
    booking_id: notification.bookingId ?? null,
    tour_title: notification.tourTitle,
    diver_name: notification.diverName ?? null,
    selected_option_names: notification.selectedOptionNames ?? null,
    settlement_amount: notification.settlementAmount ?? null,
    message: notification.message ?? null,
    type: notification.type,
    created_at: notification.createdAt,
  });
  if (error) {
    console.error("[persistInstructorNotification] instructor_notifications insert 실패:", error);
  }
}

export interface NewBookingInput {
  tourId: string;
  diverId?: string; // 실 로그인 다이버의 profiles.id — 없으면 게스트 예약으로 처리
  diverName: string;
  basePrice: number;
  optionsCost: number;
  selectedOptions: SelectedOption[];
  platformFee: number;
  totalPaid: number;
  onSiteBalance: number;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: Booking["paymentMethod"];
  gender: Booking["gender"];
  snoring: boolean;
  smoking: boolean;
  drinking: boolean;
  roomNote?: string;
  /** 이 예약으로 결제/확정할 인원 수 (본인 포함, 기본 1명). */
  participantCount?: number;
  /** 2명 이상 예약 시 본인 외 동반자 이름 (선택, 자유 텍스트) — companions가 있으면 무시되고
   * 그 이름들로 자동 채워진다. companions 없이 이 값만 넘기는 옛 호출부와의 하위호환용. */
  companionNames?: string;
  /** 본인 외 동반자별 상세 참가자 정보 (성별/코골이/흡연/음주/직접입력). */
  companions?: CompanionInfo[];
}

interface NewTourInput {
  instructorId: string;
  centerId?: string;
  title: string;
  country: string;
  site: string;
  activityTypes: Tour["activityTypes"];
  minLogCount?: number;
  tags?: string[];
  certificationLevel: Tour["certificationLevel"];
  mainImageUrl: string;
  galleryUrls: string[];
  startDate: string;
  endDate: string;
  recruitmentDeadline: string;
  basePrice: number;
  waterTempC: number;
  visibilityM: number;
  maxParticipants: number;
  minParticipants: number;
  underMinPolicy: Tour["underMinPolicy"];
  description: string;
  inclusions: string[];
  exclusions: string[];
  prepNotes: string;
  customOptions: TourOption[];
  pledgeSignerName: string;
  pledgeAgreedAt: string;
  pledgeSignatureDataUrl?: string;
  meetingPoint: string;
  meetingTime: string;
  itineraryDays: TourItineraryDay[];
  flightInfo?: Tour["flightInfo"];
}

/** 강사가 기존 투어를 수정할 때 사용하는 부분 업데이트 입력. 지정한 필드만 갱신한다. */
interface UpdateTourInput {
  centerId?: string;
  title?: string;
  country?: string;
  site?: string;
  activityTypes?: Tour["activityTypes"];
  minLogCount?: number;
  tags?: string[];
  certificationLevel?: Tour["certificationLevel"];
  mainImageUrl?: string;
  galleryUrls?: string[];
  startDate?: string;
  endDate?: string;
  recruitmentDeadline?: string;
  basePrice?: number;
  maxParticipants?: number;
  minParticipants?: number;
  description?: string;
  inclusions?: string[];
  exclusions?: string[];
  prepNotes?: string;
  customOptions?: TourOption[];
  meetingPoint?: string;
  meetingTime?: string;
  itineraryDays?: TourItineraryDay[];
  flightInfo?: Tour["flightInfo"];
}

interface NewCenterInput {
  name: string;
  country?: string;
  address: string;
  googleMap?: string;
  homepage?: string;
  instagram?: string;
  phone?: string;
  features: string[];
  /**
   * 관리자가 AdminCentersPage에서 직접 등록할 때만 "approved"를 명시적으로 넘긴다.
   * 강사가 투어 생성 중 "새 센터 등록"으로 넣는 경우는 생략하면 기본값 "pending"이 적용되어,
   * 관리자 승인 전까지는 다른 강사의 "기존 센터 선택" 목록에 노출되지 않는다.
   */
  status?: "pending" | "approved";
}

interface NewInstructorSignupInput {
  name: string;
  phone: string;
  gender: Profile["gender"];
  licenseFileNames: string[];
  licenseFilePaths?: string[];
  signatureDataUrl?: string;
  bio: string;
  pledgeSigned?: boolean;
  businessType?: InstructorBusinessType;
  settlementPledgeAgreed?: boolean;
  // 관리자 승인 심사에 필요한 서류 — 실제 파일은 InstructorSignupForm에서 이미
  // instructor-documents 버킷에 업로드를 마친 뒤, 그 저장 경로만 여기로 전달된다.
  bankName?: string;
  accountHolder?: string;
  accountNumber?: string;
  bankbookFileName?: string;
  bankbookPath?: string;
  idDocumentPath?: string;
}

interface NewDiverSignupInput {
  name: string;
  phone: string;
  gender: Profile["gender"];
}

interface NewInquiryInput {
  tourId: string;
  bookingId: string;
  diverId: string;
  category: InquiryCategory;
  message: string;
}

interface NewReviewInput {
  tourId: string;
  bookingId: string;
  diverId: string;
  instructorId?: string;
  rating: number;
  title?: string;
  comment: string;
  categoryRatings?: ReviewCategoryRatings;
  photos?: string[];
  videoUrl?: string;
  /** "public"(전체공개, 기본값) | "instructor_only"(강사/관리자만 공개) */
  visibility?: Review["visibility"];
}

interface NewSupportTicketInput {
  userId: string;
  bookingId?: string;
  type: SupportTicketType;
  category?: string;
  title?: string;
  content: string;
  attachmentNames?: string[];
}

interface AppDataContextValue {
  tours: Tour[];
  toursLoading: boolean;
  instructors: InstructorProfile[];
  instructorsLoading: boolean;
  instructorProfiles: Profile[];
  diverProfiles: Profile[];
  publicProfiles: Profile[];
  /** 투어별 "확정된 예약 참가자 수" 합계 — 이름/성별 등 개인정보 없이 숫자만 담은
   * public_tour_booking_counts 뷰에서 가져온다. bookings 테이블 자체는 RLS로
   * 본인/담당 강사/관리자만 조회 가능해서, 그걸로 정원(X/N명)을 계산하면
   * 게스트나 다른 다이버 눈에는 다른 사람 예약이 안 보여 정원이 실제보다
   * 적게 표시되고 초과예약 방지도 깨지는 문제가 있었다 — 반드시 이 값을
   * 통해서 정원을 계산해야 한다 (bookings 배열을 직접 reduce하지 말 것). */
  getConfirmedParticipantCount: (tourId: string) => number;
  /** 채팅방에서 담당 강사/관리자가 아닌 일반 참가자가 다른 참가자 목록을 볼 때 쓰는,
   * 이름이 이미 마스킹된 상태로 DB에서 내려오는 목록을 가져온다(get_tour_participants_masked
   * 함수 호출). bookings 배열은 RLS로 본인 예약만 담겨 있어 그대로 쓰면 안 된다. 반환값은
   * Booking 타입이지만 결제 관련 필드 등은 채팅방 참가자 화면에서 쓰지 않으므로 0/빈값으로
   * 채워져 있다 — 절대 다른 화면(결제 내역 등)에 재사용하지 말 것. */
  fetchMaskedTourParticipants: (tourId: string) => Promise<Booking[]>;
  adminProfile: Profile;
  bookings: Booking[];
  bookingsLoading: boolean;
  payouts: Payout[];
  penalties: Penalty[];
  reports: Report[];
  chatMessages: ChatMessage[];
  bookmarkedTourIds: string[];
  bookmarkedInstructorIds: string[];
  reviews: Review[];
  inquiries: Inquiry[];
  instructorNotifications: InstructorNotification[];
  arbitrationMessages: ArbitrationMessage[];
  instructorAdminNotes: InstructorAdminNote[];
  tourCancellationClaims: TourCancellationClaim[];
  centers: Center[];
  centersLoading: boolean;
  supportTickets: SupportTicket[];
  supportTicketsLoading: boolean;
  notices: Notice[];
  coupons: Coupon[];

  addTour: (input: NewTourInput) => Promise<Tour>;
  resolveUnderMinDecision: (tourId: string, decision: UnderMinParticipantsPolicy) => Promise<void>;
  forceCancelTourBookings: (tourId: string) => Promise<number>;
  cancelTourByInstructor: (
    tourId: string,
    reason: string,
    evidenceFileUrls: string[],
  ) => Promise<TourCancellationClaim>;
  reviewTourCancellationClaim: (
    claimId: string,
    approved: boolean,
    adminNote: string,
    reviewedBy: string,
  ) => Promise<void>;
  updateTourNotice: (tourId: string, notice: string) => Promise<void>;
  updateTourItinerary: (tourId: string, days: TourItineraryDay[]) => Promise<void>;
  updateTourMeetingInfo: (tourId: string, meetingPoint: string, meetingTime: string) => Promise<void>;
  updateTour: (tourId: string, patch: UpdateTourInput) => Promise<void>;
  setTourAdminStatus: (tourId: string, adminStatus: Tour["adminStatus"]) => Promise<void>;
  closeTourRecruiting: (tourId: string) => Promise<void>;
  deleteTour: (tourId: string) => Promise<void>;
  updateBookingTravelInfo: (bookingId: string, input: { flightInfo?: string; passportInfo?: string }) => Promise<void>;
  updateDiverProfile: (
    diverId: string,
    updates: {
      birthDate?: string;
      cCardAgency?: string;
      cCardNumber?: string;
      cCardPhotoPath?: string;
      logCount?: number;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      insuranceInfo?: string;
    },
  ) => Promise<void>;
  addBooking: (input: NewBookingInput) => Promise<Booking>;
  addInstructorSignup: (input: NewInstructorSignupInput) => Promise<InstructorProfile>;
  addDiverSignup: (input: NewDiverSignupInput) => Profile;
  registerDiverProfile: (profile: Profile) => void;
  setProfileStatus: (profileId: string, status: Profile["status"]) => void;
  setPayoutStatus: (payoutId: string, status: Payout["status"]) => Promise<void>;
  addReport: (input: Omit<Report, "id" | "createdAt" | "status">) => Promise<void>;
  resolveReport: (reportId: string) => Promise<void>;
  addChatMessage: (input: Omit<ChatMessage, "id" | "createdAt">) => Promise<void>;
  setInstructorVerified: (instructorId: string, verified: boolean, verifiedBy?: string) => Promise<void>;
  rejectInstructorApplication: (instructorId: string, reason: string, rejectedBy?: string) => Promise<void>;
  setInstructorPenalty: (instructorId: string, penaltyCount: number, reason?: string) => Promise<void>;
  voidPenalty: (penaltyId: string, instructorId: string) => Promise<void>;
  updateInstructorProfile: (
    instructorId: string,
    updates: {
      name?: string;
      phone?: string;
      agency?: string;
      level?: string;
      totalLogs?: number;
      experienceYears?: number;
      bio?: string;
      licenseFileNames?: string[];
      avatarUrl?: string;
      languages?: string[];
      specialtyTags?: string[];
      teachingPhilosophy?: string;
      favoriteDiving?: string;
      snsInstagram?: string;
      snsYoutube?: string;
      snsFacebook?: string;
      snsBlog?: string;
      snsHomepage?: string;
      businessType?: InstructorBusinessType;
    },
  ) => Promise<void>;
  submitInstructorDocumentCorrection: (
    instructorId: string,
    updates: {
      idDocumentPath?: string;
      bankbookPath?: string;
      bankbookFileName?: string;
      licenseFileNames?: string[];
      licenseFilePaths?: string[];
      bankName?: string;
      accountHolder?: string;
      accountNumber?: string;
    },
  ) => Promise<void>;
  clearInstructorDocumentReview: (instructorId: string) => Promise<void>;
  toggleBookmark: (tourId: string) => void;
  isBookmarked: (tourId: string) => boolean;
  toggleInstructorBookmark: (instructorId: string) => void;
  isInstructorBookmarked: (instructorId: string) => boolean;
  addInquiry: (input: NewInquiryInput) => Promise<Inquiry>;
  addReview: (input: NewReviewInput) => Promise<Review>;
  getReviewByBookingId: (bookingId: string) => Review | undefined;
  getReviewsByTourId: (tourId: string) => Review[];
  getReviewsByInstructorId: (instructorId: string) => Review[];
  reportReview: (reviewId: string) => Promise<void>;
  replyToReview: (reviewId: string, reply: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  getCouponByCode: (code: string) => Coupon | undefined;
  addCoupon: (input: Omit<Coupon, "id" | "createdAt" | "usedCount">) => Promise<Coupon>;
  toggleCouponActive: (couponId: string) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
  redeemCoupon: (couponId: string) => Promise<void>;
  markInstructorNotificationRead: (notificationId: string) => void;
  cancelBooking: (bookingId: string, reason: string) => Promise<{ refundRate: number; refundAmount: number }>;
  updateBookingRoom: (bookingId: string, roomNo: string | null) => Promise<void>;
  /** 동반자(companions 배열 안의 특정 인원) 개인의 방 번호를 배정/수정한다. companions는
   * jsonb라 컬럼 추가 없이 해당 인덱스의 객체에 roomNo만 채워서 통째로 업데이트한다. */
  updateCompanionRoom: (bookingId: string, companionIndex: number, roomNo: string | null) => Promise<void>;
  submitCancellationForReview: (bookingId: string, reason: string, evidenceFileNames: string[]) => Promise<void>;
  resolveCancellationReview: (bookingId: string, approved: boolean, rejectReason?: string) => Promise<void>;
  addArbitrationMessage: (input: Omit<ArbitrationMessage, "id" | "createdAt">) => Promise<void>;
  addInstructorAdminNote: (input: Omit<InstructorAdminNote, "id" | "createdAt">) => Promise<void>;
  addCenter: (input: NewCenterInput) => Promise<Center>;
  updateCenter: (centerId: string, updates: NewCenterInput) => Promise<void>;
  setCenterStatus: (centerId: string, status: "approved" | "rejected", reason?: string) => Promise<void>;
  deleteCenter: (centerId: string) => Promise<void>;
  addSupportTicket: (input: NewSupportTicketInput) => Promise<SupportTicket>;
  updateSupportTicketStatus: (ticketId: string, status: SupportTicketStatus, adminReply?: string) => Promise<void>;
  addNotice: (input: Omit<Notice, "id" | "createdAt">) => Notice;
  deleteNotice: (noticeId: string) => void;

  getInstructorById: (id: string) => InstructorProfile | undefined;
  getInstructorProfileById: (id: string) => Profile | undefined;
  getTourById: (id: string) => Tour | undefined;
  getDiveCenterByInstructorId: (id: string) => DiveCenter | undefined;
  getCenterById: (id: string) => Center | undefined;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

let idCounter = 1000;
// 예전에는 idCounter가 매 페이지 로드마다 1000부터 다시 시작해서, 실제 DB에 이미
// "inst-1001" 같은 낮은 번호의 행이 있으면(과거 세션에서 생성된 실데이터/QA 테스트 데이터)
// 새로 생성한 id가 그것과 그대로 충돌했다 — insert가 PK 중복(409)으로 조용히 실패해도
// 호출부에서 에러를 확인하지 않아 "가입은 성공했다고 뜨지만 실제로는 강사/다이버 등
// 레코드가 DB에 하나도 생성되지 않은" 유령 계정이 만들어지는 버그의 근본 원인이었다.
// (미인증 강사가 로그아웃이 안 되던 문제, 관리자 승인 큐에 강사가 안 뜨던 문제 모두 이 때문.)
// 타임스탬프+랜덤 문자열을 섞어 세션 간에도 절대 충돌하지 않도록 한다.
function nextId(prefix: string): string {
  idCounter += 1;
  const entropy = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${entropy}${idCounter.toString(36)}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructorProfiles, setInstructorProfiles] = useState<Profile[]>([]);
  const [diverProfiles, setDiverProfiles] = useState<Profile[]>([]);
  const [publicProfiles, setPublicProfiles] = useState<Profile[]>([]);
  const [tourConfirmedCounts, setTourConfirmedCounts] = useState<Record<string, number>>({});
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [instructorNotifications, setInstructorNotifications] = useState<InstructorNotification[]>([]);
  const [arbitrationMessages, setArbitrationMessages] = useState<ArbitrationMessage[]>([]);
  const [instructorAdminNotes, setInstructorAdminNotes] = useState<InstructorAdminNote[]>([]);
  const [tourCancellationClaims, setTourCancellationClaims] = useState<TourCancellationClaim[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [centersLoading, setCentersLoading] = useState(true);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [notices, setNotices] = useState<Notice[]>([
    {
      id: nextId("notice"),
      title: "ALL BLUE 서비스 이용약관 개정 안내",
      content: "예약 취소·환불 정책이 일부 개정되었습니다. 자세한 내용은 정책 페이지를 확인해주세요.",
      category: "정책 변경",
      pinned: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: nextId("notice"),
      title: "정기 시스템 점검 안내",
      content: "매주 화요일 새벽 2시~4시 서비스 점검이 진행됩니다. 점검 시간 중에는 예약/결제가 일시 제한됩니다.",
      category: "점검",
      pinned: false,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(true);
  const [bookmarkedTourIds, setBookmarkedTourIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(BOOKMARK_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [bookmarkedInstructorIds, setBookmarkedInstructorIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(INSTRUCTOR_BOOKMARK_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  /**
   * 담당 강사(instructorId → instructors.profileId)에게 실제 OS 푸시를 시도한다.
   * VAPID 키가 설정되지 않은 환경(TODO: 실푸시 연동 필요)에서는 send-push Edge Function이
   * 스켈레톤 응답을 반환하므로 앱 동작에는 영향이 없다.
   */
  const notifyInstructorPush = (instructorId: string, title: string, body: string, url?: string) => {
    const instructor = instructors.find((i) => i.id === instructorId);
    if (instructor?.profileId) {
      void sendPushToProfile(instructor.profileId, { title, body, url });
    }
  };

  /** 다이버(profiles.id === diverId)에게 실제 OS 푸시를 시도한다. */
  const notifyDiverPush = (diverId: string, title: string, body: string, url?: string) => {
    void sendPushToProfile(diverId, { title, body, url });
  };

  // Enter Cloud(Supabase) `instructors` 테이블에서 강사 신뢰 데이터를 가져온다.
  // + realtime 구독 추가: 예전에는 1회성 fetch만 있어서 관리자가 인증 승인/반려를 처리해도
  // 해당 강사의 브라우저 세션에는 새로고침 전까지 전혀 반영되지 않았다(#235 회귀 방지).
  // 주의: 기존에는 UPDATE만 구독해서, 신규 강사가 "가입"할 때(instructors 행 INSERT)는
  // 관리자 화면에 새로고침 전까지 전혀 뜨지 않는 문제가 있었다 — INSERT도 함께 구독한다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("instructors").select("*").order("id");
      if (!active) return;
      if (!error && data) setInstructors(data.map(mapInstructorRow));
      setInstructorsLoading(false);
    })();

    const channel = supabase
      .channel("instructors_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "instructors" },
        (payload) => {
          const inserted = mapInstructorRow(payload.new as Parameters<typeof mapInstructorRow>[0]);
          setInstructors((prev) => (prev.some((i) => i.id === inserted.id) ? prev : [...prev, inserted]));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "instructors" },
        (payload) => {
          const updated = mapInstructorRow(payload.new as Parameters<typeof mapInstructorRow>[0]);
          setInstructors((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Enter Cloud(Supabase) `penalties_log` 테이블에서 강사 패널티 이력을 가져온다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("penalties_log")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setPenalties(data.map(mapPenaltyRow));
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedTourIds));
  }, [bookmarkedTourIds]);

  useEffect(() => {
    window.localStorage.setItem(INSTRUCTOR_BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedInstructorIds));
  }, [bookmarkedInstructorIds]);

  // Enter Cloud(Supabase) `centers` 테이블에서 이용센터 목록을 가져온다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("centers").select("*").order("created_at");
      if (!active) return;
      if (!error && data) setCenters(data.map(mapCenterRow));
      setCentersLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Enter Cloud(Supabase) `support_tickets` 테이블에서 고객센터 접수 내역을 가져온다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setSupportTickets(data.map(mapSupportTicketRow));
      setSupportTicketsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Enter Cloud(Supabase) `tours` 테이블에서 투어 목록을 가져온다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("tours").select("*").order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setTours(data.map(mapTourRow));
      setToursLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Enter Cloud(Supabase) `bookings` 테이블에서 예약 목록을 가져온다.
  useEffect(() => {
    let active = true;
    (async () => {
      // 보안 강화 3단계(batch98): bookings 테이블은 이제 본인/담당강사/관리자만 직접 select
      // 가능하므로, 부트스트랩 조회는 컬럼별로 조건부 마스킹된 bookings_directory 뷰를 통해
      // 가져온다. (권한 없는 열람자는 결제금액/여권/항공편/취소사유/동반자명단이 null로
      // 내려온다. 같은 투어 동승자는 성별/방번호/코골이·흡연/인원수/선택옵션까지는 계속 볼 수 있다.)
      const { data, error } = await supabase
        .from("bookings_directory")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setBookings(data.map(mapBookingRow));
      setBookingsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // reviews / reports / payouts / inquiries / profiles(diver/instructor 목록)
  useEffect(() => {
    let active = true;
    (async () => {
      const [reviewsRes, reportsRes, payoutsRes, inquiriesRes, profilesRes, couponsRes] = await Promise.all([
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("reports").select("*").order("created_at", { ascending: false }),
        // 보안 강화 3단계(batch98): payouts 테이블은 이제 본인 강사/관리자만 직접 select
        // 가능하므로, 부트스트랩 조회는 payouts_directory 뷰를 통해 가져온다.
        supabase.from("payouts_directory").select("*").order("created_at", { ascending: false }),
        supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
        // 보안 강화 2단계(batch97): profiles 테이블은 이제 본인/관리자만 직접 select 가능하므로,
        // 부트스트랩 조회는 컬럼별로 조건부 마스킹된 profiles_directory 뷰를 통해서 가져온다.
        // (권한 없는 열람자는 전화번호/긴급연락처/C-Card 번호/보험정보가 null로 내려온다.
        // 같은 투어 동승자는 생년월일·C-Card 등급·로그수까지는 계속 볼 수 있다.)
        supabase.from("profiles_directory").select("*"),
        supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      ]);
      if (!active) return;
      if (!reviewsRes.error && reviewsRes.data) setReviews(reviewsRes.data.map(mapReviewRow));
      if (!reportsRes.error && reportsRes.data) setReports(reportsRes.data.map(mapReportRow));
      if (!payoutsRes.error && payoutsRes.data) setPayouts(payoutsRes.data.map(mapPayoutRow));
      if (!inquiriesRes.error && inquiriesRes.data) setInquiries(inquiriesRes.data.map(mapInquiryRow));
      if (!couponsRes.error && couponsRes.data) setCoupons(couponsRes.data.map(mapCouponRow));
      if (!profilesRes.error && profilesRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = profilesRes.data as any[];
        setDiverProfiles(rows.filter((r) => r.role === "diver").map(mapProfileRow));
        setInstructorProfiles(rows.filter((r) => r.role === "instructor").map(mapProfileRow));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // `profiles` 테이블 realtime 구독 — 회원관리/강사관리 화면(diverProfiles/instructorProfiles)이
  // 위 부트스트랩 fetch 이후로는 1회성 조회만 하고 있어서, 신규 가입자가 새로고침 전까지
  // 관리자 화면에 전혀 뜨지 않는 문제가 있었다(직접 profiles_directory 뷰는 realtime 구독
  // 대상이 될 수 없어 원본 테이블인 profiles를 구독한다 — RLS는 원본 테이블 정책을 그대로
  // 따르므로 관리자는 전체, 본인은 자신의 행 변경만 수신한다).
  useEffect(() => {
    const upsert = (setter: (updater: (prev: Profile[]) => Profile[]) => void, profile: Profile) => {
      setter((prev) =>
        prev.some((p) => p.id === profile.id) ? prev.map((p) => (p.id === profile.id ? profile : p)) : [...prev, profile],
      );
    };

    const handleChange = (payload: { new: Record<string, unknown> }) => {
      const row = payload.new as Parameters<typeof mapProfileRow>[0];
      if (!row?.id) return;
      const profile = mapProfileRow(row);
      if (profile.role === "diver") {
        upsert(setDiverProfiles, profile);
      } else if (profile.role === "instructor") {
        upsert(setInstructorProfiles, profile);
      }
    };

    const channel = supabase
      .channel("profiles_all")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, handleChange)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, handleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // `public_profiles` 뷰(이름/역할/상태만 노출되는 안전한 공개용 뷰)에서 전체 사용자를 가져온다.
  // 전화번호/C카드/비상연락처 등 민감정보는 이 뷰에 포함되지 않으므로, 리뷰 작성자 이름이나
  // 강사 공개 프로필의 정지 상태처럼 "본인/관리자/담당 강사"가 아니어도 봐야 하는 화면에서 사용한다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("public_profiles").select("*");
      if (!active) return;
      if (!error && data) {
        setPublicProfiles(
          (data as { id: string; role: string; name: string; status: string; created_at: string }[]).map((row) => ({
            id: row.id,
            role: row.role as Profile["role"],
            name: row.name,
            phone: "",
            gender: "male",
            status: row.status as Profile["status"],
            createdAt: row.created_at,
            snoring: false,
            smoking: false,
          })),
        );
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // `public_tour_booking_counts` 뷰(투어별 확정 참가자 수 합계만 노출하는 안전한 공개
  // 뷰)에서 정원 표시/초과예약 방지에 쓸 숫자를 가져온다. bookings 테이블 자체는 RLS로
  // 막혀 있어 이 값 없이는 게스트/다른 다이버에게 정원이 실제보다 적게 보인다.
  const fetchTourConfirmedCounts = async () => {
    const { data, error } = await supabase.from("public_tour_booking_counts").select("*");
    if (!error && data) {
      const map: Record<string, number> = {};
      (data as { tour_id: string; confirmed_count: number | string }[]).forEach((row) => {
        map[row.tour_id] = Number(row.confirmed_count) || 0;
      });
      setTourConfirmedCounts(map);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      if (!active) return;
      await fetchTourConfirmedCounts();
    })();
    return () => {
      active = false;
    };
  }, []);

  const getConfirmedParticipantCount = (tourId: string): number => tourConfirmedCounts[tourId] ?? 0;

  // 담당 강사/관리자가 아닌 일반 참가자가 채팅방에서 다른 참가자를 보려면, RLS로 제한된
  // bookings 배열 대신 서버에서 이미 이름을 마스킹해 내려주는 이 함수를 써야 한다. 결제 관련
  // 필드는 애초에 DB 함수가 내려주지 않으므로(민감 정보라 아예 안 보냄) 0/빈값으로 채워
  // Booking 타입만 맞춰준다 — 참가자 화면(이름/성별/코골이/방번호)에서만 쓰는 용도다.
  const fetchMaskedTourParticipants = async (tourId: string): Promise<Booking[]> => {
    const { data, error } = await supabase.rpc("get_tour_participants_masked", { p_tour_id: tourId });
    if (error || !data) {
      console.error("[fetchMaskedTourParticipants] 참가자 목록 조회 실패:", error);
      return [];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any[]).map((row) => ({
      id: row.id,
      tourId,
      diverId: row.diver_id,
      diverName: row.diver_name_masked,
      basePrice: 0,
      optionsCost: 0,
      selectedOptions: Array.isArray(row.selected_options) ? row.selected_options : [],
      platformFee: 0,
      totalPaid: 0,
      onSiteBalance: 0,
      paymentMethod: "card",
      gender: row.gender,
      snoring: !!row.snoring,
      smoking: !!row.smoking,
      drinking: !!row.drinking,
      roomNote: row.room_note ?? undefined,
      roomNo: row.room_no ?? undefined,
      depositStatus: "paid",
      status: row.status,
      createdAt: "",
      participantCount: row.participant_count != null ? Number(row.participant_count) : 1,
      companionNames: undefined,
      companions: [],
    }));
  };

  // `chat_messages` 테이블 실시간 구독 (투어 그룹채팅)
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!active) return;
      if (!error && data) setChatMessages(data.map(mapChatMessageRow));
    })();

    const channel = supabase
      .channel("chat_messages_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setChatMessages((prev) => [...prev, mapChatMessageRow(payload.new)]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // `arbitration_messages` 테이블 실시간 구독 (강사↔최고관리자 비밀 중재방)
  // 예전에는 이 state가 로컬 메모리에만 쌓여서 새로고침하거나 상대방이 다른 세션에서
  // 접속하면 대화가 전혀 보이지 않는 문제가 있었다(강사와 관리자가 실제로 대화 불가).
  // chat_messages와 동일한 fetch + realtime 패턴으로 바꿔 실제로 영속화되도록 한다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("arbitration_messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!active) return;
      if (!error && data) setArbitrationMessages(data.map(mapArbitrationMessageRow));
    })();

    const channel = supabase
      .channel("arbitration_messages_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "arbitration_messages" },
        (payload) => {
          setArbitrationMessages((prev) => [...prev, mapArbitrationMessageRow(payload.new)]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // `instructor_admin_notes` 테이블 실시간 구독 (관리자 ↔ 강사 전용 비공개 안내 메모).
  // arbitration_messages와 동일한 fetch + realtime 패턴 — 새로고침/다른 세션에서도 대화가
  // 그대로 보이도록 서버에서 실시간으로 반영한다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("instructor_admin_notes")
        .select("*")
        .order("created_at", { ascending: true });
      if (!active) return;
      if (!error && data) setInstructorAdminNotes(data.map(mapInstructorAdminNoteRow));
    })();

    const channel = supabase
      .channel("instructor_admin_notes_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "instructor_admin_notes" },
        (payload) => {
          setInstructorAdminNotes((prev) => [...prev, mapInstructorAdminNoteRow(payload.new)]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // `tour_cancellation_claims` 테이블 실시간 구독 (강사 귀책 아닌 사유의 투어 취소 증빙 검토 큐).
  // instructor_admin_notes와 동일한 fetch + realtime 패턴 — 관리자 검토 큐와 강사 본인 화면
  // 양쪽에서 새로고침 없이 실시간으로 반영되어야 한다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("tour_cancellation_claims")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setTourCancellationClaims(data.map(mapTourCancellationClaimRow));
    })();

    const channel = supabase
      .channel("tour_cancellation_claims_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tour_cancellation_claims" },
        (payload) => {
          setTourCancellationClaims((prev) =>
            prev.some((c) => c.id === payload.new.id)
              ? prev
              : [mapTourCancellationClaimRow(payload.new), ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tour_cancellation_claims" },
        (payload) => {
          const updated = mapTourCancellationClaimRow(payload.new);
          setTourCancellationClaims((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // `instructor_notifications` 테이블 실시간 구독.
  // 예전에는 이 state가 useState([])로 시작해서 브라우저 세션 로컬 메모리에만 쌓였다 —
  // 새로고침하면 전부 사라지고, 다른 세션(다른 관리자/강사 기기)에서 발생한 이벤트는
  // 절대 보이지 않았다(신규예약/강제환불/최소인원 이벤트 등 강사·관리자 알림 전체에 해당).
  // arbitration_messages와 동일한 fetch + realtime 패턴으로 바꿔 실제로 영속화한다.
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("instructor_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!active) return;
      if (!error && data) setInstructorNotifications(data.map(mapInstructorNotificationRow));
    })();

    const channel = supabase
      .channel("instructor_notifications_all")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "instructor_notifications" },
        (payload) => {
          setInstructorNotifications((prev) => [mapInstructorNotificationRow(payload.new), ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "instructor_notifications" },
        (payload) => {
          const updated = mapInstructorNotificationRow(payload.new);
          setInstructorNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * 최소 인원 자동 마감 평가 — 실제 서버 크론잡이 없는 인메모리/데모 아키텍처이므로,
   * tours/bookings가 로드되거나 갱신될 때마다 "투어 출발일 30일 전을 지났고 아직
   * 처리되지 않은" 투어를 찾아 즉시 평가한다(클라이언트 로드 시점 기준 시뮬레이션).
   * - 확정 예약 수 >= minParticipants: 모집만 마감(status: closed), 투어는 그대로 진행. 결정 불필요.
   * - 미달: 자동으로 진행/취소를 결정하지 않고 모집만 마감한 뒤, underMinDecisionPending을 true로
   *   표시해 강사에게 결정을 요청한다. 실제 진행/취소 확정은 resolveUnderMinDecision()에서 처리한다.
   */
  useEffect(() => {
    if (toursLoading || bookingsLoading) return;

    const targets = tours.filter((t) => shouldEvaluateAutoClose(t));
    if (targets.length === 0) return;

    targets.forEach((tour) => {
      const confirmedBookings = bookings.filter((b) => b.tourId === tour.id && b.status === "confirmed");
      const meetsMinimum = confirmedBookings.length >= tour.minParticipants;

      if (meetsMinimum) {
        setTours((prev) =>
          prev.map((t) => (t.id === tour.id ? { ...t, status: "closed", autoCloseProcessed: true } : t)),
        );
        // 주의: 이 useEffect는 다이버든 강사든 누구 화면이 열려있어도 트리거될 수 있어서,
        // "본인 소유 투어만 수정 가능"이라는 일반 RLS 정책으로는 이 쓰기가 막힌다(RLS 보안
        // 강화 1단계 batch96 참고). 대신 상태 전이 조건을 서버에서 다시 검증하는
        // apply_tour_auto_close() RPC를 호출한다.
        supabase
          .rpc("apply_tour_auto_close", { p_tour_id: tour.id, p_meets_minimum: true })
          .then(({ error }) => {
            if (error) {
              console.error("[autoCloseEvaluation] tours 업데이트 실패(meetsMinimum):", error);
            }
          });
        return;
      }

      setTours((prev) =>
        prev.map((t) =>
          t.id === tour.id
            ? { ...t, status: "closed", autoCloseProcessed: true, underMinDecisionPending: true }
            : t,
        ),
      );
      // 위와 동일한 이유로 apply_tour_auto_close() RPC를 호출한다.
      supabase
        .rpc("apply_tour_auto_close", { p_tour_id: tour.id, p_meets_minimum: false })
        .then(({ error }) => {
          if (error) {
            console.error("[autoCloseEvaluation] tours 업데이트 실패(underMin):", error);
          }
        });

      void persistInstructorNotification({
        instructorId: tour.instructorId,
        tourId: tour.id,
        tourTitle: tour.title,
        createdAt: new Date().toISOString(),
        type: "min_participants_decision_needed",
      });
      notifyInstructorPush(
        tour.instructorId,
        "최소 인원 미달 - 결정이 필요합니다",
        `${tour.title} 투어가 최소 인원 미달입니다. 그대로 진행할지 취소할지 강사 콘솔에서 선택해주세요.`,
        "/instructor",
      );
    });
  }, [tours, bookings, toursLoading, bookingsLoading]);

  /**
   * 강사 — 최소 인원 미달로 결정 대기 중인 투어에 대해 "그대로 진행" 또는 "투어 취소(전액환불)"를 확정한다.
   * "취소"를 선택하면 해당 투어의 확정 예약을 모두 취소·전액환불하고 정산 예정 지급을 보류한다.
   */
  const resolveUnderMinDecision = async (
    tourId: string,
    decision: UnderMinParticipantsPolicy,
  ): Promise<void> => {
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    setTours((prev) =>
      prev.map((t) =>
        t.id === tourId
          ? {
              ...t,
              underMinPolicy: decision,
              underMinDecisionPending: false,
              isConfirmed: decision === "cancel" ? false : t.isConfirmed,
              // 취소 결정 시 모집 상태도 확실히 "마감"으로 고정한다 — 자동 마감 로직이 이미 처리한 상태이지만,
              // 실제 예약 가능 여부(TourDetail)와 홈/검색 노출이 이 값에 의존하므로 이중으로 보장한다.
              status: decision === "cancel" ? "closed" : t.status,
            }
          : t,
      ),
    );
    {
      const { error } = await supabase
        .from("tours")
        .update({
          under_min_policy: decision,
          under_min_decision_pending: false,
          ...(decision === "cancel" ? { is_confirmed: false, status: "closed" } : {}),
        })
        .eq("id", tourId);
      // 이 저장이 실패하면 새로고침 시 결정 대기 패널이 다시 나타나는 문제가 재현되므로,
      // 원인 파악을 위해 반드시 콘솔에 에러를 남긴다.
      if (error) {
        // eslint-disable-next-line no-console
        console.error("[resolveUnderMinDecision] tours 업데이트 실패:", error);
      }
    }

    const confirmedBookings = bookings.filter((b) => b.tourId === tourId && b.status === "confirmed");

    if (decision === "cancel") {
      const cancelRequestedAt = new Date().toISOString();
      confirmedBookings.forEach((booking) => {
        const refundRate = 1.0; // 출발 미확정 취소이므로 기존 규정상 전액 환불
        const refundAmount = computeRefundAmount(booking.totalPaid, refundRate);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? {
                  ...b,
                  status: "cancelled",
                  cancelReason: MIN_PARTICIPANTS_AUTO_CANCEL_REASON,
                  refundRate,
                  refundAmount,
                  cancelRequestedAt,
                }
              : b,
          ),
        );
        void supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancel_reason: MIN_PARTICIPANTS_AUTO_CANCEL_REASON,
            refund_rate: refundRate,
            refund_amount: refundAmount,
            cancel_requested_at: cancelRequestedAt,
          })
          .eq("id", booking.id);

        setPayouts((prev) =>
          prev.map((p) => (p.bookingId === booking.id && p.status !== "released" ? { ...p, status: "cancelled" } : p)),
        );
        void supabase
          .from("payouts")
          .update({ status: "cancelled" })
          .eq("booking_id", booking.id)
          .neq("status", "released");

        void persistInstructorNotification({
          instructorId: tour.instructorId,
          tourId: tour.id,
          bookingId: booking.id,
          tourTitle: tour.title,
          diverName: maskName(booking.diverName),
          selectedOptionNames: booking.selectedOptions.map((o) => o.name),
          settlementAmount: 0,
          createdAt: cancelRequestedAt,
          type: "min_participants_cancelled",
        });
        notifyDiverPush(
          booking.diverId,
          "투어가 취소되었습니다",
          `${tour.title} 투어가 최소 인원 미달로 취소되어 전액 환불됩니다.`,
          "/mypage",
        );
      });
    } else {
      // "그대로 진행" — 투어 단위로 강사에게 책임 리마인드 알림을 1건 발행하고, 확정 다이버들에게도 알린다.
      void persistInstructorNotification({
        instructorId: tour.instructorId,
        tourId: tour.id,
        tourTitle: tour.title,
        createdAt: new Date().toISOString(),
        type: "min_participants_proceed",
      });
      confirmedBookings.forEach((booking) => {
        notifyDiverPush(
          booking.diverId,
          "투어가 예정대로 진행됩니다",
          `${tour.title} 투어가 최소 인원 미달이지만 예정대로 진행됩니다.`,
          `/chat/${tourId}`,
        );
      });
    }
    // "취소" 결정이면 확정 인원이 줄어드니 정원 카운트를 다시 맞춰준다("진행" 결정은 인원이
    // 그대로라 변화 없지만, 매번 분기하는 것보다 단순하게 항상 다시 조회한다).
    void fetchTourConfirmedCounts();
  };

  /**
   * 관리자가 투어를 강제 정지시킬 때, 이미 확정된 예약을 일괄 전액환불 취소 처리한다.
   * (관리자 귀책/운영상 사유의 강제 마감이므로 다이버에게 불이익이 없도록 항상 100% 환불)
   * 반환값: 취소 처리된 예약 건수.
   */
  const forceCancelTourBookings = async (tourId: string): Promise<number> => {
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return 0;

    const confirmedBookings = bookings.filter((b) => b.tourId === tourId && b.status === "confirmed");
    const cancelRequestedAt = new Date().toISOString();

    confirmedBookings.forEach((booking) => {
      const refundRate = 1.0;
      const refundAmount = computeRefundAmount(booking.totalPaid, refundRate);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                status: "cancelled",
                cancelReason: ADMIN_FORCED_CLOSURE_REASON,
                refundRate,
                refundAmount,
                cancelRequestedAt,
              }
            : b,
        ),
      );
      void supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancel_reason: ADMIN_FORCED_CLOSURE_REASON,
          refund_rate: refundRate,
          refund_amount: refundAmount,
          cancel_requested_at: cancelRequestedAt,
        })
        .eq("id", booking.id);

      setPayouts((prev) =>
        prev.map((p) => (p.bookingId === booking.id && p.status !== "released" ? { ...p, status: "cancelled" } : p)),
      );
      void supabase
        .from("payouts")
        .update({ status: "cancelled" })
        .eq("booking_id", booking.id)
        .neq("status", "released");

      notifyDiverPush(
        booking.diverId,
        "투어가 취소되었습니다",
        `${tour.title} 투어가 운영 사정으로 취소되어 전액 환불됩니다.`,
        "/mypage",
      );
    });

    void fetchTourConfirmedCounts();
    return confirmedBookings.length;
  };

  /**
   * 강사 — 확정 예약이 있는 투어를 강사 본인 사정(예: 샵 중복예약)으로 취소하면서 증빙을 제출한다.
   * 확정 예약은 즉시 전액환불 처리되고 투어는 마감(closed)되며, 연결된 정산은 일반 취소와 동일하게
   * cancelled 처리된다. 이 함수 자체는 정산을 되살리지 않는다 — 관리자가 증빙을 검토해 승인하면
   * (reviewTourCancellationClaim) 그때 1차 정산(80%)만 되살아난다.
   */
  const cancelTourByInstructor = async (
    tourId: string,
    reason: string,
    evidenceFileUrls: string[],
  ): Promise<TourCancellationClaim> => {
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) throw new Error("투어 정보를 찾을 수 없습니다.");

    const confirmedBookings = bookings.filter((b) => b.tourId === tourId && b.status === "confirmed");
    const cancelRequestedAt = new Date().toISOString();
    const cancelReason = `강사 사정으로 인한 투어 취소(증빙 제출, 관리자 검토 대기): ${reason}`;

    confirmedBookings.forEach((booking) => {
      const refundRate = 1.0;
      const refundAmount = computeRefundAmount(booking.totalPaid, refundRate);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: "cancelled", cancelReason, refundRate, refundAmount, cancelRequestedAt }
            : b,
        ),
      );
      void supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancel_reason: cancelReason,
          refund_rate: refundRate,
          refund_amount: refundAmount,
          cancel_requested_at: cancelRequestedAt,
        })
        .eq("id", booking.id);

      setPayouts((prev) =>
        prev.map((p) => (p.bookingId === booking.id && p.status !== "released" ? { ...p, status: "cancelled" } : p)),
      );
      void supabase
        .from("payouts")
        .update({ status: "cancelled" })
        .eq("booking_id", booking.id)
        .neq("status", "released");

      notifyDiverPush(
        booking.diverId,
        "투어가 취소되었습니다",
        `${tour.title} 투어가 강사 사정으로 취소되어 전액 환불됩니다.`,
        "/mypage",
      );
    });

    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, status: "closed" } : t)));
    await supabase.from("tours").update({ status: "closed" }).eq("id", tourId);

    const affectedBookingIds = confirmedBookings.map((b) => b.id);
    const { data, error } = await supabase
      .from("tour_cancellation_claims")
      .insert({
        tour_id: tourId,
        instructor_id: tour.instructorId,
        reason,
        evidence_file_urls: evidenceFileUrls,
        affected_booking_ids: affectedBookingIds,
      })
      .select()
      .single();

    if (error || !data) {
      console.error("[cancelTourByInstructor] tour_cancellation_claims insert 실패:", error);
      throw new Error(
        error?.message ? `취소 접수에 실패했습니다: ${error.message}` : "취소 접수에 실패했습니다.",
      );
    }

    const claim = mapTourCancellationClaimRow(data);
    setTourCancellationClaims((prev) => [claim, ...prev]);

    void fetchTourConfirmedCounts();

    return claim;
  };

  const addTour = async (input: NewTourInput): Promise<Tour> => {
    const { data, error } = await supabase
      .from("tours")
      .insert({
        instructor_id: input.instructorId,
        center_id: input.centerId,
        title: input.title,
        country: input.country,
        site: input.site,
        activity_types: input.activityTypes,
        min_log_count: input.minLogCount ?? null,
        tags: input.tags ?? [],
        certification_level: input.certificationLevel,
        main_image_url: input.mainImageUrl,
        gallery_urls: input.galleryUrls,
        start_date: input.startDate,
        end_date: input.endDate,
        recruitment_deadline: input.recruitmentDeadline,
        base_price: input.basePrice,
        water_temp_c: input.waterTempC,
        visibility_m: input.visibilityM,
        max_participants: input.maxParticipants,
        min_participants: input.minParticipants,
        under_min_policy: input.underMinPolicy,
        description: input.description,
        inclusions: input.inclusions,
        exclusions: input.exclusions,
        prep_notes: input.prepNotes,
        custom_options: input.customOptions,
        pledge_signer_name: input.pledgeSignerName,
        pledge_agreed_at: input.pledgeAgreedAt,
        pledge_signature_data_url: input.pledgeSignatureDataUrl,
        meeting_point: input.meetingPoint,
        meeting_time: input.meetingTime,
        itinerary_days: input.itineraryDays,
        flight_info: input.flightInfo ?? null,
      })
      .select()
      .single();

    if (!error && data) {
      const tour = mapTourRow(data);
      setTours((prev) => [tour, ...prev]);
      return tour;
    }

    // 저장 실패 시 로컬에만 존재하는 "가짜" 투어를 만들지 않는다 — 강사 화면에는 보이지만
    // DB에 저장되지 않아 다른 회원/비회원에게는 영원히 노출되지 않는 유령 투어 버그의 원인이었다.
    // 대신 에러를 그대로 던져 호출부(TourCreateForm)에서 실패를 사용자에게 알리도록 한다.
    throw error ?? new Error("투어 등록에 실패했습니다.");
  };

  /** 강사 — 참가자 대시보드/그룹채팅 상단에 고정되는 공지사항을 갱신한다. */
  const updateTourNotice = async (tourId: string, notice: string) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, instructorNotice: notice } : t)));
    await supabase.from("tours").update({ instructor_notice: notice }).eq("id", tourId);
  };

  /** 강사 — 참가자 대시보드 [일정] 탭의 일자별 일정을 갱신한다. */
  const updateTourItinerary = async (tourId: string, days: TourItineraryDay[]) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, itineraryDays: days } : t)));
    await supabase.from("tours").update({ itinerary_days: days }).eq("id", tourId);
  };

  /** 강사 — 집합 장소/시간을 갱신한다(투어 생성 시 입력한 값을 이후에도 수정/저장할 수 있도록). */
  const updateTourMeetingInfo = async (tourId: string, meetingPoint: string, meetingTime: string) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, meetingPoint, meetingTime } : t)));
    await supabase.from("tours").update({ meeting_point: meetingPoint, meeting_time: meetingTime }).eq("id", tourId);
  };

  /**
   * 강사 본인 — 이미 등록한 투어의 세부 정보를 수정한다. patch에 담긴 필드만 갱신하며,
   * 예약이 있는 투어는 가격/날짜/인원 같은 핵심 조건을 호출부(TourEditForm)에서 아예
   * 잠가두고 항상 기존 값을 그대로 다시 보내도록 되어있다.
   */
  const updateTour = async (tourId: string, patch: UpdateTourInput) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.centerId !== undefined) dbPatch.center_id = patch.centerId;
    if (patch.title !== undefined) dbPatch.title = patch.title;
    if (patch.country !== undefined) dbPatch.country = patch.country;
    if (patch.site !== undefined) dbPatch.site = patch.site;
    if (patch.activityTypes !== undefined) dbPatch.activity_types = patch.activityTypes;
    if (patch.tags !== undefined) dbPatch.tags = patch.tags;
    if (patch.minLogCount !== undefined) dbPatch.min_log_count = patch.minLogCount ?? null;
    if (patch.certificationLevel !== undefined) dbPatch.certification_level = patch.certificationLevel;
    if (patch.mainImageUrl !== undefined) dbPatch.main_image_url = patch.mainImageUrl;
    if (patch.galleryUrls !== undefined) dbPatch.gallery_urls = patch.galleryUrls;
    if (patch.startDate !== undefined) dbPatch.start_date = patch.startDate;
    if (patch.endDate !== undefined) dbPatch.end_date = patch.endDate;
    if (patch.recruitmentDeadline !== undefined) dbPatch.recruitment_deadline = patch.recruitmentDeadline;
    if (patch.basePrice !== undefined) dbPatch.base_price = patch.basePrice;
    if (patch.maxParticipants !== undefined) dbPatch.max_participants = patch.maxParticipants;
    if (patch.minParticipants !== undefined) dbPatch.min_participants = patch.minParticipants;
    if (patch.description !== undefined) dbPatch.description = patch.description;
    if (patch.inclusions !== undefined) dbPatch.inclusions = patch.inclusions;
    if (patch.exclusions !== undefined) dbPatch.exclusions = patch.exclusions;
    if (patch.prepNotes !== undefined) dbPatch.prep_notes = patch.prepNotes;
    if (patch.customOptions !== undefined) dbPatch.custom_options = patch.customOptions;
    if (patch.meetingPoint !== undefined) dbPatch.meeting_point = patch.meetingPoint;
    if (patch.meetingTime !== undefined) dbPatch.meeting_time = patch.meetingTime;
    if (patch.itineraryDays !== undefined) dbPatch.itinerary_days = patch.itineraryDays;
    if (patch.flightInfo !== undefined) dbPatch.flight_info = patch.flightInfo ?? null;

    const { error } = await supabase.from("tours").update(dbPatch as never).eq("id", tourId);
    if (error) throw error;

    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, ...patch } : t)));
  };

  /**
   * 관리자 — 투어를 정지(즉시 예약 차단 + 검색 노출 제거) 또는 보류(임시 비공개) 처리한다.
   * adminStatus를 undefined로 넘기면 정상 상태로 복귀(재개)시킨다.
   */
  const setTourAdminStatus = async (tourId: string, adminStatus: Tour["adminStatus"]) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, adminStatus } : t)));
    await supabase.from("tours").update({ admin_status: adminStatus ?? null }).eq("id", tourId);
  };

  /** 강사 본인 — 모집중인 투어를 수동으로 마감(모집 종료) 처리한다. */
  const closeTourRecruiting = async (tourId: string) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, status: "closed" } : t)));
    await supabase.from("tours").update({ status: "closed" }).eq("id", tourId);
  };

  /** 관리자 — 투어를 완전히 삭제한다. 예약 기록을 보존해야 하는 투어는 정지 처리를 권장한다. */
  const deleteTour = async (tourId: string) => {
    setTours((prev) => prev.filter((t) => t.id !== tourId));
    await supabase.from("tours").delete().eq("id", tourId);
  };

  /** 다이버 본인 — 참가자 대시보드 [더보기] 탭에서 본인 항공/여권 정보를 등록한다. */
  const updateBookingTravelInfo = async (
    bookingId: string,
    input: { flightInfo?: string; passportInfo?: string },
  ) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, flightInfo: input.flightInfo ?? b.flightInfo, passportInfo: input.passportInfo ?? b.passportInfo }
          : b,
      ),
    );
    await supabase
      .from("bookings")
      .update({ flight_info: input.flightInfo, passport_info: input.passportInfo })
      .eq("id", bookingId);
  };

  /** 다이버 본인 — 마이페이지에서 C-Card/로그수/비상연락처/보험 정보를 갱신한다. */
  const updateDiverProfile = async (
    diverId: string,
    updates: {
      birthDate?: string;
      cCardAgency?: string;
      cCardNumber?: string;
      cCardPhotoPath?: string;
      logCount?: number;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      insuranceInfo?: string;
    },
  ): Promise<void> => {
    // 실패 시 되돌릴 수 있도록 변경 전 값을 기억해둔다.
    let previous: Profile | undefined;
    setDiverProfiles((prev) => {
      previous = prev.find((p) => p.id === diverId);
      return prev.map((p) => (p.id === diverId ? { ...p, ...updates } : p));
    });
    const { error } = await supabase
      .from("profiles")
      .update({
        ...(updates.birthDate !== undefined ? { birth_date: updates.birthDate } : {}),
        ...(updates.cCardAgency !== undefined ? { c_card_agency: updates.cCardAgency } : {}),
        ...(updates.cCardNumber !== undefined ? { c_card_number: updates.cCardNumber } : {}),
        ...(updates.cCardPhotoPath !== undefined ? { c_card_photo_path: updates.cCardPhotoPath } : {}),
        ...(updates.logCount !== undefined ? { log_count: updates.logCount } : {}),
        ...(updates.emergencyContactName !== undefined
          ? { emergency_contact_name: updates.emergencyContactName }
          : {}),
        ...(updates.emergencyContactPhone !== undefined
          ? { emergency_contact_phone: updates.emergencyContactPhone }
          : {}),
        ...(updates.insuranceInfo !== undefined ? { insurance_info: updates.insuranceInfo } : {}),
      })
      .eq("id", diverId);
    if (error) {
      console.error("[updateDiverProfile] profiles 업데이트 실패:", error);
      // 예전에는 여기서 에러를 삼키기만(console.error) 하고 호출부에는 알리지 않았다 — 그래서
      // DB 저장이 실패해도 화면에는 낙관적으로 반영된 값이 그대로 남아있고 "저장되었습니다"
      // 토스트까지 떠서, 사용자는 저장이 안 됐다는 사실을 전혀 알 수 없었다(다음 접속 때
      // 서버의 진짜 값(기존 빈 값)으로 덮어써지면서 "분명 입력했는데 사라졌다"는 문제로
      // 이어졌다). 낙관적으로 반영했던 값을 되돌리고, 에러를 던져 호출부가 실패를
      // 사용자에게 보여줄 수 있게 한다.
      if (previous) {
        const rolledBack = previous;
        setDiverProfiles((prev) => prev.map((p) => (p.id === diverId ? rolledBack : p)));
      }
      throw new Error(
        error.message ? `정보 저장에 실패했습니다: ${error.message}` : "정보 저장에 실패했습니다.",
      );
    }
  };

  const addBooking = async (input: NewBookingInput): Promise<Booking> => {
    // 로그인한 다이버가 같은 투어에 중복으로 예약하는 것을 막는다 (취소된 예약은 제외 — 취소 후 재예약은 허용).
    if (input.diverId) {
      const duplicate = bookings.some(
        (b) => b.tourId === input.tourId && b.diverId === input.diverId && b.status !== "cancelled",
      );
      if (duplicate) {
        throw new Error("이미 이 투어에 예약하셨습니다. 중복으로 예약할 수 없습니다.");
      }
    }
    // 잔여 정원을 초과해서는 예약할 수 없다. (참고: 여기서의 검사는 public_tour_booking_counts
    // 뷰에서 가져온 "이 투어의 전체 확정 인원 수"를 기준으로 한다 — bookings 배열은 RLS 때문에
    // 본인/담당 강사/관리자 예약만 보여서 그걸로 계산하면 다른 사람 예약을 놓치게 된다.
    // 그리고 이 검사도 결국 클라이언트가 마지막으로 받은 값을 기준으로 하므로, 동시에 여러 명이
    // 마지막 한 자리를 두고 경합하는 극단적인 케이스까지 완전히 막지는 못한다 — 완전한 방지는
    // DB 트랜잭션/제약조건이 필요하다.)
    const requestedCount = Math.max(1, input.participantCount ?? 1);
    const targetTour = tours.find((t) => t.id === input.tourId);
    if (targetTour) {
      const confirmedCount = getConfirmedParticipantCount(input.tourId);
      if (confirmedCount + requestedCount > targetTour.maxParticipants) {
        const remaining = Math.max(0, targetTour.maxParticipants - confirmedCount);
        throw new Error(
          remaining > 0
            ? `잔여 정원은 ${remaining}명입니다. 인원 수를 줄여주세요.`
            : "모집 정원이 마감되어 더 이상 예약할 수 없습니다.",
        );
      }
    }
    // bookings RLS 정책(bookings_insert_self: diver_id = auth.uid())상 실제 로그인 사용자의
    // profiles.id가 아니면 어차피 insert가 항상 거부된다. 예전에는 여기서 로컬 전용 가짜
    // "guest-diver-xxxx" id를 만들어 계속 진행시켰는데, 그러면 결제 화면에서 알 수 없는
    // "new row violates row-level security policy" 원본 DB 에러를 그대로 보게 되는 문제가
    // 있었다 — 호출부(Checkout.tsx 등)에서 로그인 여부를 먼저 확인하도록 하고, 여기서는
    // 명확한 에러로 막아 원인을 바로 알 수 있게 한다.
    if (!input.diverId) {
      throw new Error("로그인이 필요합니다. 로그인 후 다시 예약해주세요.");
    }
    const diverId = input.diverId;
    // companions(동반자별 상세 정보)가 있으면 그 이름들을 이어붙여 companion_names를 자동으로
    // 채운다 — 참가자 목록 등 기존 화면은 companion_names 텍스트만 읽어도 계속 동작하고,
    // 각 동반자의 성별/코골이/흡연/음주 등 상세 정보가 필요한 화면은 companions 배열을 쓴다.
    const normalizedCompanions = (input.companions ?? []).map((c, idx) => ({
      ...c,
      name: c.name?.trim() || `동반자 ${idx + 1}`,
    }));
    const derivedCompanionNames =
      normalizedCompanions.length > 0
        ? normalizedCompanions.map((c) => c.name).join(", ")
        : (input.companionNames ?? null);
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        tour_id: input.tourId,
        diver_id: diverId,
        diver_name: input.diverName,
        base_price: input.basePrice,
        options_cost: input.optionsCost,
        selected_options: input.selectedOptions,
        platform_fee: input.platformFee,
        total_paid: input.totalPaid,
        on_site_balance: input.onSiteBalance,
        coupon_code: input.couponCode ?? null,
        discount_amount: input.discountAmount ?? null,
        payment_method: input.paymentMethod,
        gender: input.gender,
        snoring: input.snoring,
        smoking: input.smoking,
        drinking: input.drinking,
        room_note: input.roomNote ?? null,
        participant_count: requestedCount,
        companion_names: derivedCompanionNames,
        companions: normalizedCompanions,
        deposit_status: "paid",
        status: "confirmed",
      })
      .select()
      .single();

    if (error || !data) {
      // 예약 INSERT가 실패했는데도 로컬에만 존재하는 가짜 예약 객체로 조용히
      // 넘어가면, 결제자는 "결제 및 예약 완료" 화면을 보지만 실제로는 DB에
      // 예약이 전혀 남지 않는 심각한 사고로 이어진다(정원에도 반영 안 됨,
      // 강사도 확인 불가). 반드시 에러를 던져서 Checkout.tsx의 handlePay가
      // 결제 실패로 처리하고 사용자에게 알리도록 한다.
      console.error("[addBooking] bookings insert 실패:", error);
      throw new Error(
        error?.message
          ? `예약 저장에 실패했습니다: ${error.message}`
          : "예약 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const booking: Booking = mapBookingRow(data);
    setBookings((prev) => [booking, ...prev]);
    // 방금 예약한 인원만큼 정원 카운트를 즉시 반영한다(낙관적 갱신) — 이어서 뷰를 다시
    // 조회해 실제 DB 값과 어긋나지 않는지도 함께 맞춘다.
    setTourConfirmedCounts((prev) => ({
      ...prev,
      [input.tourId]: (prev[input.tourId] ?? 0) + requestedCount,
    }));
    void fetchTourConfirmedCounts();

    // targetTour(이 함수 앞부분 정원 체크에서 이미 조회에 성공한 투어)를 그대로
    // 재사용한다. 여기서 tours.find()를 다시 호출하면 드물게(정확한 원인은 미상이나,
    // 정원을 꽉 채우는 예약처럼 투어 상태가 막 바뀌는 타이밍과 관련된 것으로 추정)
    // 방금 찾았던 투어를 다시 찾지 못해 정산(payout/invoice) 생성과 강사 실시간 알림
    // 발송이 통째로 에러 없이 조용히 스킵되는 문제가 실사용 중 확인됨
    // (QA 라이브 테스트: 5인 단체예약 17,600,000원 결제 후 payouts/invoices 미생성 확인).
    const tour = targetTour;
    if (tour) {
      const { error: settlementError } = await supabase.rpc("create_booking_settlement", {
        p_booking_id: booking.id,
      });
      if (settlementError) {
        console.error("[addBooking] 정산(payout/invoice) 생성 RPC 실패 (예약은 정상 처리됨):", settlementError);
      }

      // 트랜잭션이 확정되는 즉시(=예약 생성 시점) 담당 강사에게 실시간 알림을 발행한다.
      void persistInstructorNotification({
        instructorId: tour.instructorId,
        tourId: tour.id,
        bookingId: booking.id,
        tourTitle: tour.title,
        diverName: maskName(input.diverName),
        selectedOptionNames: input.selectedOptions.map((o) => o.name),
        settlementAmount: input.basePrice + input.optionsCost,
        createdAt: new Date().toISOString(),
        type: "new_booking",
      });
      notifyInstructorPush(
        tour.instructorId,
        "신규 투어 예약 완료",
        `${maskName(input.diverName)} 다이버가 ${tour.title} 투어를 예약했습니다.`,
        "/instructor",
      );
    }

    return booking;
  };

  const addInstructorSignup = async (input: NewInstructorSignupInput): Promise<InstructorProfile> => {
    // 실 Auth 세션이 있다면 profiles row가 이미 signUp 흐름에서 생성되므로, 여기서는 프로필ID를 조회한다.
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData.session?.user.id;
    const profileId = authUserId ?? nextId("ins");

    if (authUserId) {
      await supabase
        .from("profiles")
        .update({
          name: input.name,
          phone: input.phone,
          gender: input.gender,
          pledge_settlement_agreed: input.settlementPledgeAgreed ?? false,
          pledge_settlement_agreed_at: input.settlementPledgeAgreed ? new Date().toISOString() : null,
        })
        .eq("id", authUserId);
    }

    const profile: Profile = {
      id: profileId,
      role: "instructor",
      name: input.name,
      phone: input.phone,
      gender: input.gender,
      status: "active",
      createdAt: new Date().toISOString(),
      // profiles insert 자체는 InstructorSignupForm에서 먼저 끝났지만, 여기서 만드는
      // 로컬 낙관적 객체에도 같이 넣어둬야 새로고침 없이 바로 관리자 승인 큐에서
      // 계좌/신분증 정보를 볼 수 있다.
      bankName: input.bankName,
      accountHolder: input.accountHolder,
      accountNumber: input.accountNumber,
      bankbookFileName: input.bankbookFileName,
      bankbookPath: input.bankbookPath,
      idDocumentPath: input.idDocumentPath,
    };
    setInstructorProfiles((prev) => [...prev, profile]);

    const instructorId = nextId("inst");
    const pledgeSignedAt = input.pledgeSigned ? new Date().toISOString() : undefined;
    const instructorProfile: InstructorProfile = {
      id: instructorId,
      profileId,
      createdAt: new Date().toISOString(),
      name: input.name,
      licenseFileNames: input.licenseFileNames,
      licenseFilePaths: input.licenseFilePaths,
      signatureDataUrl: input.signatureDataUrl,
      verified: false,
      pledgeSigned: input.pledgeSigned ?? false,
      pledgeSignedAt,
      pledgeVersion: input.pledgeSigned ? "v1" : undefined,
      businessType: input.businessType,
      totalLogs: 0,
      experienceYears: 0,
      completionRate: 0,
      rating: 0,
      penaltyCount: 0,
      bio: input.bio,
    };

    // Enter Cloud(Supabase)에 신규 강사 신청 기록 (관리자 인증 대기 상태)
    // 주의: 예전에는 이 insert의 결과를 확인하지 않아서, id 충돌 등으로 실패해도 아무
    // 에러 없이 넘어갔다 — profiles에는 role="instructor"로 로그인은 되지만 정작
    // instructors 행이 없는 "유령 계정"이 만들어져, 본인은 마이페이지가 빈 화면으로
    // 나와 로그아웃도 못 하고, 관리자 승인 큐에도 뜨지 않는 문제로 이어졌다.
    const { error: instructorInsertError } = await supabase.from("instructors").insert({
      id: instructorId,
      profile_id: profileId,
      name: input.name,
      license_file_names: input.licenseFileNames,
      license_file_paths: input.licenseFilePaths,
      signature_data_url: input.signatureDataUrl,
      verified_status: false,
      pledge_signed: input.pledgeSigned ?? false,
      pledge_signed_at: pledgeSignedAt,
      pledge_version: input.pledgeSigned ? "v1" : undefined,
      business_type: input.businessType ?? null,
      bio: input.bio,
    });
    if (instructorInsertError) {
      throw new Error(
        `강사 프로필 생성에 실패했습니다: ${instructorInsertError.message}`,
      );
    }

    setInstructors((prev) => [...prev, instructorProfile]);
    return instructorProfile;
  };

  const setInstructorVerified = async (instructorId: string, verified: boolean, verifiedBy?: string): Promise<void> => {
    const verifiedAt = verified ? new Date().toISOString() : undefined;
    await supabase
      .from("instructors")
      .update({
        verified_status: verified,
        verified_at: verifiedAt,
        verified_by: verifiedBy,
        // 승인하면 예전에 반려된 이력이 있어도 지워서 깨끗한 상태로 만든다.
        rejected_at: verified ? null : undefined,
        rejection_reason: verified ? null : undefined,
      })
      .eq("id", instructorId);
    setInstructors((prev) =>
      prev.map((i) =>
        i.id === instructorId
          ? { ...i, verified, verifiedAt, verifiedBy, rejectedAt: verified ? undefined : i.rejectedAt, rejectionReason: verified ? undefined : i.rejectionReason }
          : i,
      ),
    );
  };

  /**
   * 관리자 — 강사 인증 신청을 반려한다. 예전에는 InstructorApplicationQueue에 "인증 승인"
   * 버튼만 있고 반려 기능 자체가 없어서, 대기열에 들어간 강사는 승인하거나 영구히 방치하는
   * 것 외에 관리자가 취할 수 있는 조치가 없었다(#233/#234 회귀 방지). 반려 사유는
   * instructor_notifications에도 기록해 강사 본인 알림 센터에 노출한다.
   */
  const rejectInstructorApplication = async (
    instructorId: string,
    reason: string,
    rejectedBy?: string,
  ): Promise<void> => {
    const rejectedAt = new Date().toISOString();
    const { error } = await supabase
      .from("instructors")
      .update({ rejected_at: rejectedAt, rejection_reason: reason, verified_by: rejectedBy ?? null })
      .eq("id", instructorId);
    if (error) {
      console.error("[rejectInstructorApplication] instructors 업데이트 실패:", error);
      throw new Error("반려 처리에 실패했습니다: " + error.message);
    }
    setInstructors((prev) =>
      prev.map((i) => (i.id === instructorId ? { ...i, rejectedAt, rejectionReason: reason } : i)),
    );
    const instructor = instructors.find((i) => i.id === instructorId);
    if (instructor) {
      void persistInstructorNotification({
        instructorId,
        tourId: "",
        tourTitle: "강사 인증 신청",
        message: reason,
        createdAt: rejectedAt,
        type: "application_rejected",
      });
    }
  };

  /**
   * 관리자 — 강사에게 경고를 주거나(+1) 경고를 해제한다(0으로 초기화).
   * 누적 경고가 5회 이상이 되면 신규 투어 생성 기능이 제한된다 (InstructorConsole.tsx에서 처리).
   * 계정 정지/로그인 차단은 하지 않는다 — QA #39 대응 시 2회 자동 영구정지 로직은 제거함.
   */
  const setInstructorPenalty = async (
    instructorId: string,
    penaltyCount: number,
    reason?: string,
  ): Promise<void> => {
    // 경고를 해제(0회)할 때는 사유도 함께 비운다. 경고를 새로 부여할 때만 사유를 저장한다.
    const penaltyReason = penaltyCount > 0 ? reason : undefined;
    // 호출부(InstructorPublicProfile/AdminInstructorsPage)가 이 함수를 기다리지 않고
    // 곧바로 "처리했습니다" 토스트를 띄우는 구조라, 여기서 실패를 던져도 사용자에게
    // 전달되지 않는다. 그래서 예전처럼 먼저 화면(로컬 상태)부터 낙관적으로 바꾸지 않고,
    // DB 업데이트가 성공했을 때만 화면에 반영한다 — 실패하면 화면은 그대로 남아있어
    // "실제로는 적용 안 됐는데 화면엔 적용된 것처럼" 어긋나는 상태를 막는다.
    const { error } = await supabase
      .from("instructors")
      .update({ penalty_count: penaltyCount, penalty_reason: penaltyReason ?? null })
      .eq("id", instructorId);
    if (error) {
      console.error("[setInstructorPenalty] instructors 업데이트 실패:", error);
      return;
    }
    setInstructors((prev) =>
      prev.map((i) => (i.id === instructorId ? { ...i, penaltyCount, penaltyReason } : i)),
    );

    // 새로 경고가 부여될 때(사유가 함께 전달된 경우)만 이력(penalties_log)에 기록한다.
    // 해제/직접 정지처럼 사유 없이 호출되는 경우는 이력에 남기지 않는다.
    if (penaltyReason) {
      const { data, error } = await supabase
        .from("penalties_log")
        .insert({
          instructor_id: instructorId,
          violation_type: "강사 경고",
          description: penaltyReason,
        })
        .select()
        .single();
      if (!error && data) {
        setPenalties((prev) => [mapPenaltyRow(data), ...prev]);
      }
    }
  };

  /**
   * 관리자 — 오적용된 특정 패널티 이력 1건을 정정(취소)한다. 예전에는 "경고 해제" 버튼으로
   * 강사의 경고 횟수를 통째로 0으로 초기화하는 것 외에 방법이 없었고, 이미 penalties_log에
   * 쌓인 이력은 절대 수정/삭제할 수 없었다(#229 회귀 방지). 이 함수는 특정 1건만 voided
   * 처리하고, 아직 취소되지 않은 나머지 경고 수만큼만 penalty_count를 재계산한다.
   */
  const voidPenalty = async (penaltyId: string, instructorId: string): Promise<void> => {
    const { error } = await supabase.from("penalties_log").update({ voided: true }).eq("id", penaltyId);
    if (error) {
      console.error("[voidPenalty] penalties_log 업데이트 실패:", error);
      throw new Error("패널티 이력 정정에 실패했습니다: " + error.message);
    }
    setPenalties((prev) => prev.map((p) => (p.id === penaltyId ? { ...p, voided: true } : p)));

    const remainingCount = penalties.filter(
      (p) => p.instructorId === instructorId && !p.voided && p.id !== penaltyId,
    ).length;
    await supabase.from("instructors").update({ penalty_count: remainingCount }).eq("id", instructorId);
    setInstructors((prev) =>
      prev.map((i) => (i.id === instructorId ? { ...i, penaltyCount: remainingCount } : i)),
    );
  };

  const updateInstructorProfile = async (
    instructorId: string,
    updates: {
      name?: string;
      phone?: string;
      agency?: string;
      level?: string;
      totalLogs?: number;
      experienceYears?: number;
      bio?: string;
      licenseFileNames?: string[];
      avatarUrl?: string;
      languages?: string[];
      specialtyTags?: string[];
      teachingPhilosophy?: string;
      favoriteDiving?: string;
      snsInstagram?: string;
      snsYoutube?: string;
      snsFacebook?: string;
      snsBlog?: string;
      snsHomepage?: string;
      /** 마이페이지에서 본인이 사업자 유형을 신고/정정할 때 사용 (정산 원천징수 계산에 반영됨). */
      businessType?: InstructorBusinessType;
    },
  ): Promise<void> => {
    const instructor = instructors.find((i) => i.id === instructorId);

    // instructors 테이블: 이름/소속/레벨/로그수/자기소개/자격증 파일명/프로필 사진 갱신
    await supabase
      .from("instructors")
      .update({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.agency !== undefined ? { agency: updates.agency } : {}),
        ...(updates.level !== undefined ? { level: updates.level } : {}),
        ...(updates.totalLogs !== undefined ? { total_logs: updates.totalLogs } : {}),
        ...(updates.experienceYears !== undefined ? { experience_years: updates.experienceYears } : {}),
        ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
        ...(updates.licenseFileNames !== undefined ? { license_file_names: updates.licenseFileNames } : {}),
        ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
        ...(updates.languages !== undefined ? { languages: updates.languages } : {}),
        ...(updates.specialtyTags !== undefined ? { specialty_tags: updates.specialtyTags } : {}),
        ...(updates.teachingPhilosophy !== undefined ? { teaching_philosophy: updates.teachingPhilosophy } : {}),
        ...(updates.favoriteDiving !== undefined ? { favorite_diving: updates.favoriteDiving } : {}),
        ...(updates.snsInstagram !== undefined ? { sns_instagram: updates.snsInstagram } : {}),
        ...(updates.snsYoutube !== undefined ? { sns_youtube: updates.snsYoutube } : {}),
        ...(updates.snsFacebook !== undefined ? { sns_facebook: updates.snsFacebook } : {}),
        ...(updates.snsBlog !== undefined ? { sns_blog: updates.snsBlog } : {}),
        ...(updates.snsHomepage !== undefined ? { sns_homepage: updates.snsHomepage } : {}),
        ...(updates.businessType !== undefined ? { business_type: updates.businessType } : {}),
      })
      .eq("id", instructorId);

    setInstructors((prev) =>
      prev.map((i) =>
        i.id === instructorId
          ? {
              ...i,
              ...(updates.name !== undefined ? { name: updates.name } : {}),
              ...(updates.agency !== undefined ? { agency: updates.agency } : {}),
              ...(updates.level !== undefined ? { level: updates.level } : {}),
              ...(updates.totalLogs !== undefined ? { totalLogs: updates.totalLogs } : {}),
              ...(updates.experienceYears !== undefined ? { experienceYears: updates.experienceYears } : {}),
              ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
              ...(updates.licenseFileNames !== undefined ? { licenseFileNames: updates.licenseFileNames } : {}),
              ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
              ...(updates.languages !== undefined ? { languages: updates.languages } : {}),
              ...(updates.specialtyTags !== undefined ? { specialtyTags: updates.specialtyTags } : {}),
              ...(updates.teachingPhilosophy !== undefined ? { teachingPhilosophy: updates.teachingPhilosophy } : {}),
              ...(updates.favoriteDiving !== undefined ? { favoriteDiving: updates.favoriteDiving } : {}),
              ...(updates.snsInstagram !== undefined ? { snsInstagram: updates.snsInstagram } : {}),
              ...(updates.snsYoutube !== undefined ? { snsYoutube: updates.snsYoutube } : {}),
              ...(updates.snsFacebook !== undefined ? { snsFacebook: updates.snsFacebook } : {}),
              ...(updates.snsBlog !== undefined ? { snsBlog: updates.snsBlog } : {}),
              ...(updates.snsHomepage !== undefined ? { snsHomepage: updates.snsHomepage } : {}),
              ...(updates.businessType !== undefined ? { businessType: updates.businessType } : {}),
            }
          : i,
      ),
    );

    // profiles 테이블: 이름/연락처 갱신 (instructors.profile_id로 연결된 row)
    if (instructor?.profileId && (updates.name !== undefined || updates.phone !== undefined)) {
      await supabase
        .from("profiles")
        .update({
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
        })
        .eq("id", instructor.profileId);

      setInstructorProfiles((prev) =>
        prev.map((p) =>
          p.id === instructor.profileId
            ? {
                ...p,
                ...(updates.name !== undefined ? { name: updates.name } : {}),
                ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
              }
            : p,
        ),
      );
    }
  };

  /**
   * 강사 — 이미 인증된 상태에서 마이페이지를 통해 신분증/자격증/통장사본 등 제출 서류나
   * 정산 계좌 정보를 수정(재제출)한다. 예전에는 이 화면의 "강사 자격증 서류" 수정 UI가
   * 실제로는 파일을 업로드하지 않고 파일명만 저장하는 반쪽짜리 기능이었고(#84와 동일한
   * 유형의 버그), 신분증/통장사본은 애초에 마이페이지에서 수정할 방법 자체가 없었다.
   * 여기서 실제로 업로드된 새 storage 경로들을 받아 profiles/instructors 테이블에
   * 반영하고, instructors.documents_pending_review를 true로 세워 관리자가 변경 사실을
   * 알아채고 다시 확인할 수 있게 한다(관리자 강사 승인 큐에 "수정요청" 버튼으로 재노출됨).
   */
  const submitInstructorDocumentCorrection = async (
    instructorId: string,
    updates: {
      idDocumentPath?: string;
      bankbookPath?: string;
      bankbookFileName?: string;
      licenseFileNames?: string[];
      licenseFilePaths?: string[];
      bankName?: string;
      accountHolder?: string;
      accountNumber?: string;
    },
  ): Promise<void> => {
    const instructor = instructors.find((i) => i.id === instructorId);
    if (!instructor?.profileId) {
      throw new Error("강사 프로필 정보를 찾을 수 없습니다.");
    }

    const hasInstructorFieldChange =
      updates.licenseFileNames !== undefined || updates.licenseFilePaths !== undefined;
    const hasProfileFieldChange =
      updates.idDocumentPath !== undefined ||
      updates.bankbookPath !== undefined ||
      updates.bankbookFileName !== undefined ||
      updates.bankName !== undefined ||
      updates.accountHolder !== undefined ||
      updates.accountNumber !== undefined;

    if (hasInstructorFieldChange) {
      const { error: instructorError } = await supabase
        .from("instructors")
        .update({
          ...(updates.licenseFileNames !== undefined ? { license_file_names: updates.licenseFileNames } : {}),
          ...(updates.licenseFilePaths !== undefined ? { license_file_paths: updates.licenseFilePaths } : {}),
          documents_pending_review: true,
        })
        .eq("id", instructorId);
      if (instructorError) {
        console.error("[submitInstructorDocumentCorrection] instructors 업데이트 실패:", instructorError);
        throw new Error("자격증 서류 저장에 실패했습니다: " + instructorError.message);
      }
    } else {
      // 자격증 파일 변경이 없어도 신분증/통장사본/계좌정보만 바뀌었다면 여전히
      // "수정요청" 상태로 표시되어야 하므로 플래그만 갱신한다.
      const { error: flagError } = await supabase
        .from("instructors")
        .update({ documents_pending_review: true })
        .eq("id", instructorId);
      if (flagError) {
        console.error("[submitInstructorDocumentCorrection] documents_pending_review 갱신 실패:", flagError);
        throw new Error("서류 수정요청 처리에 실패했습니다: " + flagError.message);
      }
    }

    setInstructors((prev) =>
      prev.map((i) =>
        i.id === instructorId
          ? {
              ...i,
              ...(updates.licenseFileNames !== undefined ? { licenseFileNames: updates.licenseFileNames } : {}),
              ...(updates.licenseFilePaths !== undefined ? { licenseFilePaths: updates.licenseFilePaths } : {}),
              documentsPendingReview: true,
            }
          : i,
      ),
    );

    if (hasProfileFieldChange) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          ...(updates.idDocumentPath !== undefined ? { id_document_path: updates.idDocumentPath } : {}),
          ...(updates.bankbookPath !== undefined ? { bankbook_path: updates.bankbookPath } : {}),
          ...(updates.bankbookFileName !== undefined ? { bankbook_file_name: updates.bankbookFileName } : {}),
          ...(updates.bankName !== undefined ? { bank_name: updates.bankName } : {}),
          ...(updates.accountHolder !== undefined ? { account_holder: updates.accountHolder } : {}),
          ...(updates.accountNumber !== undefined ? { account_number: updates.accountNumber } : {}),
        })
        .eq("id", instructor.profileId);
      if (profileError) {
        console.error("[submitInstructorDocumentCorrection] profiles 업데이트 실패:", profileError);
        throw new Error("제출 서류 저장에 실패했습니다: " + profileError.message);
      }

      setInstructorProfiles((prev) =>
        prev.map((p) =>
          p.id === instructor.profileId
            ? {
                ...p,
                ...(updates.idDocumentPath !== undefined ? { idDocumentPath: updates.idDocumentPath } : {}),
                ...(updates.bankbookPath !== undefined ? { bankbookPath: updates.bankbookPath } : {}),
                ...(updates.bankbookFileName !== undefined ? { bankbookFileName: updates.bankbookFileName } : {}),
                ...(updates.bankName !== undefined ? { bankName: updates.bankName } : {}),
                ...(updates.accountHolder !== undefined ? { accountHolder: updates.accountHolder } : {}),
                ...(updates.accountNumber !== undefined ? { accountNumber: updates.accountNumber } : {}),
              }
            : p,
        ),
      );
    }
  };

  /**
   * 관리자 — 강사가 마이페이지에서 제출한 서류 수정요청을 확인 완료 처리한다.
   * documents_pending_review를 false로 되돌려 승인 큐에서 다시 사라지게 하고,
   * 강사 알림 센터에 확인 완료 사실을 남긴다.
   */
  const clearInstructorDocumentReview = async (instructorId: string): Promise<void> => {
    const { error } = await supabase
      .from("instructors")
      .update({ documents_pending_review: false })
      .eq("id", instructorId);
    if (error) {
      console.error("[clearInstructorDocumentReview] instructors 업데이트 실패:", error);
      throw new Error("수정요청 확인 처리에 실패했습니다: " + error.message);
    }
    setInstructors((prev) =>
      prev.map((i) => (i.id === instructorId ? { ...i, documentsPendingReview: false } : i)),
    );
    void persistInstructorNotification({
      instructorId,
      tourId: "",
      tourTitle: "제출 서류 확인",
      message: "제출하신 수정 서류를 관리자가 확인했습니다.",
      createdAt: new Date().toISOString(),
      type: "document_review_completed",
    });
  };


  const addDiverSignup = (input: NewDiverSignupInput): Profile => {
    const profile: Profile = {
      id: nextId("diver"),
      role: "diver",
      name: input.name,
      phone: input.phone,
      gender: input.gender,
      status: "active",
      createdAt: new Date().toISOString(),
      snoring: false,
      smoking: false,
    };
    setDiverProfiles((prev) => [...prev, profile]);
    return profile;
  };

  // 다이버 회원가입(DiverSignupForm)은 Supabase `profiles` 테이블에 직접 insert하기 때문에
  // 이 훅의 diverProfiles 로컬 상태에는 반영되지 않는다. 가입 직후 새로고침 없이도
  // 마이페이지 등에서 방금 입력한 정보(C-Card/비상연락처/보험 등)가 바로 보이도록,
  // 가입 성공 시 이 함수로 새 프로필을 로컬 상태에도 즉시 반영한다.
  const registerDiverProfile = (profile: Profile) => {
    setDiverProfiles((prev) =>
      prev.some((p) => p.id === profile.id) ? prev.map((p) => (p.id === profile.id ? profile : p)) : [...prev, profile],
    );
  };

  const setProfileStatus = (profileId: string, status: Profile["status"]) => {
    setDiverProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, status } : p)));
    setInstructorProfiles((prev) => prev.map((p) => (p.id === profileId ? { ...p, status } : p)));
    // 주의: supabase-js 쿼리 빌더는 thenable이라 .then()/await로 "소비"해야만 실제 네트워크 요청이
    // 나간다. `void supabase.from(...).update(...)` 형태로만 두면 요청 자체가 전혀 발생하지 않아
    // 관리자가 경고/정지 처리해도 화면(로컬 상태)만 바뀌고 DB에는 반영되지 않는 버그가 있었다.
    supabase
      .from("profiles")
      .update({ status })
      .eq("id", profileId)
      .then(({ error }) => {
        if (error) {
          console.error("[setProfileStatus] profiles 업데이트 실패:", error);
        }
      });
  };

  const setPayoutStatus = async (payoutId: string, status: Payout["status"]) => {
    setPayouts((prev) => prev.map((p) => (p.id === payoutId ? { ...p, status } : p)));
    await supabase.from("payouts").update({ status }).eq("id", payoutId);
  };

  const addReport = async (input: Omit<Report, "id" | "createdAt" | "status">) => {
    const { data, error } = await supabase
      .from("reports")
      .insert({
        target_type: input.targetType,
        target_id: input.targetId,
        target_name: input.targetName,
        violation_type: input.violationType,
        description: input.description,
      })
      .select()
      .single();

    if (error || !data) {
      // addSupportTicket/addBooking과 동일한 이유로, 실패 시 로컬 전용 가짜 신고 객체로
      // 조용히 넘어가지 않고 명확히 에러를 던진다 — 그래야 신고자가 실패를 알고 재시도할 수 있다.
      console.error("[addReport] reports insert 실패:", error);
      throw new Error(
        error?.message ? `신고 접수에 실패했습니다: ${error.message}` : "신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const report: Report = mapReportRow(data);
    setReports((prev) => [report, ...prev]);
  };

  const resolveReport = async (reportId: string) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
  };

  const addChatMessage = async (input: Omit<ChatMessage, "id" | "createdAt">) => {
    // realtime 구독이 로컬 state를 갱신하므로 여기서는 insert만 수행한다 (낙관적 업데이트 없음).
    // 예전에는 이 insert가 실패해도 아무 표시가 없어서, 사용자가 메시지를 보냈다고 생각했지만
    // 실제로는 상대방 화면에 영원히 나타나지 않는 문제가 있었다(입력창은 이미 비워진 뒤라
    // 재전송할 내용도 못 찾음). 에러를 던져 ChatThread가 실패를 알리고 입력값을 복구할 수
    // 있게 한다.
    const { error } = await supabase.from("chat_messages").insert({
      tour_id: input.tourId,
      sender_profile_id: input.senderProfileId,
      sender_name: input.senderName,
      sender_role: input.senderRole,
      body: input.body,
    });
    if (error) {
      console.error("[addChatMessage] chat_messages insert 실패:", error);
      throw new Error(
        error.message ? `메시지 전송에 실패했습니다: ${error.message}` : "메시지 전송에 실패했습니다.",
      );
    }
  };

  const toggleBookmark = (tourId: string) => {
    setBookmarkedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId],
    );
  };

  const isBookmarked = (tourId: string) => bookmarkedTourIds.includes(tourId);

  const toggleInstructorBookmark = (instructorId: string) => {
    setBookmarkedInstructorIds((prev) =>
      prev.includes(instructorId) ? prev.filter((id) => id !== instructorId) : [...prev, instructorId],
    );
  };

  const isInstructorBookmarked = (instructorId: string) => bookmarkedInstructorIds.includes(instructorId);

  const addInquiry = async (input: NewInquiryInput): Promise<Inquiry> => {
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        tour_id: input.tourId,
        booking_id: input.bookingId,
        diver_id: input.diverId,
        category: input.category,
        message: input.message,
      })
      .select()
      .single();

    if (error || !data) {
      // 예전에는 실패해도 로컬 전용 가짜 문의로 조용히 넘어가서, 사용자는 "문의가
      // 접수되었습니다" 성공 토스트를 보지만 실제로는 담당자에게 전달되지 않는 문제가
      // 있었다. 명확히 에러를 던져 InquiryDialog가 실패로 처리하도록 한다.
      console.error("[addInquiry] inquiries insert 실패:", error);
      throw new Error(
        error?.message ? `문의 접수에 실패했습니다: ${error.message}` : "문의 접수에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const inquiry: Inquiry = mapInquiryRow(data);
    setInquiries((prev) => [inquiry, ...prev]);
    return inquiry;
  };

  const addReview = async (input: NewReviewInput): Promise<Review> => {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        tour_id: input.tourId,
        booking_id: input.bookingId,
        diver_id: input.diverId,
        instructor_id: input.instructorId,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        category_ratings: input.categoryRatings,
        photos: input.photos ?? [],
        video_url: input.videoUrl,
        visibility: input.visibility ?? "public",
      })
      .select()
      .single();

    if (error || !data) {
      // 예전에는 실패해도 로컬 전용 가짜 후기로 조용히 넘어가서, 작성자에게는 "등록됨"으로
      // 보이지만 새로고침하면 사라지고 다른 사용자/강사에게는 애초에 노출되지 않는 문제가
      // 있었다. 명확히 에러를 던져 ReviewDialog가 실패로 처리하도록 한다(캐치 로직 이미 존재).
      console.error("[addReview] reviews insert 실패:", error);
      throw new Error(
        error?.message ? `후기 등록에 실패했습니다: ${error.message}` : "후기 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const review: Review = mapReviewRow(data);
    setReviews((prev) => [review, ...prev]);
    return review;
  };

  const getReviewByBookingId = (bookingId: string) =>
    reviews.find((r) => r.bookingId === bookingId);

  const getReviewsByTourId = (tourId: string) =>
    reviews.filter((r) => r.tourId === tourId && !r.deleted);

  const getReviewsByInstructorId = (instructorId: string) =>
    reviews.filter((r) => r.instructorId === instructorId && !r.deleted);

  const reportReview = async (reviewId: string) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, reported: true } : r)));
    // 신고자가 이 리뷰의 작성자가 아니므로(RLS 보안 강화 1단계 batch96 참고) 일반 update
    // 대신 reported 필드만 안전하게 켜주는 report_review() RPC를 쓴다.
    const { error } = await supabase.rpc("report_review", { p_review_id: reviewId });
    if (error) {
      console.error("[reportReview] 리뷰 신고 처리 실패:", error);
    }
  };

  /** 담당 강사가 자신의 투어에 달린 후기에 답글을 작성/수정한다. */
  const replyToReview = async (reviewId: string, reply: string) => {
    const replyAt = new Date().toISOString();
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, instructorReply: reply, instructorReplyAt: replyAt } : r)),
    );
    await supabase
      .from("reviews")
      .update({ instructor_reply: reply, instructor_reply_at: replyAt })
      .eq("id", reviewId);
  };

  const getCouponByCode = (code: string) => coupons.find((c) => c.code === code.trim().toUpperCase());

  /** 관리자 — 신규 쿠폰 발급. */
  const addCoupon = async (
    input: Omit<Coupon, "id" | "createdAt" | "usedCount">,
  ): Promise<Coupon> => {
    const normalizedCode = input.code.trim().toUpperCase();
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: normalizedCode,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        min_purchase: input.minPurchase,
        max_discount: input.maxDiscount ?? null,
        expires_at: input.expiresAt ?? null,
        usage_limit: input.usageLimit ?? null,
        active: input.active,
      })
      .select()
      .single();

    if (error || !data) {
      // 예전에는 실패해도 로컬 전용 가짜 쿠폰으로 조용히 넘어가서, 관리자에게는 발급된
      // 것처럼 보이지만 실제로는 DB에 없어 사용자가 그 코드를 입력하면 "존재하지 않는
      // 쿠폰"으로 실패하는 문제가 있었다. 명확히 에러를 던져 AdminCouponsPage가 실패로
      // 처리하도록 한다.
      console.error("[addCoupon] coupons insert 실패:", error);
      throw new Error(
        error?.message ? `쿠폰 발급에 실패했습니다: ${error.message}` : "쿠폰 발급에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const coupon: Coupon = mapCouponRow(data);
    setCoupons((prev) => [coupon, ...prev]);
    return coupon;
  };

  /** 관리자 — 쿠폰 활성/비활성 토글. */
  const toggleCouponActive = async (couponId: string) => {
    const target = coupons.find((c) => c.id === couponId);
    if (!target) return;
    const nextActive = !target.active;
    setCoupons((prev) => prev.map((c) => (c.id === couponId ? { ...c, active: nextActive } : c)));
    await supabase.from("coupons").update({ active: nextActive }).eq("id", couponId);
  };

  /** 관리자 — 쿠폰 삭제. */
  const deleteCoupon = async (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
    await supabase.from("coupons").delete().eq("id", couponId);
  };

  /** 결제 완료 시 쿠폰 사용 횟수를 1 증가시킨다. */
  const redeemCoupon = async (couponId: string) => {
    const target = coupons.find((c) => c.id === couponId);
    if (!target) return;
    const usedCount = target.usedCount + 1;
    setCoupons((prev) => prev.map((c) => (c.id === couponId ? { ...c, usedCount } : c)));
    // 구매자가 이 쿠폰의 소유자(관리자)가 아니므로(RLS 보안 강화 1단계 batch96 참고) 일반
    // update 대신, 서버에서 원자적으로 +1 하고 한도/활성 여부까지 재검증하는 redeem_coupon()
    // RPC를 쓴다. (기존 코드는 클라이언트가 계산한 절대값을 그대로 덮어써서 동시 사용 시
    // 카운트가 씹힐 수 있는 잠재 버그도 있었는데, RPC 쪽이 이 문제도 함께 해결한다.)
    const { error } = await supabase.rpc("redeem_coupon", { p_coupon_id: couponId });
    if (error) {
      console.error("[redeemCoupon] 쿠폰 사용 처리 실패:", error);
    }
  };

  const deleteReview = async (reviewId: string) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, deleted: true } : r)));
    await supabase.from("reviews").update({ deleted: true }).eq("id", reviewId);
  };

  const markInstructorNotificationRead = (notificationId: string) => {
    setInstructorNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
    void supabase
      .from("instructor_notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .then(({ error }) => {
        if (error) console.error("[markInstructorNotificationRead] 업데이트 실패:", error);
      });
  };

  /**
   * 예약 취소 (즉시 처리 경로). ALL BLUE 공식 환불 규정에 따라 환불율을 계산하고,
   * 예약 상태를 'cancelled'로 전환한 뒤 연결된 강사 정산(Payout)을 원자적으로 롤백한다.
   * (release된 정산은 되돌리지 않는다.)
   */
  const cancelBooking = async (bookingId: string, reason: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const tour = booking ? tours.find((t) => t.id === booking.tourId) : undefined;
    if (!booking || !tour) return { refundRate: 0, refundAmount: 0 };

    const refundRate = computeRefundRate(tour);
    const refundAmount = computeRefundAmount(booking.totalPaid, refundRate);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: "cancelled", cancelReason: reason, refundRate, refundAmount }
          : b,
      ),
    );
    await supabase
      .from("bookings")
      .update({ status: "cancelled", cancel_reason: reason, refund_rate: refundRate, refund_amount: refundAmount })
      .eq("id", bookingId);

    // 트랜잭션 롤백: 이미 지급 완료(released)된 정산은 되돌리지 않고, 예정/보류 상태만 취소 처리한다.
    setPayouts((prev) =>
      prev.map((p) =>
        p.bookingId === bookingId && p.status !== "released" ? { ...p, status: "cancelled" } : p,
      ),
    );
    const { error: cancelSettlementError } = await supabase.rpc("cancel_booking_settlement", {
      p_booking_id: bookingId,
      p_refund_amount: refundAmount,
    });
    if (cancelSettlementError) {
      console.error(
        "[cancelBooking] 정산(payout/invoice) 취소 반영 RPC 실패 (예약 취소는 정상 처리됨):",
        cancelSettlementError,
      );
    }
    void fetchTourConfirmedCounts();

    return { refundRate, refundAmount };
  };

  /** 강사가 방을 배정/수정할 때 사용. roomNo를 null로 넘기면 배정 해제(미배정으로 되돌림). */
  const updateBookingRoom = async (bookingId: string, roomNo: string | null) => {
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, roomNo: roomNo ?? undefined } : b)));
    await supabase.from("bookings").update({ room_no: roomNo }).eq("id", bookingId);
  };

  /** 예약 1건에 동반자가 여러 명 있을 때, 동반자 개인의 방 번호만 따로 배정/수정한다.
   * companions 컬럼이 jsonb라 스키마 변경 없이 배열 안의 해당 인덱스 객체만 갱신해서
   * 통째로 다시 저장하면 된다. */
  const updateCompanionRoom = async (bookingId: string, companionIndex: number, roomNo: string | null) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return;
    const nextCompanions = (target.companions ?? []).map((c, idx) =>
      idx === companionIndex ? { ...c, roomNo: roomNo ?? undefined } : c,
    );
    setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, companions: nextCompanions } : b)));
    await supabase.from("bookings").update({ companions: nextCompanions }).eq("id", bookingId);
  };

  /** 천재지변/의료 사유 등 즉시 환불이 아닌 운영팀 심사가 필요한 취소 요청을 접수한다. */
  const submitCancellationForReview = async (bookingId: string, reason: string, evidenceFileNames: string[]) => {
    const cancelRequestedAt = new Date().toISOString();
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? { ...b, status: "cancel_pending_review", cancelReason: reason, evidenceFileNames, cancelRequestedAt }
          : b,
      ),
    );
    await supabase
      .from("bookings")
      .update({
        status: "cancel_pending_review",
        cancel_reason: reason,
        evidence_file_names: evidenceFileNames,
        cancel_requested_at: cancelRequestedAt,
      })
      .eq("id", bookingId);
  };

  /**
   * 관리자 취소 심사 처리: 승인 시 전액 환불 + 정산 롤백 + 강사 페널티 알림 발행,
   * 반려 시 예약을 원상 복구한다.
   */
  const resolveCancellationReview = async (bookingId: string, approved: boolean, rejectReason?: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    const tour = booking ? tours.find((t) => t.id === booking.tourId) : undefined;

    if (approved) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? { ...b, status: "cancelled", refundRate: 1, refundAmount: b.totalPaid }
            : b,
        ),
      );
      await supabase
        .from("bookings")
        .update({ status: "cancelled", refund_rate: 1, refund_amount: booking?.totalPaid })
        .eq("id", bookingId);

      setPayouts((prev) =>
        prev.map((p) =>
          p.bookingId === bookingId && p.status !== "released" ? { ...p, status: "cancelled" } : p,
        ),
      );
      const { error: cancelSettlementError } = await supabase.rpc("cancel_booking_settlement", {
        p_booking_id: bookingId,
        p_refund_amount: booking?.totalPaid ?? 0,
      });
      if (cancelSettlementError) {
        console.error(
          "[resolveCancellationReview] 정산(payout/invoice) 취소 반영 RPC 실패 (강제 환불은 정상 처리됨):",
          cancelSettlementError,
        );
      }
      void fetchTourConfirmedCounts();

      // 관리자가 [강제 환불 승인]을 실행하는 즉시 담당 강사에게 고위험 페널티 알림을 발행한다.
      if (booking && tour) {
        void persistInstructorNotification({
          instructorId: tour.instructorId,
          tourId: tour.id,
          bookingId: booking.id,
          tourTitle: tour.title,
          diverName: maskName(booking.diverName),
          selectedOptionNames: booking.selectedOptions.map((o) => o.name),
          settlementAmount: booking.basePrice + booking.optionsCost,
          createdAt: new Date().toISOString(),
          type: "forced_refund_penalty",
        });
        notifyInstructorPush(
          tour.instructorId,
          "강제 환불 승인 조치",
          `${tour.title} 투어 예약 건에 대해 관리자가 강제 환불을 승인했습니다.`,
          "/instructor/arbitration",
        );
      }
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b)),
      );
      await supabase.from("bookings").update({ status: "confirmed" }).eq("id", bookingId);

      // 반려 사유를 다이버에게 즉시 전달한다 (컬럼 미존재로 영구 저장은 아직 불가, 우선 실시간 알림으로 전달).
      if (booking) {
        notifyDiverPush(
          booking.diverId,
          "취소 신청이 반려되었습니다",
          rejectReason
            ? `사유: ${rejectReason}`
            : "예약이 다시 확정 처리되었습니다. 자세한 사유는 고객센터로 문의해주세요.",
          "/mypage",
        );
      }
    }
  };

  /**
   * 관리자 — 강사가 제출한 투어 취소 증빙(tour_cancellation_claims)을 검토해 승인/반려한다.
   * 승인 시: 취소 당시 cancelled 처리됐던 정산 중 이 건과 연관된 것만 1차 정산(80%)을 되살려
   * "정산 예정" 상태로 되돌린다. 투어가 실제 진행되지 않았으므로 2차 정산(20%)은 0원 처리한다.
   * 반려 시: 정산은 취소된 상태 그대로 유지되고, 사유만 안내 메모로 강사에게 전달된다.
   */
  const reviewTourCancellationClaim = async (
    claimId: string,
    approved: boolean,
    adminNote: string,
    reviewedBy: string,
  ): Promise<void> => {
    const claim = tourCancellationClaims.find((c) => c.id === claimId);
    if (!claim) throw new Error("취소 신청 정보를 찾을 수 없습니다.");

    const reviewedAt = new Date().toISOString();
    const nextStatus: TourCancellationClaimStatus = approved ? "approved" : "rejected";

    setTourCancellationClaims((prev) =>
      prev.map((c) => (c.id === claimId ? { ...c, status: nextStatus, adminNote, reviewedBy, reviewedAt } : c)),
    );
    const { error } = await supabase
      .from("tour_cancellation_claims")
      .update({
        status: nextStatus,
        admin_note: adminNote || null,
        reviewed_by: reviewedBy,
        reviewed_at: reviewedAt,
      })
      .eq("id", claimId);
    if (error) {
      console.error("[reviewTourCancellationClaim] tour_cancellation_claims 업데이트 실패:", error);
      throw new Error(
        error.message ? `검토 처리에 실패했습니다: ${error.message}` : "검토 처리에 실패했습니다.",
      );
    }

    if (approved && claim.affectedBookingIds.length > 0) {
      setPayouts((prev) =>
        prev.map((p) =>
          claim.affectedBookingIds.includes(p.bookingId) ? { ...p, status: "scheduled", secondAmount: 0 } : p,
        ),
      );
      const { error: payoutError } = await supabase
        .from("payouts")
        .update({ status: "scheduled", second_amount: 0 })
        .in("booking_id", claim.affectedBookingIds);
      if (payoutError) {
        console.error("[reviewTourCancellationClaim] payouts 되살리기 실패:", payoutError);
      }
    }

    void addInstructorAdminNote({
      instructorId: claim.instructorId,
      senderRole: "admin",
      senderName: "관리자",
      body: approved
        ? `제출하신 투어 취소 증빙이 승인되어 1차 정산(80%)이 정산 예정 상태로 복구되었습니다.${adminNote ? ` (${adminNote})` : ""}`
        : `제출하신 투어 취소 증빙이 반려되었습니다.${adminNote ? ` 사유: ${adminNote}` : ""}`,
    });
  };

  /** 강사-최고관리자 비밀 중재방에 메시지(및 첨부파일)를 추가한다. */
  /**
   * 강사↔최고관리자 비밀 중재방 메시지를 등록한다.
   * chat_messages(addChatMessage)와 동일하게, realtime 구독이 로컬 state를 갱신하므로
   * 여기서는 insert만 수행한다(낙관적 업데이트 없음 — 중복 추가 방지).
   * 예전에는 이 함수가 로컬 메모리에만 메시지를 쌓아 DB에 전혀 저장되지 않았다(새로고침/
   * 다른 세션에서 대화가 사라짐, 강사·관리자가 실제로 대화 불가). 반드시 서버에 저장하고,
   * 실패하면 호출부(ArbitrationChatRoom)가 사용자에게 알릴 수 있도록 에러를 던진다.
   */
  const addArbitrationMessage = async (input: Omit<ArbitrationMessage, "id" | "createdAt">): Promise<void> => {
    const { error } = await supabase.from("arbitration_messages").insert({
      room_id: input.roomId,
      instructor_id: input.instructorId,
      sender_role: input.senderRole,
      sender_name: input.senderName,
      body: input.body,
      attachment_names: input.attachmentNames ?? [],
      attachment_urls: input.attachmentUrls ?? [],
    });
    if (error) {
      console.error("[addArbitrationMessage] arbitration_messages insert 실패:", error);
      throw new Error(
        error.message ? `메시지 전송에 실패했습니다: ${error.message}` : "메시지 전송에 실패했습니다.",
      );
    }
  };

  /**
   * 관리자 ↔ 강사 전용 비공개 안내 메모(instructor_admin_notes) 전송.
   * arbitration_messages와 동일하게 insert만 수행하고, 화면 반영은 realtime 구독이 담당한다.
   */
  const addInstructorAdminNote = async (input: Omit<InstructorAdminNote, "id" | "createdAt">): Promise<void> => {
    const { error } = await supabase.from("instructor_admin_notes").insert({
      instructor_id: input.instructorId,
      sender_role: input.senderRole,
      sender_name: input.senderName,
      body: input.body,
    });
    if (error) {
      console.error("[addInstructorAdminNote] instructor_admin_notes insert 실패:", error);
      throw new Error(
        error.message ? `메시지 전송에 실패했습니다: ${error.message}` : "메시지 전송에 실패했습니다.",
      );
    }
  };

  /** 신규 이용센터를 Enter Cloud(Supabase) `centers` 테이블에 등록한다. */
  const addCenter = async (input: NewCenterInput): Promise<Center> => {
    const { data, error } = await supabase
      .from("centers")
      .insert({
        name: input.name,
        country: input.country,
        address: input.address,
        google_map: input.googleMap,
        homepage: input.homepage,
        instagram: input.instagram,
        phone: input.phone,
        features: input.features,
        status: input.status ?? "pending",
      })
      .select()
      .single();

    if (error || !data) {
      // addSupportTicket과 동일한 이유로, 실패 시 로컬 전용 가짜 센터로 조용히 넘어가지 않고
      // 명확히 에러를 던진다 — 그래야 관리자 화면이 실패를 알고 사용자에게 알릴 수 있다.
      console.error("[addCenter] centers insert 실패:", error);
      throw new Error(
        error?.message ? `센터 등록에 실패했습니다: ${error.message}` : "센터 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const center = mapCenterRow(data);
    setCenters((prev) => [...prev, center]);
    return center;
  };

  /** 관리자 — 이용센터 정보를 수정한다. */
  const updateCenter = async (centerId: string, updates: NewCenterInput): Promise<void> => {
    setCenters((prev) => prev.map((c) => (c.id === centerId ? { ...c, ...updates } : c)));
    await supabase
      .from("centers")
      .update({
        name: updates.name,
        country: updates.country,
        address: updates.address,
        google_map: updates.googleMap,
        homepage: updates.homepage,
        instagram: updates.instagram,
        phone: updates.phone,
        features: updates.features,
      })
      .eq("id", centerId);
  };

  /** 관리자 — 이용센터를 삭제한다. */
  const deleteCenter = async (centerId: string): Promise<void> => {
    setCenters((prev) => prev.filter((c) => c.id !== centerId));
    await supabase.from("centers").delete().eq("id", centerId);
  };

  /**
   * 관리자 — 센터 승인/반려 처리. 예전에는 이 상태 자체가 스키마에 없어서 강사가 투어 생성
   * 중 등록한 센터가 검증 없이 바로 전체 노출됐고, 대시보드/관리자 화면엔 "승인됨" 배지가
   * 하드코딩되어 있었다(#216/#217/#249/#269 회귀 방지).
   */
  const setCenterStatus = async (
    centerId: string,
    status: "approved" | "rejected",
    reason?: string,
  ): Promise<void> => {
    const rejectionReason = status === "rejected" ? reason : undefined;
    const { error } = await supabase
      .from("centers")
      .update({ status, rejection_reason: rejectionReason ?? null })
      .eq("id", centerId);
    if (error) {
      console.error("[setCenterStatus] centers 업데이트 실패:", error);
      throw new Error("센터 상태 변경에 실패했습니다: " + error.message);
    }
    setCenters((prev) =>
      prev.map((c) => (c.id === centerId ? { ...c, status, rejectionReason } : c)),
    );
  };

  /** 1:1 문의 / 분쟁조정 / 신고를 통합 접수한다. */
  const addSupportTicket = async (input: NewSupportTicketInput): Promise<SupportTicket> => {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: input.userId,
        booking_id: input.bookingId,
        type: input.type,
        category: input.category,
        title: input.title,
        content: input.content,
        attachment_names: input.attachmentNames ?? [],
      })
      .select()
      .single();

    if (error || !data) {
      // 접수 INSERT가 실패했는데도 로컬에만 존재하는 가짜 티켓 객체로 조용히 넘어가면,
      // 사용자는 "접수되었습니다" 성공 토스트를 보지만 실제로는 DB에 아무것도 남지 않는다
      // (신고/1:1문의/분쟁조정 모두 이 함수를 공유하므로 세 가지 다 해당). 반드시 에러를
      // 던져서 SupportTicketForm이 실패로 처리하고 사용자에게 알리도록 한다.
      console.error("[addSupportTicket] support_tickets insert 실패:", error);
      throw new Error(
        error?.message ? `접수에 실패했습니다: ${error.message}` : "접수에 실패했습니다. 잠시 후 다시 시도해주세요.",
      );
    }
    const ticket = mapSupportTicketRow(data);
    setSupportTickets((prev) => [ticket, ...prev]);
    return ticket;
  };

  /** 관리자가 고객센터 접수 건의 처리 상태/답변을 갱신한다. */
  const updateSupportTicketStatus = async (
    ticketId: string,
    status: SupportTicketStatus,
    adminReply?: string,
  ): Promise<void> => {
    await supabase
      .from("support_tickets")
      .update({ status, admin_reply: adminReply, updated_at: new Date().toISOString() })
      .eq("id", ticketId);
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status, adminReply: adminReply ?? t.adminReply } : t)),
    );

    // 관리자 답변이 새로 등록된 경우, 문의를 남긴 사용자에게 답변 완료를 즉시 알려준다.
    if (adminReply && adminReply.trim()) {
      const ticket = supportTickets.find((t) => t.id === ticketId);
      if (ticket) {
        notifyDiverPush(
          ticket.userId,
          "문의하신 내용에 답변이 등록되었습니다",
          adminReply.length > 60 ? `${adminReply.slice(0, 60)}...` : adminReply,
          "/mypage",
        );
      }
    }
  };

  const getInstructorById = (id: string) => instructors.find((i) => i.id === id);
  const getInstructorProfileById = (id: string) => instructorProfiles.find((p) => p.id === id);
  const getTourById = (id: string) => tours.find((t) => t.id === id);
  const getDiveCenterByInstructorId = (id: string) =>
    MOCK_DIVE_CENTERS.find((c) => c.instructorId === id);
  const getCenterById = (id: string) => centers.find((c) => c.id === id);

  const addNotice = (input: Omit<Notice, "id" | "createdAt">): Notice => {
    const notice: Notice = { id: nextId("notice"), createdAt: new Date().toISOString(), ...input };
    setNotices((prev) => [notice, ...prev]);
    return notice;
  };

  const deleteNotice = (noticeId: string) => {
    setNotices((prev) => prev.filter((n) => n.id !== noticeId));
  };

  const value = useMemo<AppDataContextValue>(
    () => ({
      tours,
      toursLoading,
      instructors,
      instructorsLoading,
      instructorProfiles,
      diverProfiles,
      publicProfiles,
      getConfirmedParticipantCount,
      fetchMaskedTourParticipants,
      adminProfile: MOCK_ADMIN_PROFILE,
      bookings,
      bookingsLoading,
      payouts,
      penalties,
      reports,
      chatMessages,
      bookmarkedTourIds,
      bookmarkedInstructorIds,
      reviews,
      inquiries,
      instructorNotifications,
      arbitrationMessages,
      instructorAdminNotes,
      tourCancellationClaims,
      centers,
      centersLoading,
      supportTickets,
      supportTicketsLoading,
      notices,
      coupons,
      addTour,
      resolveUnderMinDecision,
      forceCancelTourBookings,
      cancelTourByInstructor,
      reviewTourCancellationClaim,
      updateTourNotice,
      updateTourItinerary,
      updateTourMeetingInfo,
      updateTour,
      setTourAdminStatus,
      closeTourRecruiting,
      deleteTour,
      updateBookingTravelInfo,
      updateDiverProfile,
      addBooking,
      addInstructorSignup,
      addDiverSignup,
      registerDiverProfile,
      setProfileStatus,
      setPayoutStatus,
      addReport,
      resolveReport,
      addChatMessage,
      setInstructorVerified,
      rejectInstructorApplication,
      setInstructorPenalty,
      voidPenalty,
      updateInstructorProfile,
      submitInstructorDocumentCorrection,
      clearInstructorDocumentReview,
      toggleBookmark,
      isBookmarked,
      toggleInstructorBookmark,
      isInstructorBookmarked,
      addInquiry,
      addReview,
      getReviewByBookingId,
      getReviewsByTourId,
      getReviewsByInstructorId,
      reportReview,
      replyToReview,
      deleteReview,
      getCouponByCode,
      addCoupon,
      toggleCouponActive,
      deleteCoupon,
      redeemCoupon,
      markInstructorNotificationRead,
      cancelBooking,
      updateBookingRoom,
      updateCompanionRoom,
      submitCancellationForReview,
      resolveCancellationReview,
      addArbitrationMessage,
      addInstructorAdminNote,
      addCenter,
      updateCenter,
      setCenterStatus,
      deleteCenter,
      addSupportTicket,
      updateSupportTicketStatus,
      addNotice,
      deleteNotice,
      getInstructorById,
      getInstructorProfileById,
      getTourById,
      getDiveCenterByInstructorId,
      getCenterById,
    }),
    [
      tours,
      toursLoading,
      instructors,
      instructorsLoading,
      instructorProfiles,
      diverProfiles,
      publicProfiles,
      tourConfirmedCounts,
      bookings,
      bookingsLoading,
      payouts,
      penalties,
      reports,
      chatMessages,
      bookmarkedTourIds,
      bookmarkedInstructorIds,
      reviews,
      inquiries,
      instructorNotifications,
      arbitrationMessages,
      instructorAdminNotes,
      tourCancellationClaims,
      centers,
      centersLoading,
      supportTickets,
      supportTicketsLoading,
      notices,
      coupons,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

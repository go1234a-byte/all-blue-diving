// ALL BLUE — 도메인 타입 정의 (프론트엔드 목업 데이터 기반)

export type UserRole = "public" | "diver" | "instructor" | "admin";

export type ActivityType = "scuba" | "freediving" | "liveaboard";

export type ScubaCertLevel = "ow" | "aow" | "rescue" | "master" | "inst";

export type FreedivingCertLevel = "basic" | "level1" | "level2" | "level3" | "inst";

export type CertificationLevel = ScubaCertLevel | FreedivingCertLevel;

export type ProfileStatus = "active" | "warned" | "suspended";

export type Gender = "male" | "female";

export interface Profile {
  id: string;
  role: "diver" | "instructor" | "admin";
  name: string;
  phone: string;
  gender: Gender;
  status: ProfileStatus;
  createdAt: string;
  snoring?: boolean;
  smoking?: boolean;
  birthDate?: string; // 생년월일(YYYY-MM-DD), 나이 계산용
  // 다이버 가입 시 추가 정보 (안전/책임 목적)
  cCardAgency?: string; // 자격증 발급 기관 (PADI/SSI 등)
  cCardNumber?: string; // 자격증 번호
  logCount?: number; // 누적 다이빙 로그 수
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  insuranceInfo?: string; // 선택 — 여행자/다이빙 보험 정보(보험사·증권번호 등)
}

export interface InstructorProfile {
  id: string;
  profileId: string;
  name: string;
  avatarUrl?: string;
  agency?: string; // 다이빙협회 소속 (예: PADI, SSI, CMAS 등)
  level?: string; // 자격 레벨 (예: Divemaster, OWSI, MSDT, Course Director 등)
  licenseFileNames: string[];
  signatureDataUrl?: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  pledgeSigned: boolean;
  pledgeSignedAt?: string;
  pledgeVersion?: string;
  totalLogs: number;
  experienceYears: number;
  completionRate: number; // 0-100
  rating: number; // 0-5
  penaltyCount: number;
  bio: string;
  languages?: string[]; // 사용 언어 (공개 프로필 표시용)
}

export interface DiveCenter {
  instructorId: string;
  name: string;
  address: string;
  operatingHours: string;
  photos: string[];
}

export const CENTER_FEATURE_OPTIONS = [
  "전용 보트",
  "하우스리프",
  "온수 샤워",
  "장비 세척장",
  "카메라 전용 테이블",
  "무료 WIFI",
  "장비 렌탈",
  "Nitrox 가능",
  "레스토랑",
  "숙소 도보 이동",
  "공항 픽업",
  "해양보호구역",
] as const;

/** 투어가 반드시 연결되는 이용센터(다이브샵) 정보. */
export interface Center {
  id: string;
  name: string;
  country?: string;
  address: string;
  googleMap?: string;
  homepage?: string;
  instagram?: string;
  phone?: string; // 관리자만 확인 가능
  features: string[];
  createdAt: string;
}

export interface TourOption {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface SelectedOption {
  name: string;
  price: number;
}

/** 투어 일자별 일정 한 항목 (참가자 대시보드 [일정] 탭에서 사용). */
export interface TourItineraryDay {
  dayNumber: number;
  title: string; // 예: "1일차 - 입도 및 오리엔테이션"
  briefing?: string;
  diving?: string;
  meals?: string;
  freeTime?: string;
}

export interface Tour {
  id: string;
  instructorId: string;
  centerId?: string;
  createdAt: string; // ISO datetime, 최신순 정렬에 사용
  title: string;
  country: string;
  site: string;
  activityTypes: ActivityType[];
  /** 리브어보드 등 참가 조건으로 요구하는 최소 보유 로그 수 (없으면 조건 없음). */
  minLogCount?: number;
  certificationLevel: CertificationLevel;
  mainImageUrl: string;
  galleryUrls: string[];
  startDate: string; // ISO date
  endDate: string; // ISO date
  recruitmentDeadline: string; // ISO date
  basePrice: number;
  waterTempC: number;
  visibilityM: number;
  rating: number;
  maxParticipants: number;
  minParticipants: number; // 최소 진행 인원
  underMinPolicy: UnderMinParticipantsPolicy; // 최소 인원 미달 시 처리 방침 (강사가 출발 30일 전 결정 시점에 선택한 값)
  autoCloseProcessed: boolean; // 자동 마감/최소인원 평가 로직 중복 실행 방지 플래그
  underMinDecisionPending: boolean; // 출발 30일 전 최소 인원 미달로 강사의 진행/취소 결정이 필요한 상태
  status: "open" | "closed";
  description: string;
  inclusions: string[];
  exclusions: string[];
  prepNotes: string;
  customOptions: TourOption[];
  isConfirmed: boolean; // 출발 확정 여부 (미확정 시 전액 환불 규정 적용)
  pledgeSignerName?: string;
  pledgeAgreedAt?: string;
  pledgeSignatureDataUrl?: string;
  instructorNotice?: string; // 참가자 대시보드/그룹채팅 상단에 고정되는 강사 공지
  itineraryDays?: TourItineraryDay[]; // 참가자 대시보드 [일정] 탭
  meetingPoint: string; // 집합 장소 (투어 생성 시 필수 입력)
  meetingTime: string; // 집합 시간 (투어 생성 시 필수 입력)
  /** 관리자가 투어를 검토 후 정지(즉시 예약 차단, 검색 노출 제거)하거나 보류(임시 비공개)한 상태. 없으면 정상. */
  adminStatus?: "suspended" | "held";
}

export const UNDER_MIN_PARTICIPANTS_POLICIES = ["proceed", "cancel"] as const;
export type UnderMinParticipantsPolicy = (typeof UNDER_MIN_PARTICIPANTS_POLICIES)[number];

export const UNDER_MIN_POLICY_LABELS: Record<UnderMinParticipantsPolicy, string> = {
  proceed: "그대로 진행",
  cancel: "투어 취소 (전액 환불)",
};

/** 자동 모집 마감 기준: 투어 출발일 이 일수 전. */
export const RECRUITMENT_AUTO_CLOSE_DAYS_BEFORE_START = 30;

export type PaymentMethod = "card" | "kakaopay" | "naverpay" | "tosspay" | "applepay";

export interface Invoice {
  basePrice: number;
  optionsCost: number;
  selectedOptions: SelectedOption[];
  platformFee: number;
  totalDue: number;
  onSiteBalance: number;
  couponCode?: string;
  discountAmount?: number;
}

export type CouponDiscountType = "percent" | "fixed";

/** 관리자가 발급하는 할인 쿠폰. 결제 금액에서만 차감되며 강사 정산 원금에는 영향을 주지 않는다. */
export interface Coupon {
  id: string;
  code: string; // 대문자로 정규화해 저장
  discountType: CouponDiscountType;
  discountValue: number; // percent: 1-100, fixed: 원 단위
  minPurchase: number; // 이 금액(소계) 이상일 때만 사용 가능
  maxDiscount?: number; // percent 타입일 때 할인 상한액(선택)
  expiresAt?: string; // ISO date, 미설정 시 무기한
  usageLimit?: number; // 총 사용 가능 횟수, 미설정 시 무제한
  usedCount: number;
  active: boolean;
  createdAt: string;
}

export interface Settlement {
  basePrice: number;
  firstAmount: number; // 80%
  secondAmount: number; // 20%
}

export type DepositStatus = "pending" | "paid";

export type BookingStatus = "confirmed" | "cancelled" | "cancel_pending_review";

export interface Booking {
  id: string;
  tourId: string;
  diverId: string;
  diverName: string;
  basePrice: number;
  optionsCost: number;
  selectedOptions: SelectedOption[];
  platformFee: number;
  totalPaid: number;
  onSiteBalance: number;
  couponCode?: string;
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  gender: Gender;
  snoring: boolean;
  smoking: boolean;
  drinking: boolean;
  roomNote?: string; // 룸 배정 참고사항 직접 입력 (예: "코골이 심함, 조용한 방 희망")
  roomNo?: string;
  depositStatus: DepositStatus;
  status: BookingStatus;
  createdAt: string;
  cancelReason?: string;
  refundRate?: number; // 0-1
  refundAmount?: number;
  cancelRequestedAt?: string;
  evidenceFileNames?: string[];
  flightInfo?: string; // 참가자 대시보드 [더보기] — 본인 항공편 정보 (본인/강사만 확인)
  passportInfo?: string; // 참가자 대시보드 [더보기] — 여권 정보(만료일 등, 본인/강사만 확인)
}

export const CANCEL_REASONS = [
  "단순 변심",
  "일정 변경",
  "강사·투어사 사정",
  "의료·천재지변 등 불가피한 사유",
  "기타",
] as const;

export type CancelReason = (typeof CANCEL_REASONS)[number];

export const VIOLATION_TYPES = [
  "노쇼 (No-Show)",
  "안전수칙 위반",
  "허위 정보 게재",
  "부적절한 언행",
  "정산 지연",
  "장비 미점검",
] as const;

export type ViolationType = (typeof VIOLATION_TYPES)[number];

export interface Penalty {
  id: string;
  instructorId: string;
  violationType: ViolationType;
  description: string;
  createdAt: string;
}

export type PayoutStatus = "scheduled" | "held" | "released" | "cancelled";

export interface Payout {
  id: string;
  instructorId: string;
  bookingId: string;
  firstAmount: number;
  secondAmount: number;
  status: PayoutStatus;
}

export type ReportStatus = "pending" | "resolved";

export interface Report {
  id: string;
  targetType: "instructor" | "diver";
  targetId: string;
  targetName: string;
  violationType: ViolationType;
  description: string;
  status: ReportStatus;
  createdAt: string;
}

export interface ReviewCategoryRatings {
  instructorKindness: number;
  instructorExpertise: number;
  instructorSafety: number;
  centerFacility: number;
  centerCleanliness: number;
  centerLocation: number;
  tourSatisfaction: number;
  tourSchedule: number;
  tourValue: number;
}

/** "public": 모두에게 공개, "instructor_only": 담당 강사/관리자에게만 공개. */
export type ReviewVisibility = "public" | "instructor_only";

export interface Review {
  id: string;
  tourId: string;
  bookingId: string;
  diverId: string;
  instructorId?: string;
  rating: number; // 1-5 (전체 평점)
  title?: string;
  comment: string;
  categoryRatings?: ReviewCategoryRatings;
  photos: string[]; // 최대 10장
  videoUrl?: string;
  visibility: ReviewVisibility;
  reported: boolean;
  deleted: boolean;
  createdAt: string;
  instructorReply?: string;
  instructorReplyAt?: string;
}

export const INQUIRY_CATEGORIES = [
  "안전사고 신고",
  "강사 관련 불만",
  "환불/취소 문의",
  "기타 문의",
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export type InquiryStatus = "pending" | "answered";

export interface Inquiry {
  id: string;
  tourId: string;
  bookingId: string;
  diverId: string;
  category: InquiryCategory;
  message: string;
  status: InquiryStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  tourId: string;
  senderProfileId: string;
  senderName: string;
  senderRole: "diver" | "instructor" | "admin";
  body: string;
  createdAt: string;
}

// "violation"/"enforcement"는 과거(마이그레이션 이전) 강사 전용 정책의 레거시 카테고리로,
// 새 데이터는 diver/instructor로 명확히 구분된 카테고리를 사용한다.
export type PolicyCategory =
  | "refund"
  | "violation"
  | "enforcement"
  | "violation_diver"
  | "enforcement_diver"
  | "violation_instructor"
  | "enforcement_instructor";

export interface Policy {
  id: string;
  category: PolicyCategory;
  sortOrder: number;
  title: string;
  description: string | null;
  rate: string | null;
}

export type InstructorNotificationType =
  | "new_booking"
  | "forced_refund_penalty"
  | "min_participants_cancelled" // 최소 인원 미달로 예약 자동 취소/환불됨 (예약 단위)
  | "min_participants_proceed" // 최소 인원 미달이지만 강사가 "그대로 진행"을 선택해 투어 진행 (투어 단위, 책임 리마인드)
  | "min_participants_decision_needed"; // 출발 30일 전, 최소 인원 미달로 강사의 진행/취소 결정이 필요함 (투어 단위)

export interface InstructorNotification {
  id: string;
  instructorId: string;
  tourId: string;
  bookingId?: string; // 투어 단위 알림(min_participants_proceed)에는 없음
  tourTitle: string;
  diverName?: string; // 마스킹된 이름 저장 (예: 홍*동), 투어 단위 알림에는 없음
  selectedOptionNames?: string[];
  settlementAmount?: number; // 수수료 제외 강사 원금 정산 예정 금액
  createdAt: string;
  read: boolean;
  type: InstructorNotificationType;
}

export interface ArbitrationMessage {
  id: string;
  roomId: string; // 관례: `arb-{instructorId}`
  instructorId: string;
  senderRole: "instructor" | "admin";
  senderName: string;
  body: string;
  attachmentNames?: string[];
  createdAt: string;
}

export const SUPPORT_FAQ_CATEGORIES = ["예약", "환불", "결제", "투어", "강사", "기타"] as const;
export type SupportFaqCategory = (typeof SUPPORT_FAQ_CATEGORIES)[number];

export const DISPUTE_TYPES = ["예약 관련", "환불 관련", "안전 문제", "서비스 불만", "기타"] as const;
export type DisputeType = (typeof DISPUTE_TYPES)[number];

export const REPORT_TICKET_TYPES = ["욕설", "외부거래", "허위정보", "성희롱", "노쇼", "기타"] as const;
export type ReportTicketType = (typeof REPORT_TICKET_TYPES)[number];

export type SupportTicketType = "inquiry" | "dispute" | "report";
export type SupportTicketStatus = "접수" | "검토중" | "답변완료" | "종료";

export const SUPPORT_TICKET_STATUSES: SupportTicketStatus[] = ["접수", "검토중", "답변완료", "종료"];

/** 플랫폼 고객센터 통합 접수(1:1 문의 / 분쟁조정 / 신고)를 표현한다. */
export interface SupportTicket {
  id: string;
  userId: string;
  bookingId?: string;
  type: SupportTicketType;
  category?: string;
  title?: string;
  content: string;
  attachmentNames: string[];
  status: SupportTicketStatus;
  adminReply?: string;
  createdAt: string;
}

export const NOTICE_CATEGORIES = ["일반", "점검", "이벤트", "정책 변경", "안전"] as const;
export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];

/** 관리자가 등록하는 플랫폼 공지사항. */
export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  pinned: boolean;
  createdAt: string;
}

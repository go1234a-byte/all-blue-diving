import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  ArbitrationMessage,
  Booking,
  Center,
  ChatMessage,
  Coupon,
  DiveCenter,
  Inquiry,
  InquiryCategory,
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
  TourItineraryDay,
  TourOption,
  UnderMinParticipantsPolicy,
} from "@/types";
import { MOCK_ADMIN_PROFILE, MOCK_DIVE_CENTERS } from "@/data/mockData";
import { computeSettlement } from "@/lib/pricing";
import { computeRefundRate, computeRefundAmount } from "@/lib/refund";
import { shouldEvaluateAutoClose, MIN_PARTICIPANTS_AUTO_CANCEL_REASON } from "@/lib/tourAutoClose";
import { sendPushToProfile } from "@/lib/push";
import { maskName } from "@/lib/masking";
import { supabase } from "@/integrations/supabase/client";

const BOOKMARK_STORAGE_KEY = "allblue-bookmarked-tours";

function mapInstructorRow(row: {
  id: string;
  profile_id: string | null;
  name: string;
  avatar_url: string | null;
  agency: string | null;
  license_file_names: string[] | null;
  signature_data_url: string | null;
  verified_status: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  pledge_signed?: boolean | null;
  pledge_signed_at?: string | null;
  pledge_version?: string | null;
  total_logs: number;
  experience_years: number;
  completion_rate: number;
  rating: number;
  penalty_count: number;
  bio: string | null;
  languages?: string[] | null;
}): InstructorProfile {
  return {
    id: row.id,
    profileId: row.profile_id ?? "",
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    agency: row.agency ?? undefined,
    licenseFileNames: row.license_file_names ?? [],
    signatureDataUrl: row.signature_data_url ?? undefined,
    verified: row.verified_status,
    verifiedAt: row.verified_at ?? undefined,
    verifiedBy: row.verified_by ?? undefined,
    pledgeSigned: row.pledge_signed ?? false,
    pledgeSignedAt: row.pledge_signed_at ?? undefined,
    pledgeVersion: row.pledge_version ?? undefined,
    totalLogs: row.total_logs,
    experienceYears: row.experience_years,
    completionRate: Number(row.completion_rate),
    rating: Number(row.rating),
    penaltyCount: row.penalty_count,
    bio: row.bio ?? "",
    languages: row.languages ?? undefined,
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
}

interface NewTourInput {
  instructorId: string;
  centerId?: string;
  title: string;
  country: string;
  site: string;
  activityTypes: Tour["activityTypes"];
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
}

interface NewInstructorSignupInput {
  name: string;
  phone: string;
  gender: Profile["gender"];
  licenseFileNames: string[];
  signatureDataUrl?: string;
  bio: string;
  pledgeSigned?: boolean;
  settlementPledgeAgreed?: boolean;
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
  adminProfile: Profile;
  bookings: Booking[];
  bookingsLoading: boolean;
  payouts: Payout[];
  penalties: Penalty[];
  reports: Report[];
  chatMessages: ChatMessage[];
  bookmarkedTourIds: string[];
  reviews: Review[];
  inquiries: Inquiry[];
  instructorNotifications: InstructorNotification[];
  arbitrationMessages: ArbitrationMessage[];
  centers: Center[];
  centersLoading: boolean;
  supportTickets: SupportTicket[];
  supportTicketsLoading: boolean;
  notices: Notice[];
  coupons: Coupon[];

  addTour: (input: NewTourInput) => Promise<Tour>;
  resolveUnderMinDecision: (tourId: string, decision: UnderMinParticipantsPolicy) => Promise<void>;
  updateTourNotice: (tourId: string, notice: string) => Promise<void>;
  updateTourItinerary: (tourId: string, days: TourItineraryDay[]) => Promise<void>;
  updateTourMeetingInfo: (tourId: string, meetingPoint: string, meetingTime: string) => Promise<void>;
  setTourAdminStatus: (tourId: string, adminStatus: Tour["adminStatus"]) => Promise<void>;
  deleteTour: (tourId: string) => Promise<void>;
  updateBookingTravelInfo: (bookingId: string, input: { flightInfo?: string; passportInfo?: string }) => Promise<void>;
  updateDiverProfile: (
    diverId: string,
    updates: {
      cCardAgency?: string;
      cCardNumber?: string;
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
  setInstructorPenalty: (instructorId: string, penaltyCount: number) => Promise<void>;
  updateInstructorProfile: (
    instructorId: string,
    updates: { name?: string; phone?: string; agency?: string; bio?: string; licenseFileNames?: string[] },
  ) => Promise<void>;
  toggleBookmark: (tourId: string) => void;
  isBookmarked: (tourId: string) => boolean;
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
  submitCancellationForReview: (bookingId: string, reason: string, evidenceFileNames: string[]) => Promise<void>;
  resolveCancellationReview: (bookingId: string, approved: boolean) => Promise<void>;
  addArbitrationMessage: (input: Omit<ArbitrationMessage, "id" | "createdAt">) => ArbitrationMessage;
  addCenter: (input: NewCenterInput) => Promise<Center>;
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
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [toursLoading, setToursLoading] = useState(true);
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [instructorProfiles, setInstructorProfiles] = useState<Profile[]>([]);
  const [diverProfiles, setDiverProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [penalties] = useState<Penalty[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [instructorNotifications, setInstructorNotifications] = useState<InstructorNotification[]>([]);
  const [arbitrationMessages, setArbitrationMessages] = useState<ArbitrationMessage[]>([]);
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
  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from("instructors").select("*").order("id");
      if (!active) return;
      if (!error && data) setInstructors(data.map(mapInstructorRow));
      setInstructorsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(BOOKMARK_STORAGE_KEY, JSON.stringify(bookmarkedTourIds));
  }, [bookmarkedTourIds]);

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
      const { data, error } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
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
        supabase.from("payouts").select("*").order("created_at", { ascending: false }),
        supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").is("deleted_at", null),
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
        const toProfile = (row: (typeof rows)[number]): Profile => ({
          id: row.id,
          role: row.role,
          name: row.name,
          phone: row.phone ?? "",
          gender: row.gender ?? "male",
          status: row.status,
          createdAt: row.created_at,
          snoring: row.snoring ?? false,
          smoking: row.smoking ?? false,
          cCardAgency: row.c_card_agency ?? undefined,
          cCardNumber: row.c_card_number ?? undefined,
          logCount: row.log_count ?? undefined,
          emergencyContactName: row.emergency_contact_name ?? undefined,
          emergencyContactPhone: row.emergency_contact_phone ?? undefined,
          insuranceInfo: row.insurance_info ?? undefined,
        });
        setDiverProfiles(rows.filter((r) => r.role === "diver").map(toProfile));
        setInstructorProfiles(rows.filter((r) => r.role === "instructor").map(toProfile));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

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
        void supabase.from("tours").update({ status: "closed", auto_close_processed: true }).eq("id", tour.id);
        return;
      }

      setTours((prev) =>
        prev.map((t) =>
          t.id === tour.id
            ? { ...t, status: "closed", autoCloseProcessed: true, underMinDecisionPending: true }
            : t,
        ),
      );
      void supabase
        .from("tours")
        .update({ status: "closed", auto_close_processed: true, under_min_decision_pending: true })
        .eq("id", tour.id);

      const notification: InstructorNotification = {
        id: nextId("noti"),
        instructorId: tour.instructorId,
        tourId: tour.id,
        tourTitle: tour.title,
        createdAt: new Date().toISOString(),
        read: false,
        type: "min_participants_decision_needed",
      };
      setInstructorNotifications((prev) => [notification, ...prev]);
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
            }
          : t,
      ),
    );
    void supabase
      .from("tours")
      .update({
        under_min_policy: decision,
        under_min_decision_pending: false,
        ...(decision === "cancel" ? { is_confirmed: false } : {}),
      })
      .eq("id", tourId);

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

        const notification: InstructorNotification = {
          id: nextId("noti"),
          instructorId: tour.instructorId,
          tourId: tour.id,
          bookingId: booking.id,
          tourTitle: tour.title,
          diverName: maskName(booking.diverName),
          selectedOptionNames: booking.selectedOptions.map((o) => o.name),
          settlementAmount: 0,
          createdAt: cancelRequestedAt,
          read: false,
          type: "min_participants_cancelled",
        };
        setInstructorNotifications((prev) => [notification, ...prev]);
        notifyDiverPush(
          booking.diverId,
          "투어가 취소되었습니다",
          `${tour.title} 투어가 최소 인원 미달로 취소되어 전액 환불됩니다.`,
          "/mypage",
        );
      });
    } else {
      // "그대로 진행" — 투어 단위로 강사에게 책임 리마인드 알림을 1건 발행하고, 확정 다이버들에게도 알린다.
      const notification: InstructorNotification = {
        id: nextId("noti"),
        instructorId: tour.instructorId,
        tourId: tour.id,
        tourTitle: tour.title,
        createdAt: new Date().toISOString(),
        read: false,
        type: "min_participants_proceed",
      };
      setInstructorNotifications((prev) => [notification, ...prev]);
      confirmedBookings.forEach((booking) => {
        notifyDiverPush(
          booking.diverId,
          "투어가 예정대로 진행됩니다",
          `${tour.title} 투어가 최소 인원 미달이지만 예정대로 진행됩니다.`,
          `/chat/${tourId}`,
        );
      });
    }
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
   * 관리자 — 투어를 정지(즉시 예약 차단 + 검색 노출 제거) 또는 보류(임시 비공개) 처리한다.
   * adminStatus를 undefined로 넘기면 정상 상태로 복귀(재개)시킨다.
   */
  const setTourAdminStatus = async (tourId: string, adminStatus: Tour["adminStatus"]) => {
    setTours((prev) => prev.map((t) => (t.id === tourId ? { ...t, adminStatus } : t)));
    await supabase.from("tours").update({ admin_status: adminStatus ?? null }).eq("id", tourId);
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
      cCardAgency?: string;
      cCardNumber?: string;
      logCount?: number;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      insuranceInfo?: string;
    },
  ): Promise<void> => {
    setDiverProfiles((prev) =>
      prev.map((p) => (p.id === diverId ? { ...p, ...updates } : p)),
    );
    await supabase
      .from("profiles")
      .update({
        ...(updates.cCardAgency !== undefined ? { c_card_agency: updates.cCardAgency } : {}),
        ...(updates.cCardNumber !== undefined ? { c_card_number: updates.cCardNumber } : {}),
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
  };

  const addBooking = async (input: NewBookingInput): Promise<Booking> => {
    const diverId = input.diverId ?? nextId("guest-diver");
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
        deposit_status: "paid",
        status: "confirmed",
      })
      .select()
      .single();

    const booking: Booking = !error && data
      ? mapBookingRow(data)
      : {
          id: nextId("bk"),
          depositStatus: "paid",
          status: "confirmed",
          createdAt: new Date().toISOString(),
          ...input,
          diverId,
        };
    setBookings((prev) => [booking, ...prev]);

    const tour = tours.find((t) => t.id === input.tourId);
    if (tour) {
      const settlement = computeSettlement(input.basePrice, input.optionsCost);
      const { data: payoutData, error: payoutError } = await supabase
        .from("payouts")
        .insert({
          instructor_id: tour.instructorId,
          booking_id: booking.id,
          first_amount: settlement.firstAmount,
          second_amount: settlement.secondAmount,
          status: "scheduled",
        })
        .select()
        .single();

      const payout: Payout = !payoutError && payoutData
        ? mapPayoutRow(payoutData)
        : {
            id: nextId("po"),
            instructorId: tour.instructorId,
            bookingId: booking.id,
            firstAmount: settlement.firstAmount,
            secondAmount: settlement.secondAmount,
            status: "scheduled",
          };
      setPayouts((prev) => [payout, ...prev]);

      // 트랜잭션이 확정되는 즉시(=예약 생성 시점) 담당 강사에게 실시간 알림을 발행한다.
      const notification: InstructorNotification = {
        id: nextId("noti"),
        instructorId: tour.instructorId,
        tourId: tour.id,
        bookingId: booking.id,
        tourTitle: tour.title,
        diverName: maskName(input.diverName),
        selectedOptionNames: input.selectedOptions.map((o) => o.name),
        settlementAmount: input.basePrice + input.optionsCost,
        createdAt: new Date().toISOString(),
        read: false,
        type: "new_booking",
      };
      setInstructorNotifications((prev) => [notification, ...prev]);
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
    };
    setInstructorProfiles((prev) => [...prev, profile]);

    const instructorId = nextId("inst");
    const pledgeSignedAt = input.pledgeSigned ? new Date().toISOString() : undefined;
    const instructorProfile: InstructorProfile = {
      id: instructorId,
      profileId,
      name: input.name,
      licenseFileNames: input.licenseFileNames,
      signatureDataUrl: input.signatureDataUrl,
      verified: false,
      pledgeSigned: input.pledgeSigned ?? false,
      pledgeSignedAt,
      pledgeVersion: input.pledgeSigned ? "v1" : undefined,
      totalLogs: 0,
      experienceYears: 0,
      completionRate: 0,
      rating: 0,
      penaltyCount: 0,
      bio: input.bio,
    };

    // Enter Cloud(Supabase)에 신규 강사 신청 기록 (관리자 인증 대기 상태)
    await supabase.from("instructors").insert({
      id: instructorId,
      profile_id: profileId,
      name: input.name,
      license_file_names: input.licenseFileNames,
      signature_data_url: input.signatureDataUrl,
      verified_status: false,
      pledge_signed: input.pledgeSigned ?? false,
      pledge_signed_at: pledgeSignedAt,
      pledge_version: input.pledgeSigned ? "v1" : undefined,
      bio: input.bio,
    });

    setInstructors((prev) => [...prev, instructorProfile]);
    return instructorProfile;
  };

  const setInstructorVerified = async (instructorId: string, verified: boolean, verifiedBy?: string): Promise<void> => {
    const verifiedAt = verified ? new Date().toISOString() : undefined;
    await supabase
      .from("instructors")
      .update({ verified_status: verified, verified_at: verifiedAt, verified_by: verifiedBy })
      .eq("id", instructorId);
    setInstructors((prev) =>
      prev.map((i) => (i.id === instructorId ? { ...i, verified, verifiedAt, verifiedBy } : i)),
    );
  };

  /**
   * 관리자 — 강사에게 경고를 주거나(+1) 경고를 해제한다(0으로 초기화).
   * 누적 경고가 2회 이상이 되면 연결된 계정(profiles)을 자동으로 영구정지 처리한다.
   */
  const setInstructorPenalty = async (instructorId: string, penaltyCount: number): Promise<void> => {
    await supabase.from("instructors").update({ penalty_count: penaltyCount }).eq("id", instructorId);
    setInstructors((prev) => prev.map((i) => (i.id === instructorId ? { ...i, penaltyCount } : i)));

    if (penaltyCount >= 2) {
      const instructor = instructors.find((i) => i.id === instructorId);
      if (instructor?.profileId) {
        await setProfileStatus(instructor.profileId, "suspended");
      }
    }
  };

  const updateInstructorProfile = async (
    instructorId: string,
    updates: { name?: string; phone?: string; agency?: string; bio?: string; licenseFileNames?: string[] },
  ): Promise<void> => {
    const instructor = instructors.find((i) => i.id === instructorId);

    // instructors 테이블: 이름/소속/자기소개/자격증 파일명 갱신
    await supabase
      .from("instructors")
      .update({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.agency !== undefined ? { agency: updates.agency } : {}),
        ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
        ...(updates.licenseFileNames !== undefined ? { license_file_names: updates.licenseFileNames } : {}),
      })
      .eq("id", instructorId);

    setInstructors((prev) =>
      prev.map((i) =>
        i.id === instructorId
          ? {
              ...i,
              ...(updates.name !== undefined ? { name: updates.name } : {}),
              ...(updates.agency !== undefined ? { agency: updates.agency } : {}),
              ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
              ...(updates.licenseFileNames !== undefined ? { licenseFileNames: updates.licenseFileNames } : {}),
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
    void supabase.from("profiles").update({ status }).eq("id", profileId);
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

    const report: Report = !error && data
      ? mapReportRow(data)
      : { id: nextId("rp"), status: "pending", createdAt: new Date().toISOString(), ...input };
    setReports((prev) => [report, ...prev]);
  };

  const resolveReport = async (reportId: string) => {
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
  };

  const addChatMessage = async (input: Omit<ChatMessage, "id" | "createdAt">) => {
    // realtime 구독이 로컬 state를 갱신하므로 여기서는 insert만 수행한다 (낙관적 업데이트 없음).
    await supabase.from("chat_messages").insert({
      tour_id: input.tourId,
      sender_profile_id: input.senderProfileId,
      sender_name: input.senderName,
      sender_role: input.senderRole,
      body: input.body,
    });
  };

  const toggleBookmark = (tourId: string) => {
    setBookmarkedTourIds((prev) =>
      prev.includes(tourId) ? prev.filter((id) => id !== tourId) : [...prev, tourId],
    );
  };

  const isBookmarked = (tourId: string) => bookmarkedTourIds.includes(tourId);

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

    const inquiry: Inquiry = !error && data
      ? mapInquiryRow(data)
      : { id: nextId("inq"), status: "pending", createdAt: new Date().toISOString(), ...input };
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

    const review: Review = !error && data
      ? mapReviewRow(data)
      : {
          id: nextId("rv"),
          createdAt: new Date().toISOString(),
          reported: false,
          deleted: false,
          ...input,
          photos: input.photos ?? [],
          visibility: input.visibility ?? "public",
        };
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
    await supabase.from("reviews").update({ reported: true }).eq("id", reviewId);
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

    const coupon: Coupon = !error && data
      ? mapCouponRow(data)
      : { id: nextId("coupon"), createdAt: new Date().toISOString(), usedCount: 0, ...input, code: normalizedCode };
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
    await supabase.from("coupons").update({ used_count: usedCount }).eq("id", couponId);
  };

  const deleteReview = async (reviewId: string) => {
    setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, deleted: true } : r)));
    await supabase.from("reviews").update({ deleted: true }).eq("id", reviewId);
  };

  const markInstructorNotificationRead = (notificationId: string) => {
    setInstructorNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
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
    await supabase.from("payouts").update({ status: "cancelled" }).eq("booking_id", bookingId).neq("status", "released");

    return { refundRate, refundAmount };
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
  const resolveCancellationReview = async (bookingId: string, approved: boolean) => {
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
      await supabase.from("payouts").update({ status: "cancelled" }).eq("booking_id", bookingId).neq("status", "released");

      // 관리자가 [강제 환불 승인]을 실행하는 즉시 담당 강사에게 고위험 페널티 알림을 발행한다.
      if (booking && tour) {
        const notification: InstructorNotification = {
          id: nextId("noti"),
          instructorId: tour.instructorId,
          tourId: tour.id,
          bookingId: booking.id,
          tourTitle: tour.title,
          diverName: maskName(booking.diverName),
          selectedOptionNames: booking.selectedOptions.map((o) => o.name),
          settlementAmount: booking.basePrice + booking.optionsCost,
          createdAt: new Date().toISOString(),
          read: false,
          type: "forced_refund_penalty",
        };
        setInstructorNotifications((prev) => [notification, ...prev]);
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
    }
  };

  /** 강사-최고관리자 비밀 중재방에 메시지(및 첨부파일)를 추가한다. */
  const addArbitrationMessage = (input: Omit<ArbitrationMessage, "id" | "createdAt">): ArbitrationMessage => {
    const message: ArbitrationMessage = {
      id: nextId("arbmsg"),
      createdAt: new Date().toISOString(),
      ...input,
    };
    setArbitrationMessages((prev) => [...prev, message]);
    return message;
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
      })
      .select()
      .single();

    if (!error && data) {
      const center = mapCenterRow(data);
      setCenters((prev) => [...prev, center]);
      return center;
    }

    const fallback: Center = {
      id: nextId("center"),
      createdAt: new Date().toISOString(),
      ...input,
    };
    setCenters((prev) => [...prev, fallback]);
    return fallback;
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

    if (!error && data) {
      const ticket = mapSupportTicketRow(data);
      setSupportTickets((prev) => [ticket, ...prev]);
      return ticket;
    }

    const fallback: SupportTicket = {
      id: nextId("ticket"),
      status: "접수",
      createdAt: new Date().toISOString(),
      ...input,
      attachmentNames: input.attachmentNames ?? [],
    };
    setSupportTickets((prev) => [fallback, ...prev]);
    return fallback;
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
      adminProfile: MOCK_ADMIN_PROFILE,
      bookings,
      bookingsLoading,
      payouts,
      penalties,
      reports,
      chatMessages,
      bookmarkedTourIds,
      reviews,
      inquiries,
      instructorNotifications,
      arbitrationMessages,
      centers,
      centersLoading,
      supportTickets,
      supportTicketsLoading,
      notices,
      coupons,
      addTour,
      resolveUnderMinDecision,
      updateTourNotice,
      updateTourItinerary,
      updateTourMeetingInfo,
      setTourAdminStatus,
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
      setInstructorPenalty,
      updateInstructorProfile,
      toggleBookmark,
      isBookmarked,
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
      submitCancellationForReview,
      resolveCancellationReview,
      addArbitrationMessage,
      addCenter,
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
      bookings,
      bookingsLoading,
      payouts,
      penalties,
      reports,
      chatMessages,
      bookmarkedTourIds,
      reviews,
      inquiries,
      instructorNotifications,
      arbitrationMessages,
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

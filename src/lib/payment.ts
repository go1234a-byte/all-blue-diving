import { supabase } from "@/integrations/supabase/client";
import type { NewBookingInput } from "@/contexts/AppDataContext";
import type { PaymentMethod } from "@/types";

/**
 * 토스페이먼츠 결제위젯 클라이언트 키.
 * 발급 방법: https://app.tosspayments.com/signup (이메일만으로 무료 가입)
 * → 개발자센터 API 키 메뉴 → "결제위젯 연동 키" 탭 → 개발 연동 체험 상점의 테스트 클라이언트 키(test_ck_.../test_gck_...)를
 *   .env 파일의 VITE_TOSS_CLIENT_KEY 에 등록하세요.
 * 정식 계약(상점 MID) 승인 전까지는 토스 공식 문서의 공용 테스트 키로 폴백해 결제위젯이 항상 렌더링되도록 한다.
 * (PG 계약 심사·앱스토어 심사 모두 "결제창이 실제로 뜨는지"를 확인하므로.)
 * 공용 테스트 키로는 실제 승인이 되지 않으며, 승인 검증(verify-payment)에는 매칭되는 시크릿 키가 서버에 필요하다.
 */
// VITE_TOSS_CLIENT_KEY 미설정 시 토스 공용 문서 테스트 키(결제위젯 v2)로 폴백 — 결제창은 뜨지만
// 서버 승인 검증(verify-payment)에는 같은 상점의 시크릿 키가 필요하다(공용 키엔 공개 시크릿 없음).
const TOSS_DOCS_TEST_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
export const TOSS_CLIENT_KEY =
  (import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined) || TOSS_DOCS_TEST_CLIENT_KEY;

/** 예약 하나당 고유 주문번호. 토스페이먼츠 규격: 영문/숫자/-_= 로 구성된 6~64자. */
export function generateOrderId(): string {
  const random = crypto.randomUUID().replace(/-/g, "");
  return `allblue-${Date.now()}-${random}`.slice(0, 64);
}

/**
 * 결제 승인(리다이렉트) 이전에는 예약(Booking)을 만들 수 없으므로,
 * 결제창으로 이동하기 직전 예약에 필요한 정보를 orderId 기준으로 로컬에 임시 저장해둔다.
 * 결제 성공 리다이렉트(/payment/success)에서 이 값을 읽어 서버 검증 후 addBooking()을 호출한다.
 */
export type PendingBookingPayload = Omit<NewBookingInput, "paymentMethod">;

const PENDING_BOOKING_KEY_PREFIX = "allblue-pending-booking-";

export function savePendingBooking(orderId: string, payload: PendingBookingPayload): void {
  window.localStorage.setItem(`${PENDING_BOOKING_KEY_PREFIX}${orderId}`, JSON.stringify(payload));
}

export function loadPendingBooking(orderId: string): PendingBookingPayload | null {
  const raw = window.localStorage.getItem(`${PENDING_BOOKING_KEY_PREFIX}${orderId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingBookingPayload;
  } catch {
    return null;
  }
}

export function clearPendingBooking(orderId: string): void {
  window.localStorage.removeItem(`${PENDING_BOOKING_KEY_PREFIX}${orderId}`);
}

export interface VerifyPaymentResult {
  verified: boolean;
  skeleton?: boolean;
  message?: string;
  error?: string;
  method?: string;
  easyPayProvider?: string;
}

/** 서버(Edge Function)에 결제 승인 검증을 요청한다. 클라이언트는 이 결과를 신뢰하지 않고 반드시 서버 검증을 거친다. */
export async function verifyTossPayment(params: {
  paymentKey: string;
  orderId: string;
  amount: number;
}): Promise<VerifyPaymentResult> {
  const { data, error } = await supabase.functions.invoke("verify-payment", { body: params });
  if (error) {
    return { verified: false, error: error.message };
  }
  return data as VerifyPaymentResult;
}

/** 토스페이먼츠 결제 승인 응답의 결제수단을 앱 내부 PaymentMethod 값으로 매핑한다. */
export function mapTossMethodToPaymentMethod(method?: string, easyPayProvider?: string): PaymentMethod {
  if (easyPayProvider) {
    if (easyPayProvider.includes("토스")) return "tosspay";
    if (easyPayProvider.includes("카카오")) return "kakaopay";
    if (easyPayProvider.includes("네이버")) return "naverpay";
    if (easyPayProvider.toLowerCase().includes("apple")) return "applepay";
  }
  return "card";
}

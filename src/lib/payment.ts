import { supabase } from "@/integrations/supabase/client";
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
/** 운영에서 테스트 키면 돈이 오가지 않으므로 결제를 받지 않는다. 라이브 키를 등록하면 자동으로 풀린다. */
export const PAYMENTS_BLOCKED = import.meta.env.PROD && TOSS_CLIENT_KEY.startsWith("test_");

/** 결제 전에 서버가 주문을 만들고 금액을 계산한다. 결제창에는 이 금액(과 orderId)만 쓴다. */
export interface CreateOrderInput {
  tourId: string;
  participantCount: number;
  selectedOptions: { name: string; price: number }[];
  couponCode?: string;
  diverName: string;
  gender: string;
  snoring: boolean;
  smoking: boolean;
  drinking: boolean;
  roomNote?: string;
  companions?: unknown[];
  companionNames?: string;
}

export async function createPaymentOrder(input: CreateOrderInput): Promise<{ orderId: string; amount: number }> {
  const { data, error } = await supabase.rpc("create_payment_order" as never, {
    p_tour_id: input.tourId,
    p_participant_count: input.participantCount,
    p_selected_options: input.selectedOptions,
    p_coupon_code: input.couponCode ?? null,
    p_diver_name: input.diverName,
    p_gender: input.gender,
    p_snoring: input.snoring,
    p_smoking: input.smoking,
    p_drinking: input.drinking,
    p_room_note: input.roomNote ?? null,
    p_companions: input.companions ?? [],
    p_companion_names: input.companionNames ?? null,
  } as never);
  if (error) throw new Error(error.message);
  const raw = data as unknown;
  const row = (Array.isArray(raw) ? raw[0] : raw) as { order_id: string; amount: number | string } | null | undefined;
  if (!row) throw new Error("주문을 만들지 못했습니다.");
  return { orderId: row.order_id, amount: Number(row.amount) };
}

export interface VerifyPaymentResult {
  verified: boolean;
  skeleton?: boolean;
  message?: string;
  error?: string;
  bookingId?: string;
  method?: string;
  easyPayProvider?: string;
  refunded?: boolean;
}

/** 서버(Edge Function)에 결제 승인과 예약 생성을 요청한다. 금액은 보내지 않는다(서버가 주문에 저장한 금액을 쓴다). */
export async function verifyTossPayment(params: {
  paymentKey: string;
  orderId: string;
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

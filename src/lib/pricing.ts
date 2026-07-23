import type { Coupon, Invoice, SelectedOption, Settlement } from "@/types";

const PLATFORM_FEE_RATE = 0.1;
const FIRST_SETTLEMENT_RATE = 0.8;
const SECOND_SETTLEMENT_RATE = 0.2;

/**
 * 예약 시 결제 청구서 계산 (전액 결제 + 유료 옵션 합산 로직).
 * - [투어 기본 금액] + [선택 옵션 총 금액] = 투어 금액 소계
 * - [플랫폼 이용 수수료] = 소계의 10%
 * - [쿠폰 할인] = 있다면 총액에서 차감(플랫폼이 부담 — 강사 정산 원금은 basePrice+optionsCost 기준으로 변동 없음)
 * - [최종 총 결제 금액] = 소계 + 플랫폼 이용 수수료 - 할인 금액
 * - 현장 지불 잔금은 0원 (선결제 완료).
 */
export function computeInvoice(
  basePrice: number,
  selectedOptions: SelectedOption[] = [],
  discount?: { code: string; amount: number },
): Invoice {
  const optionsCost = selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const subtotal = basePrice + optionsCost;
  const platformFee = Math.round(subtotal * PLATFORM_FEE_RATE);
  const discountAmount = Math.min(discount?.amount ?? 0, subtotal + platformFee);
  return {
    basePrice,
    optionsCost,
    selectedOptions,
    platformFee,
    totalDue: subtotal + platformFee - discountAmount,
    onSiteBalance: 0,
    ...(discount && discountAmount > 0 ? { couponCode: discount.code, discountAmount } : {}),
  };
}

export interface CouponValidationResult {
  valid: boolean;
  discountAmount: number;
  message?: string;
}

/**
 * 쿠폰 유효성을 검사하고 할인 금액을 계산한다.
 * - 소계(basePrice+optionsCost) 기준으로 최소 구매금액/할인율을 적용한다.
 */
export function validateAndComputeCouponDiscount(
  coupon: Coupon | undefined,
  subtotal: number,
): CouponValidationResult {
  if (!coupon) return { valid: false, discountAmount: 0, message: "존재하지 않는 쿠폰 코드입니다." };
  if (!coupon.active) return { valid: false, discountAmount: 0, message: "비활성화된 쿠폰입니다." };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, discountAmount: 0, message: "유효기간이 만료된 쿠폰입니다." };
  }
  if (coupon.usageLimit !== undefined && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discountAmount: 0, message: "사용 가능 횟수를 초과한 쿠폰입니다." };
  }
  if (subtotal < coupon.minPurchase) {
    return {
      valid: false,
      discountAmount: 0,
      message: `최소 ${coupon.minPurchase.toLocaleString("ko-KR")}원 이상 구매 시 사용 가능합니다.`,
    };
  }

  let discountAmount =
    coupon.discountType === "percent" ? Math.round(subtotal * (coupon.discountValue / 100)) : coupon.discountValue;
  if (coupon.discountType === "percent" && coupon.maxDiscount !== undefined) {
    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
  }
  discountAmount = Math.min(discountAmount, subtotal);

  return { valid: true, discountAmount };
}

/**
 * 강사 정산 스케줄 계산: 기본가 + 옵션 금액(100%) 기준 1차 80% / 2차 20%.
 * 플랫폼 수수료는 소비자가 추가로 부담하므로 강사 정산 원금에서는 제외된다.
 */
export function computeSettlement(basePrice: number, optionsCost = 0): Settlement {
  const principal = basePrice + optionsCost;
  return {
    basePrice: principal,
    firstAmount: Math.round(principal * FIRST_SETTLEMENT_RATE),
    secondAmount: Math.round(principal * SECOND_SETTLEMENT_RATE),
  };
}

export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/**
 * 투어 카드/상세 화면 등에서 "손님이 실제로 결제하게 될 금액"을 미리 보여주기 위한 헬퍼.
 * 체크아웃에서 computeInvoice가 계산하는 [소계 + 플랫폼 이용 수수료(10%)]와 동일한 방식으로,
 * 둘러보는 시점부터 최종 결제 금액과 일치하는 가격을 보여준다.
 */
export function applyPlatformFee(amount: number): number {
  return amount + Math.round(amount * PLATFORM_FEE_RATE);
}

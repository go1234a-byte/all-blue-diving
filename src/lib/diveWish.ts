import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { DivePoint } from "@/content/divePointGuide";

/**
 * "이 바다 가고 싶어요" · 빈자리 알림 · 다이버 알림함 공용 헬퍼.
 *
 * 테이블(dive_wishes / tour_seat_alerts / diver_alerts)은
 * supabase/migrations/20261021000000_dive_wishes_and_diver_alerts.sql 에서 만든다.
 * 생성된 DB 타입(types.ts)에는 아직 없으므로 여기서만 타입 없는 클라이언트로 접근한다.
 * 마이그레이션이 적용되기 전이면 "테이블 없음" 오류가 나는데, 그때는 관련 UI를 숨긴다(available=false).
 */
export const db = supabase as unknown as SupabaseClient;

/** PostgREST가 "그런 테이블/함수 없음"을 돌려줬는지 — 마이그레이션 전 상태 감지용. */
export function isMissingRelation(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    error.code === "PGRST202" ||
    /does not exist|Could not find the (table|function)/i.test(error.message ?? "")
  );
}

/**
 * 포인트 가이드의 지역 문자열을 투어의 country 값과 비교 가능한 "나라" 이름으로 바꾼다.
 * 투어는 강사가 COUNTRIES_SITES 기준 나라명(필리핀·인도네시아·대한민국 …)으로 등록한다.
 */
const COUNTRY_OVERRIDES: Record<string, string> = {
  maldives: "몰디브",
  maldives_baa: "몰디브",
  galapagos: "에콰도르",
  redsea: "이집트",
  redsea_north: "이집트",
  sudan: "수단",
  azores: "포르투갈",
  palau: "팔라우",
  seychelles: "세이셸",
  oman: "오만",
  bonaire: "보네르",
  cayman: "케이맨 제도",
  belize: "벨리즈",
  fiji: "피지",
  frenchpolynesia: "프랑스령 폴리네시아",
  cenotes: "멕시코",
};

export function pointCountry(point: Pick<DivePoint, "id" | "region">): string {
  if (COUNTRY_OVERRIDES[point.id]) return COUNTRY_OVERRIDES[point.id];
  const head = point.region.split("·")[0].split(",")[0];
  return head.replace(/\(.*?\)/g, "").trim();
}

export interface DiveWish {
  id: string;
  pointId: string;
  region: string;
  country: string;
  /** 1~12. 빈 배열이면 "언제든". */
  months: number[];
}

export interface DiverAlert {
  id: string;
  type: "new_tour" | "seat_open";
  tourId: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface WishDemandRow {
  pointId: string;
  country: string;
  /** 0 = 월 상관없음 */
  month: number;
  count: number;
}

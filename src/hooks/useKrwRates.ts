import { useEffect, useState } from "react";
import { fetchKrwRates, type KrwRates } from "@/lib/currency";

/** 원화 기준 환율(하루 1회 갱신, 12시간 캐시). 실패하면 null 로 남고 화면은 환산 줄만 숨긴다. */
export function useKrwRates(enabled = true): { rates: KrwRates | null; failed: boolean } {
  const [rates, setRates] = useState<KrwRates | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetchKrwRates()
      .then((r) => alive && setRates(r))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return { rates, failed };
}

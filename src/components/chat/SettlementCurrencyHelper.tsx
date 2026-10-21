import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useKrwRates } from "@/hooks/useKrwRates";
import { currencyForCountry, formatForeign, fromKrw, SELECTABLE_CURRENCIES, toKrw } from "@/lib/currency";
import { formatKRW } from "@/lib/pricing";

/**
 * 정산 탭(강사 편집) — 현지에서 외화로 낸 영수증 금액을 원화로 바꿔 입력할 수 있게 하는 환산기.
 * 정산 자체는 원화로 저장한다(기존 데이터 구조 유지). 통화는 투어 나라 기준으로 미리 골라 둔다.
 */
export function SettlementCurrencyHelper({ country }: { country: string }) {
  const [code, setCode] = useState(() => currencyForCountry(country)?.code ?? "USD");
  const [value, setValue] = useState("");
  const { rates, failed } = useKrwRates(true);
  if (failed) return null;
  const currency = SELECTABLE_CURRENCIES.find((c) => c.code === code) ?? SELECTABLE_CURRENCIES[0];
  const n = Number(value.replace(/[^\d.]/g, ""));
  const krw = rates && n > 0 ? toKrw(n, code, rates) : null;

  return (
    <div className="space-y-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
      <p className="text-xs font-semibold text-foreground">현지 통화 영수증 → 원화 환산</p>
      <div className="flex items-center gap-1.5">
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
          aria-label="통화"
        >
          {SELECTABLE_CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} · {c.name}
            </option>
          ))}
        </select>
        <Input
          inputMode="decimal"
          placeholder={`${currency.symbol} 금액`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 flex-1 text-right text-sm"
          aria-label={`${currency.name} 금액`}
        />
        <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="w-24 shrink-0 text-right text-sm font-bold text-primary">
          {krw != null ? formatKRW(Math.round(krw)) : "—"}
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        환산한 원화 금액을 아래 항목에 입력하세요. 기준 환율(하루 1회 갱신)이라 실제 환전 금액과 다를 수 있어요.
      </p>
    </div>
  );
}

/** 다이버 정산 결과 옆에 "현지 통화로 얼마인지" 한 줄. 나라 통화를 모르거나 환율을 못 받으면 아무것도 안 그린다. */
export function KrwInLocal({ krw, country }: { krw: number; country: string }) {
  const currency = currencyForCountry(country);
  const { rates } = useKrwRates(Boolean(currency) && krw > 0);
  if (!currency || !rates || krw <= 0 || currency.code === "KRW") return null;
  const v = fromKrw(krw, currency.code, rates);
  if (v == null) return null;
  return <span className="text-[11px] font-normal text-muted-foreground">≈ {formatForeign(v, currency)}</span>;
}

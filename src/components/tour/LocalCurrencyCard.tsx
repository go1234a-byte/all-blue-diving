import { useState } from "react";
import { ArrowLeftRight, Coins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useKrwRates } from "@/hooks/useKrwRates";
import { currencyForCountry, formatForeign, toKrw } from "@/lib/currency";
import { formatKRW } from "@/lib/pricing";

/**
 * 투어 상세 "현지 비용 원화 환산" — 불포함 항목(마린파크 입장료·팁·장비 렌탈 등)은 대부분
 * 현지 통화로 낸다. 자주 내는 금액대 3개를 미리 보여주고, 직접 입력해 바꿔볼 수도 있다.
 */
export function LocalCurrencyCard({ country }: { country: string }) {
  const currency = currencyForCountry(country);
  const { rates, failed } = useKrwRates(Boolean(currency));
  const [input, setInput] = useState("");
  if (!currency || failed) return null;

  const presets =
    currency.code === "IDR"
      ? [100000, 500000, 1000000]
      : currency.code === "JPY"
        ? [1000, 5000, 10000]
        : currency.code === "USD"
          ? [10, 50, 100]
          : currency.code === "PHP"
            ? [500, 1000, 3000]
            : [100, 500, 1000];
  const typed = Number(input.replace(/[^\d.]/g, ""));
  const typedKrw = rates && typed > 0 ? toKrw(typed, currency.code, rates) : null;

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Coins className="h-4 w-4 text-primary" />
          현지 비용 원화 환산
        </p>
        <span className="text-[11px] text-muted-foreground">
          {currency.name} ({currency.code})
        </span>
      </div>

      {!rates ? (
        <div className="h-16 animate-pulse rounded-lg bg-secondary" />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => (
              <div key={p} className="rounded-lg bg-secondary/50 px-2 py-2 text-center">
                <p className="text-xs font-semibold text-foreground">{formatForeign(p, currency)}</p>
                <p className="text-[11px] text-muted-foreground">≈ {formatKRW(Math.round(toKrw(p, currency.code, rates) ?? 0))}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              inputMode="decimal"
              placeholder={`${currency.code} 금액 입력`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-9 flex-1 text-sm"
              aria-label={`${currency.name} 금액`}
            />
            <ArrowLeftRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="w-28 shrink-0 text-right text-sm font-bold text-primary">
              {typedKrw != null ? formatKRW(Math.round(typedKrw)) : "—"}
            </p>
          </div>
        </>
      )}
      <p className="text-[10px] text-muted-foreground">
        하루 1회 갱신되는 기준 환율이라 현지 환전·카드 결제 금액과 다를 수 있어요.{" "}
        <a href="https://www.exchangerate-api.com" target="_blank" rel="noopener noreferrer" className="underline">
          Rates By Exchange Rate API
        </a>
      </p>
    </div>
  );
}

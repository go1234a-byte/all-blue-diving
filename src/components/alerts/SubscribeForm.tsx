import { useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { MonthMultiSelect } from "@/components/search/MonthMultiSelect";
import { Button } from "@/components/ui/button";
import { ACTIVITY_LABEL } from "@/lib/activityBadge";
import { COUNTRIES_SITES } from "@/lib/constants";
import { toSubscriptionMonths } from "@/lib/alertMonths";
import { cn } from "@/lib/utils";
import { MAX_TOUR_ALERT_SUBSCRIPTIONS, type TourAlertSubscriptionInput } from "@/types/alerts";
import type { ActivityType } from "@/types";

const ACTIVITY_OPTIONS: ActivityType[] = ["scuba", "freediving", "liveaboard"];
const COUNTRY_OPTIONS = Object.keys(COUNTRIES_SITES);

export interface SubscribeFormProps {
  initialCountry?: string;
  /** MonthMultiSelect와 같은 monthKey 값 */
  initialMonthKeys?: number[];
  initialActivityTypes?: ActivityType[];
  subscriptionCount: number;
  saving?: boolean;
  onSubmit: (input: TourAlertSubscriptionInput) => void;
}

/** 구독 조건 입력 폼 (지역 · 출발 월 · 활동). 데이터 호출은 하지 않는다. */
export function SubscribeForm({
  initialCountry,
  initialMonthKeys,
  initialActivityTypes,
  subscriptionCount,
  saving = false,
  onSubmit,
}: SubscribeFormProps) {
  const [country, setCountry] = useState(initialCountry ?? "");
  const [monthKeys, setMonthKeys] = useState<number[]>(initialMonthKeys ?? []);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(initialActivityTypes ?? []);

  const isFull = subscriptionCount >= MAX_TOUR_ALERT_SUBSCRIPTIONS;
  const canSave = !!country && !isFull && !saving;

  const toggleActivity = (value: ActivityType) =>
    setActivityTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  return (
    <div className="space-y-7">
      <FormSection title="지역">
        <div className="flex flex-wrap gap-2">
          {COUNTRY_OPTIONS.map((c) => (
            <PillButton key={c} selected={country === c} onClick={() => setCountry(c)}>
              {c}
            </PillButton>
          ))}
        </div>
      </FormSection>

      <FormSection title="출발 월" hint="고르지 않으면 모든 달을 알려드려요.">
        {/* 공용 버튼의 기본 글자(14px)를 이 폼 안에서만 가이드 항목 크기(15px)로 맞춘다 */}
        <div className="[&_button]:text-[15px]">
          <MonthMultiSelect value={monthKeys} onChange={setMonthKeys} />
        </div>
      </FormSection>

      <FormSection title="활동" hint="고르지 않으면 모든 활동을 알려드려요.">
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_OPTIONS.map((a) => (
            <PillButton key={a} selected={activityTypes.includes(a)} onClick={() => toggleActivity(a)}>
              {ACTIVITY_LABEL[a]}
            </PillButton>
          ))}
        </div>
      </FormSection>

      {isFull && (
        <p className="text-[13px] text-destructive">구독은 최대 10개까지 저장할 수 있어요. 기존 구독을 지워주세요.</p>
      )}

      <Button
        className="h-12 w-full gap-2 rounded-xl text-[15px] font-semibold"
        onClick={() =>
          onSubmit({ country, months: toSubscriptionMonths(monthKeys), activityTypes })
        }
        disabled={!canSave}
      >
        <Bell className="h-5 w-5" />
        {saving ? "저장 중..." : "이 조건으로 알림 받기"}
      </Button>
      {!country && <p className="text-center text-[13px] text-muted-foreground">지역을 먼저 골라주세요.</p>}
    </div>
  );
}

function FormSection({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
      {children}
    </section>
  );
}

/** 알약형 칩. 선택됨 = primary 채움, 아니면 테두리만. 터치 높이 44px 이상. */
export function PillButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "min-h-11 rounded-full border px-4 text-[15px] font-semibold transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:bg-secondary/60",
      )}
    >
      {children}
    </button>
  );
}

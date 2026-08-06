#!/usr/bin/env python3
"""
강사 정산센터 UI

Phase 1(fix_settlement_accounting_schema.sql)에서 만든
get_instructor_settlement_summary(p_year, p_month) RPC를 소비하는 강사용
월별 정산 요약 카드를 추가한다. 관리자용 회계 센터(AdminAccountingCenter)와
같은 시각적 패턴(월 이동, 색상 코딩된 카드)을 강사 눈높이에 맞게 축소해서
재사용한다.

기존에 이미 InstructorConsole.tsx의 "정산" 탭에 SettlementLedger(예약 건별
정산 원장, firstAmount/secondAmount 분할 지급 개념 — 이번 GMV/수수료 체계와는
별개)가 떠 있는데, 이건 그대로 두고 그 위에 월별 요약 카드를 추가하는 방식으로
합친다 (기존 UI를 대체하지 않음).

추가/수정 대상:
  1. src/components/instructor/InstructorSettlementSummary.tsx (신규)
  2. src/pages/InstructorConsole.tsx (패치: import + "정산" 탭에 렌더링 추가)

사용법: 리포지토리 루트에서 실행
    python3 fix_instructor_settlement_center.py
"""
import pathlib
import sys

SUMMARY_FILE = pathlib.Path("src/components/instructor/InstructorSettlementSummary.tsx")
CONSOLE_FILE = pathlib.Path("src/pages/InstructorConsole.tsx")

SUMMARY_CONTENT = '''import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  ScrollText,
  TrendingUp,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatKRW } from "@/lib/pricing";
import { formatDateKR } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface InstructorSettlementRow {
  period: string;
  booking_count: number;
  gmv: number;
  platform_fee_amount: number;
  instructor_amount_scheduled: number;
  instructor_amount_paid: number;
  refund_amount: number;
  next_payout_date: string | null;
}

type Tone = "blue" | "green" | "red" | "slate";

const TONE_STYLES: Record<Tone, string> = {
  blue: "border-blue-500/30 bg-blue-500/5",
  green: "border-emerald-500/30 bg-emerald-500/5",
  red: "border-red-500/30 bg-red-500/5",
  slate: "border-border bg-card",
};

const ICON_TONE_STYLES: Record<Tone, string> = {
  blue: "text-blue-500",
  green: "text-emerald-500",
  red: "text-red-500",
  slate: "text-muted-foreground",
};

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  sub?: string;
}

function SummaryCard({ title, value, icon: Icon, tone, sub }: SummaryCardProps) {
  return (
    <Card className={cn("border", TONE_STYLES[tone])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <Icon className={cn("h-5 w-5 shrink-0", ICON_TONE_STYLES[tone])} />
        </div>
      </CardContent>
    </Card>
  );
}

export function InstructorSettlementSummary() {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<InstructorSettlementRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_instructor_settlement_summary", {
        p_year: year,
        p_month: month,
      });
      if (cancelled) return;
      if (error) {
        toast({
          title: "정산 요약 조회 실패",
          description: error.message,
          variant: "destructive",
        });
        setRow(null);
      } else {
        const rows = data as InstructorSettlementRow[] | null;
        setRow(rows && rows.length > 0 ? rows[0] : null);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [year, month, toast]);

  function shiftMonth(delta: number) {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  }

  const gmv = row?.gmv ?? 0;
  const feeAmount = row?.platform_fee_amount ?? 0;
  const scheduled = row?.instructor_amount_scheduled ?? 0;
  const paid = row?.instructor_amount_paid ?? 0;
  const refund = row?.refund_amount ?? 0;
  const bookingCount = row?.booking_count ?? 0;
  const nextPayoutDate = row?.next_payout_date ? formatDateKR(row.next_payout_date) : "예정된 지급 없음";

  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">이달의 정산 요약</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => shiftMonth(-1)} aria-label="이전 달">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[70px] text-center text-xs font-medium">
            {year}년 {month}월
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => shiftMonth(1)} aria-label="다음 달">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard title="GMV (거래금액)" value={formatKRW(gmv)} icon={TrendingUp} tone="slate" />
          <SummaryCard title="플랫폼 수수료" value={formatKRW(feeAmount)} icon={BadgeDollarSign} tone="blue" sub="회원이 부담" />
          <SummaryCard title="지급 예정" value={formatKRW(scheduled)} icon={PiggyBank} tone="green" sub="scheduled / held" />
          <SummaryCard title="지급 완료" value={formatKRW(paid)} icon={PiggyBank} tone="green" sub="released" />
          <SummaryCard title="환불 금액" value={formatKRW(refund)} icon={Undo2} tone="red" />
          <SummaryCard title="거래 건수" value={`${bookingCount.toLocaleString()}건`} icon={ScrollText} tone="slate" />
          <div className="col-span-2">
            <SummaryCard title="다음 정산 예정일" value={nextPayoutDate} icon={CalendarClock} tone="slate" />
          </div>
        </div>
      )}
    </div>
  );
}
'''

# --- InstructorConsole.tsx 패치 ---
IMPORT_OLD = 'import { TourCreateForm } from "@/components/instructor/TourCreateForm";\n'
IMPORT_NEW = (
    'import { TourCreateForm } from "@/components/instructor/TourCreateForm";\n'
    'import { InstructorSettlementSummary } from "@/components/instructor/InstructorSettlementSummary";\n'
)

TAB_OLD = (
    '          <TabsContent value="settlement" className="pt-4">\n'
    '            <SettlementLedger instructorId={currentInstructorId} />\n'
    '          </TabsContent>'
)
TAB_NEW = (
    '          <TabsContent value="settlement" className="pt-4">\n'
    '            <InstructorSettlementSummary />\n'
    '            <SettlementLedger instructorId={currentInstructorId} />\n'
    '          </TabsContent>'
)


def write_new_file(path: pathlib.Path, content: str, label: str) -> bool:
    if path.exists():
        existing = path.read_text(encoding="utf-8")
        if existing == content:
            print(f"SKIP: {path} 이미 동일한 내용으로 존재함")
            return True
        print(f"SKIP: {path} 이미 존재하지만 내용이 다릅니다. 수동 확인 필요.")
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"OK: {path} 생성됨 ({label})")
    return True


def patch_file(path: pathlib.Path, replacements: list, label: str) -> bool:
    if not path.exists():
        print(f"ERROR: {path} 를 찾을 수 없습니다. 리포지토리 루트에서 실행하세요.")
        return False

    text = path.read_text(encoding="utf-8")
    already_done = all(new in text for _old, new in replacements)
    if already_done:
        print(f"SKIP: {path} 은 이미 패치되어 있습니다. ({label})")
        return True

    for old, new in replacements:
        if new in text:
            continue
        if old not in text:
            print(f"ERROR: {path} 에서 다음 텍스트를 찾지 못했습니다 (파일이 변경되었을 수 있음):\n{old!r}")
            return False
        text = text.replace(old, new, 1)

    path.write_text(text, encoding="utf-8")
    print(f"OK: {path} 패치됨 ({label})")
    return True


def main():
    ok = True
    ok &= write_new_file(SUMMARY_FILE, SUMMARY_CONTENT, "강사 정산센터 요약 카드 컴포넌트")
    ok &= patch_file(
        CONSOLE_FILE,
        [(IMPORT_OLD, IMPORT_NEW), (TAB_OLD, TAB_NEW)],
        "정산 탭에 월별 요약 카드 추가",
    )

    if not ok:
        sys.exit(1)

    print("\n완료. 확인용 diff:")
    print("  git diff -- " + str(CONSOLE_FILE))
    print("  git status  (새 파일이 Untracked로 보여야 정상)")


if __name__ == "__main__":
    main()

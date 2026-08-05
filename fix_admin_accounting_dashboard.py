#!/usr/bin/env python3
"""
Phase 2: 관리자 대시보드 회계 센터 UI

Phase 1(fix_settlement_accounting_schema.sql, 적용 완료)에서 만든
get_admin_monthly_accounting(p_year, p_month) RPC + invoices/payouts 테이블을
소비하는 새 관리자 페이지를 추가한다.

추가/수정 대상:
  1. src/components/admin/dashboard/AdminAccountingCenter.tsx (신규)
  2. src/pages/admin/AdminAccountingPage.tsx (신규, 기존 AdminPayoutsPage.tsx와
     동일한 "page shell" 패턴)
  3. src/router.tsx (패치: import + /admin/accounting 라우트 추가)
  4. src/components/admin/layout/AdminSidebar.tsx (패치: 아이콘 import +
     "회계 센터" 메뉴 항목 추가)

** 중요 — 반드시 알아야 할 한계 **
이 화면은 invoices 테이블 데이터를 기준으로 집계한다. 그런데 예약이 확정될 때
invoices 레코드를 실제로 생성하는 로직(Invoice ID 채번 로직)은 아직 구현되지
않았다 (Phase 1 SQL 파일 하단 "적용 전 확인사항" 4번 참고). 즉 이 화면을 지금
배포해도 invoices 테이블에 데이터가 하나도 없으므로 모든 카드가 0으로 표시된다.
화면 자체는 "아직 발급된 인보이스가 없습니다" 안내 배너로 이 상태를 알려준다.
실제로 숫자가 채워지려면 다음 단계로 예약 확정 로직에 invoice 생성 코드를
붙여야 한다 (아직 미착수).

사용법: 리포지토리 루트에서 실행
    python3 fix_admin_accounting_dashboard.py
"""
import pathlib
import sys

ACCOUNTING_CENTER_FILE = pathlib.Path("src/components/admin/dashboard/AdminAccountingCenter.tsx")
ACCOUNTING_PAGE_FILE = pathlib.Path("src/pages/admin/AdminAccountingPage.tsx")
ROUTER_FILE = pathlib.Path("src/router.tsx")
SIDEBAR_FILE = pathlib.Path("src/components/admin/layout/AdminSidebar.tsx")

ACCOUNTING_CENTER_CONTENT = '''import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Receipt,
  RefreshCcw,
  ScrollText,
  TrendingUp,
  Undo2,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatKRW } from "@/lib/pricing";
import { cn } from "@/lib/utils";

interface MonthlyAccountingRow {
  period: string;
  booking_count: number;
  gmv: number;
  platform_fee_revenue: number;
  refund_amount: number;
  net_revenue: number;
  instructor_payout_total: number;
  estimated_vat: number;
}

interface PayoutBreakdown {
  pending: number;
  paid: number;
}

interface SignupCounts {
  newDivers: number;
  newInstructors: number;
}

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    periodStr: `${year}-${String(month).padStart(2, "0")}-01`,
  };
}

type Tone = "blue" | "green" | "red" | "orange" | "slate";

const TONE_STYLES: Record<Tone, string> = {
  blue: "border-blue-500/30 bg-blue-500/5",
  green: "border-emerald-500/30 bg-emerald-500/5",
  red: "border-red-500/30 bg-red-500/5",
  orange: "border-orange-500/30 bg-orange-500/5",
  slate: "border-border bg-card",
};

const ICON_TONE_STYLES: Record<Tone, string> = {
  blue: "text-blue-500",
  green: "text-emerald-500",
  red: "text-red-500",
  orange: "text-orange-500",
  slate: "text-muted-foreground",
};

interface AccountingCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  sub?: string;
}

function AccountingCard({ title, value, icon: Icon, tone, sub }: AccountingCardProps) {
  return (
    <Card className={cn("border", TONE_STYLES[tone])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <Icon className={cn("h-5 w-5 shrink-0", ICON_TONE_STYLES[tone])} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminAccountingCenter() {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<MonthlyAccountingRow | null>(null);
  const [payoutBreakdown, setPayoutBreakdown] = useState<PayoutBreakdown>({ pending: 0, paid: 0 });
  const [signups, setSignups] = useState<SignupCounts>({ newDivers: 0, newInstructors: 0 });
  const [hasAnyInvoices, setHasAnyInvoices] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { startISO, endISO, periodStr } = monthRange(year, month);

      const [accountingRes, invoicesRes, diversRes, instructorsRes, anyInvoiceRes] = await Promise.all([
        supabase.rpc("get_admin_monthly_accounting", { p_year: year, p_month: month }),
        supabase.from("invoices").select("instructor_amount, payouts(status)").eq("period", periodStr),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "diver")
          .gte("created_at", startISO)
          .lt("created_at", endISO),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "instructor")
          .gte("created_at", startISO)
          .lt("created_at", endISO),
        supabase.from("invoices").select("id", { count: "exact", head: true }),
      ]);

      if (cancelled) return;

      if (accountingRes.error) {
        toast({
          title: "정산 데이터 조회 실패",
          description: accountingRes.error.message,
          variant: "destructive",
        });
        setRow(null);
      } else {
        const data = accountingRes.data as MonthlyAccountingRow[] | null;
        setRow(data && data.length > 0 ? data[0] : null);
      }

      if (!invoicesRes.error && invoicesRes.data) {
        let pending = 0;
        let paid = 0;
        for (const r of invoicesRes.data as Array<{ instructor_amount: number; payouts: { status: string } | null }>) {
          const amount = Number(r.instructor_amount) || 0;
          if (r.payouts?.status === "released") {
            paid += amount;
          } else {
            pending += amount;
          }
        }
        setPayoutBreakdown({ pending, paid });
      } else {
        setPayoutBreakdown({ pending: 0, paid: 0 });
      }

      setSignups({
        newDivers: diversRes.count ?? 0,
        newInstructors: instructorsRes.count ?? 0,
      });

      setHasAnyInvoices((anyInvoiceRes.count ?? 0) > 0);
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
  const feeRevenue = row?.platform_fee_revenue ?? 0;
  const refund = row?.refund_amount ?? 0;
  const net = row?.net_revenue ?? 0;
  const bookingCount = row?.booking_count ?? 0;
  const vat = row?.estimated_vat ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">회계 센터</h1>
          <p className="text-sm text-muted-foreground">
            월별 GMV · 플랫폼 수수료 매출 · 정산 현황 (invoices 테이블 기준 집계)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="이전 달">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[90px] text-center font-medium">
            {year}년 {month}월
          </span>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="다음 달">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasAnyInvoices === false && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 text-sm text-orange-600 dark:text-orange-400">
          아직 발급된 인보이스가 없습니다. 예약 확정 시 invoices 레코드를 생성하는 로직이
          연결되기 전까지는 아래 카드가 전부 0으로 표시됩니다. (Invoice ID 채번 로직은
          다음 단계에서 구현 예정)
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AccountingCard
            title="GMV (총 거래금액)"
            value={formatKRW(gmv)}
            icon={TrendingUp}
            tone="slate"
            sub="회원이 실제 결제한 총액"
          />
          <AccountingCard title="플랫폼 수수료 매출" value={formatKRW(feeRevenue)} icon={BadgeDollarSign} tone="blue" />
          <AccountingCard
            title="강사 지급 예정"
            value={formatKRW(payoutBreakdown.pending)}
            icon={PiggyBank}
            tone="green"
            sub="scheduled / held 상태"
          />
          <AccountingCard
            title="강사 지급 완료"
            value={formatKRW(payoutBreakdown.paid)}
            icon={PiggyBank}
            tone="green"
            sub="released 상태"
          />
          <AccountingCard title="환불 금액" value={formatKRW(refund)} icon={Undo2} tone="red" />
          <AccountingCard title="순매출" value={formatKRW(net)} icon={Receipt} tone="blue" sub="수수료 매출 − 환불" />
          <AccountingCard title="거래 건수" value={`${bookingCount.toLocaleString()}건`} icon={ScrollText} tone="slate" />
          <AccountingCard
            title="예상 부가세"
            value={formatKRW(vat)}
            icon={RefreshCcw}
            tone="orange"
            sub="추정치 — 신고 근거자료 아님"
          />
          <AccountingCard title="신규 가입 강사" value={`${signups.newInstructors.toLocaleString()}명`} icon={UserPlus} tone="slate" />
          <AccountingCard title="신규 가입 회원" value={`${signups.newDivers.toLocaleString()}명`} icon={Users} tone="slate" />
        </div>
      )}
    </div>
  );
}
'''

ACCOUNTING_PAGE_CONTENT = '''import { AdminAccountingCenter } from "@/components/admin/dashboard/AdminAccountingCenter";

const AdminAccountingPage = () => <AdminAccountingCenter />;

export default AdminAccountingPage;
'''

# --- router.tsx 패치 ---
ROUTER_IMPORT_OLD = 'import AdminPayoutsPage from "./pages/admin/AdminPayoutsPage";\n'
ROUTER_IMPORT_NEW = (
    'import AdminPayoutsPage from "./pages/admin/AdminPayoutsPage";\n'
    'import AdminAccountingPage from "./pages/admin/AdminAccountingPage";\n'
)

ROUTER_ROUTE_OLD = '              { path: "payouts", name: "admin-payouts", element: <AdminPayoutsPage /> },\n'
ROUTER_ROUTE_NEW = (
    '              { path: "payouts", name: "admin-payouts", element: <AdminPayoutsPage /> },\n'
    '              { path: "accounting", name: "admin-accounting", element: <AdminAccountingPage /> },\n'
)

# --- AdminSidebar.tsx 패치 ---
SIDEBAR_IMPORT_OLD = (
    'import {\n'
    '  LayoutDashboard,\n'
    '  Compass,\n'
)
SIDEBAR_IMPORT_NEW = (
    'import {\n'
    '  LayoutDashboard,\n'
    '  Calculator,\n'
    '  Compass,\n'
)

SIDEBAR_MENU_OLD = '  { to: "/admin/payouts", label: "정산 관리", icon: Wallet, end: false },\n'
SIDEBAR_MENU_NEW = (
    '  { to: "/admin/payouts", label: "정산 관리", icon: Wallet, end: false },\n'
    '  { to: "/admin/accounting", label: "회계 센터", icon: Calculator, end: false },\n'
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


def patch_file(path: pathlib.Path, replacements: list[tuple[str, str]], label: str) -> bool:
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
    ok &= write_new_file(ACCOUNTING_CENTER_FILE, ACCOUNTING_CENTER_CONTENT, "회계 센터 UI 컴포넌트")
    ok &= write_new_file(ACCOUNTING_PAGE_FILE, ACCOUNTING_PAGE_CONTENT, "페이지 셸")
    ok &= patch_file(
        ROUTER_FILE,
        [(ROUTER_IMPORT_OLD, ROUTER_IMPORT_NEW), (ROUTER_ROUTE_OLD, ROUTER_ROUTE_NEW)],
        "/admin/accounting 라우트 추가",
    )
    ok &= patch_file(
        SIDEBAR_FILE,
        [(SIDEBAR_IMPORT_OLD, SIDEBAR_IMPORT_NEW), (SIDEBAR_MENU_OLD, SIDEBAR_MENU_NEW)],
        "회계 센터 메뉴 추가",
    )

    if not ok:
        sys.exit(1)

    print("\n완료. 확인용 diff:")
    print(
        "  git diff -- "
        + str(ACCOUNTING_CENTER_FILE)
        + " "
        + str(ACCOUNTING_PAGE_FILE)
        + " "
        + str(ROUTER_FILE)
        + " "
        + str(SIDEBAR_FILE)
    )
    print("  git status  (새 파일 두 개가 Untracked로 보여야 정상)")


if __name__ == "__main__":
    main()

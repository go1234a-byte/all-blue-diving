import { useEffect, useState } from "react";
import {
  BadgeDollarSign,
  ChevronLeft,
  ChevronRight,
  Download,
  PiggyBank,
  Printer,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface InvoiceDetailRow {
  id: string;
  gmv_amount: number;
  platform_fee_amount: number;
  instructor_amount: number;
  refund_amount: number;
  issued_at: string;
  payoutStatus: string | null;
  diverName: string | null;
  tourTitle: string | null;
  instructorName: string | null;
}

interface SignupRow {
  id: string;
  name: string;
  created_at: string;
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

// CSV 필드에 콤마/따옴표/줄바꿈이 있으면 큰따옴표로 감싸고 내부 따옴표는 두 번 반복한다.
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const CURRENT_YEAR = new Date().getFullYear();
// 현재 연도 기준 4년 전 ~ 1년 후까지 선택 가능하게 한다.
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 4 + i);
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1);

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

// 카드를 클릭했을 때 어떤 상세 내역을 보여줄지 구분하는 키.
type DetailKey =
  | "gmv"
  | "fee"
  | "payoutPending"
  | "payoutPaid"
  | "refund"
  | "net"
  | "count"
  | "vat"
  | "newInstructors"
  | "newDivers";

const DETAIL_META: Record<DetailKey, { title: string; description: string }> = {
  gmv: { title: "GMV (총 거래금액) 내역", description: "이번 기간 인보이스 기준 거래 내역입니다." },
  fee: { title: "플랫폼 수수료 매출 내역", description: "이번 기간 인보이스별 플랫폼 수수료입니다." },
  payoutPending: {
    title: "강사 지급 예정 내역",
    description: "정산 상태가 released가 아닌 건입니다 (scheduled / held). 어느 강사에게 지급될지 함께 표시됩니다.",
  },
  payoutPaid: {
    title: "강사 지급 완료 내역",
    description: "정산 상태가 released인 건입니다. 어느 강사에게 지급되었는지 함께 표시됩니다.",
  },
  refund: { title: "환불 내역", description: "이번 기간 인보이스 기준 환불이 발생한 건입니다." },
  net: { title: "순매출 내역", description: "인보이스별 플랫폼 수수료 − 환불액입니다." },
  count: { title: "거래 건수 내역", description: "이번 기간 발행된 인보이스 목록입니다." },
  vat: { title: "예상 부가세 (일반과세 기준)", description: "" },
  newInstructors: { title: "신규 가입 강사", description: "이번 기간 가입한 강사 목록입니다." },
  newDivers: { title: "신규 가입 회원", description: "이번 기간 가입한 다이버 목록입니다." },
};

interface AccountingCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone: Tone;
  sub?: string;
  onDetailClick?: () => void;
}

function AccountingCard({ title, value, icon: Icon, tone, sub, onDetailClick }: AccountingCardProps) {
  return (
    <Card className={cn("border", TONE_STYLES[tone])}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          {onDetailClick ? (
            <button
              type="button"
              onClick={onDetailClick}
              aria-label={`${title} 상세 보기`}
              className={cn(
                "shrink-0 rounded-full p-1 transition-colors hover:bg-foreground/10",
                ICON_TONE_STYLES[tone],
              )}
            >
              <Icon className="h-5 w-5" />
            </button>
          ) : (
            <Icon className={cn("h-5 w-5 shrink-0", ICON_TONE_STYLES[tone])} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InvoiceRowsTable({
  rows,
  amountLabel,
  getAmount,
}: {
  rows: InvoiceDetailRow[];
  amountLabel: string;
  getAmount: (row: InvoiceDetailRow) => number;
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">해당 기간에 데이터가 없습니다.</p>;
  }
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-2 font-medium">일자</th>
            <th className="py-2 pr-2 font-medium">투어</th>
            <th className="py-2 pr-2 font-medium">예약자</th>
            <th className="py-2 pr-2 font-medium">강사</th>
            <th className="py-2 pl-2 text-right font-medium">{amountLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60">
              <td className="py-2 pr-2 text-muted-foreground">
                {new Date(r.issued_at).toLocaleDateString("ko-KR")}
              </td>
              <td className="max-w-[140px] truncate py-2 pr-2">{r.tourTitle ?? "-"}</td>
              <td className="py-2 pr-2">{r.diverName ?? "-"}</td>
              <td className="py-2 pr-2">{r.instructorName ?? "-"}</td>
              <td className="py-2 pl-2 text-right font-medium">{formatKRW(getAmount(r))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SignupRowsTable({ rows }: { rows: SignupRow[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">해당 기간에 신규 가입자가 없습니다.</p>;
  }
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
          <tr className="border-b border-border">
            <th className="py-2 pr-2 font-medium">이름</th>
            <th className="py-2 pl-2 font-medium">가입일</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border/60">
              <td className="py-2 pr-2">{r.name}</td>
              <td className="py-2 pl-2 text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("ko-KR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
  const [invoiceRows, setInvoiceRows] = useState<InvoiceDetailRow[]>([]);
  const [newInstructorRows, setNewInstructorRows] = useState<SignupRow[]>([]);
  const [newDiverRows, setNewDiverRows] = useState<SignupRow[]>([]);
  const [detailKey, setDetailKey] = useState<DetailKey | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { startISO, endISO, periodStr } = monthRange(year, month);

      const [accountingRes, invoicesRes, diversRes, instructorsRes, anyInvoiceRes, instructorsTableRes] =
        await Promise.all([
          supabase.rpc("get_admin_monthly_accounting", { p_year: year, p_month: month }),
          supabase
            .from("invoices")
            .select(
              "id, gmv_amount, platform_fee_amount, instructor_amount, refund_amount, issued_at, payouts(status, instructor_id), bookings(diver_name, tours(title))",
            )
            .eq("period", periodStr)
            .order("issued_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, name, created_at")
            .eq("role", "diver")
            .gte("created_at", startISO)
            .lt("created_at", endISO)
            .order("created_at", { ascending: false }),
          supabase
            .from("profiles")
            .select("id, name, created_at")
            .eq("role", "instructor")
            .gte("created_at", startISO)
            .lt("created_at", endISO)
            .order("created_at", { ascending: false }),
          supabase.from("invoices").select("id", { count: "exact", head: true }),
          // 정산 대상 강사 이름 표시를 위해 강사 목록(id → name)을 함께 불러온다.
          supabase.from("instructors").select("id, name"),
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

      const instructorNameMap = new Map(
        ((instructorsTableRes.data as Array<{ id: string; name: string }> | null) ?? []).map((i) => [
          i.id,
          i.name,
        ]),
      );

      if (!invoicesRes.error && invoicesRes.data) {
        const rows: InvoiceDetailRow[] = (
          invoicesRes.data as Array<{
            id: string;
            gmv_amount: number;
            platform_fee_amount: number;
            instructor_amount: number;
            refund_amount: number;
            issued_at: string;
            payouts: { status: string; instructor_id: string | null } | null;
            bookings: { diver_name: string | null; tours: { title: string } | null } | null;
          }>
        ).map((r) => ({
          id: r.id,
          gmv_amount: Number(r.gmv_amount) || 0,
          platform_fee_amount: Number(r.platform_fee_amount) || 0,
          instructor_amount: Number(r.instructor_amount) || 0,
          refund_amount: Number(r.refund_amount) || 0,
          issued_at: r.issued_at,
          payoutStatus: r.payouts?.status ?? null,
          diverName: r.bookings?.diver_name ?? null,
          tourTitle: r.bookings?.tours?.title ?? null,
          instructorName: r.payouts?.instructor_id
            ? (instructorNameMap.get(r.payouts.instructor_id) ?? null)
            : null,
        }));
        setInvoiceRows(rows);

        let pending = 0;
        let paid = 0;
        for (const r of rows) {
          if (r.payoutStatus === "released") {
            paid += r.instructor_amount;
          } else {
            pending += r.instructor_amount;
          }
        }
        setPayoutBreakdown({ pending, paid });
      } else {
        setInvoiceRows([]);
        setPayoutBreakdown({ pending: 0, paid: 0 });
      }

      setNewDiverRows((diversRes.data as SignupRow[] | null) ?? []);
      setNewInstructorRows((instructorsRes.data as SignupRow[] | null) ?? []);
      setSignups({
        newDivers: diversRes.data?.length ?? 0,
        newInstructors: instructorsRes.data?.length ?? 0,
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
  // 대한민국 부가가치세법 일반과세자 기준: 매출액에 부가세가 포함되어 있다고 보고
  // 공급가액 = 매출액 ÷ 1.1, 부가세 = 매출액 − 공급가액(= 매출액 × 10/110)으로 역산한다.
  const vatSupplyAmount = Math.round(net / 1.1);

  function handleDownloadCsv() {
    const lines: string[] = [];
    lines.push(csvEscape(`ALL BLUE 회계 센터 - ${year}년 ${month}월`));
    lines.push("");
    lines.push("지표,값");
    lines.push(`GMV (총 거래금액),${gmv}`);
    lines.push(`플랫폼 수수료 매출,${feeRevenue}`);
    lines.push(`강사 지급 예정,${payoutBreakdown.pending}`);
    lines.push(`강사 지급 완료,${payoutBreakdown.paid}`);
    lines.push(`환불 금액,${refund}`);
    lines.push(`순매출,${net}`);
    lines.push(`거래 건수,${bookingCount}`);
    lines.push(`공급가액(일반과세 기준),${vatSupplyAmount}`);
    lines.push(`예상 부가세(일반과세 기준),${vat}`);
    lines.push(`신규 가입 강사,${signups.newInstructors}`);
    lines.push(`신규 가입 회원,${signups.newDivers}`);
    lines.push("");
    lines.push("거래 내역");
    lines.push("일자,투어,예약자,강사,GMV,플랫폼수수료,환불액,강사지급액,정산상태");
    for (const r of invoiceRows) {
      lines.push(
        [
          new Date(r.issued_at).toLocaleDateString("ko-KR"),
          csvEscape(r.tourTitle ?? ""),
          csvEscape(r.diverName ?? ""),
          csvEscape(r.instructorName ?? ""),
          r.gmv_amount,
          r.platform_fee_amount,
          r.refund_amount,
          r.instructor_amount,
          r.payoutStatus ?? "",
        ].join(","),
      );
    }
    lines.push("");
    lines.push("신규 가입 강사");
    lines.push("이름,가입일");
    for (const r of newInstructorRows) {
      lines.push(`${csvEscape(r.name)},${new Date(r.created_at).toLocaleDateString("ko-KR")}`);
    }
    lines.push("");
    lines.push("신규 가입 회원");
    lines.push("이름,가입일");
    for (const r of newDiverRows) {
      lines.push(`${csvEscape(r.name)},${new Date(r.created_at).toLocaleDateString("ko-KR")}`);
    }

    // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 앞에 붙인다.
    const csvContent = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allblue-accounting-${year}-${String(month).padStart(2, "0")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function renderDetailContent() {
    if (!detailKey) return null;

    if (detailKey === "vat") {
      return (
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            대한민국 부가가치세법상 일반과세자 기준 계산입니다. 플랫폼 순매출(수수료 매출 − 환불)에
            부가세가 포함되어 있다고 보고, 매출액 ÷ 1.1 = 공급가액, 매출액 − 공급가액 = 부가세로
            역산합니다.
          </p>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-1.5 text-muted-foreground">매출액 (부가세 포함, 수수료 매출 − 환불)</td>
                <td className="py-1.5 text-right font-medium">{formatKRW(net)}</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-1.5 text-muted-foreground">공급가액 (매출액 ÷ 1.1)</td>
                <td className="py-1.5 text-right font-medium">{formatKRW(vatSupplyAmount)}</td>
              </tr>
              <tr>
                <td className="py-1.5 font-semibold">예상 부가세 (10%)</td>
                <td className="py-1.5 text-right font-semibold">{formatKRW(vat)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-muted-foreground">
            매입세액 공제, 간이과세 전환 여부 등에 따라 실제 납부세액은 달라질 수 있습니다. 신고 전
            세무 대리인 확인이 필요합니다.
          </p>
        </div>
      );
    }

    if (detailKey === "newInstructors") {
      return <SignupRowsTable rows={newInstructorRows} />;
    }

    if (detailKey === "newDivers") {
      return <SignupRowsTable rows={newDiverRows} />;
    }

    const rows =
      detailKey === "payoutPending"
        ? invoiceRows.filter((r) => r.payoutStatus !== "released")
        : detailKey === "payoutPaid"
          ? invoiceRows.filter((r) => r.payoutStatus === "released")
          : detailKey === "refund"
            ? invoiceRows.filter((r) => r.refund_amount > 0)
            : invoiceRows;

    const amountLabel =
      detailKey === "fee"
        ? "플랫폼 수수료"
        : detailKey === "refund"
          ? "환불액"
          : detailKey === "net"
            ? "순매출"
            : detailKey === "payoutPending" || detailKey === "payoutPaid"
              ? "강사 지급액"
              : "GMV";

    const getAmount =
      detailKey === "fee"
        ? (r: InvoiceDetailRow) => r.platform_fee_amount
        : detailKey === "refund"
          ? (r: InvoiceDetailRow) => r.refund_amount
          : detailKey === "net"
            ? (r: InvoiceDetailRow) => r.platform_fee_amount - r.refund_amount
            : detailKey === "payoutPending" || detailKey === "payoutPaid"
              ? (r: InvoiceDetailRow) => r.instructor_amount
              : (r: InvoiceDetailRow) => r.gmv_amount;

    return <InvoiceRowsTable rows={rows} amountLabel={amountLabel} getAmount={getAmount} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-semibold">회계 센터</h1>
          <p className="text-sm text-muted-foreground">
            월별 GMV · 플랫폼 수수료 매출 · 정산 현황 (invoices 테이블 기준 집계)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadCsv}>
            <Download className="h-4 w-4" />
            엑셀 다운로드
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            PDF로 저장
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="이전 달">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[90px] justify-center font-medium">
                {year}년 {month}월
              </Button>
            </PopoverTrigger>
            <PopoverContent align="center" className="flex w-auto gap-2 p-3">
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}년
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}월
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="다음 달">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {hasAnyInvoices === false && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4 text-sm text-orange-600 dark:text-orange-400 print:hidden">
          아직 발급된 인보이스가 없습니다. 예약 확정 시 invoices 레코드를 생성하는 로직이
          연결되기 전까지는 아래 카드가 전부 0으로 표시됩니다. (Invoice ID 채번 로직은
          다음 단계에서 구현 예정)
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground print:hidden">불러오는 중...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          <AccountingCard
            title="GMV (총 거래금액)"
            value={formatKRW(gmv)}
            icon={TrendingUp}
            tone="slate"
            sub="회원이 실제 결제한 총액"
            onDetailClick={() => setDetailKey("gmv")}
          />
          <AccountingCard
            title="플랫폼 수수료 매출"
            value={formatKRW(feeRevenue)}
            icon={BadgeDollarSign}
            tone="blue"
            onDetailClick={() => setDetailKey("fee")}
          />
          <AccountingCard
            title="강사 지급 예정"
            value={formatKRW(payoutBreakdown.pending)}
            icon={PiggyBank}
            tone="green"
            sub="scheduled / held 상태"
            onDetailClick={() => setDetailKey("payoutPending")}
          />
          <AccountingCard
            title="강사 지급 완료"
            value={formatKRW(payoutBreakdown.paid)}
            icon={PiggyBank}
            tone="green"
            sub="released 상태"
            onDetailClick={() => setDetailKey("payoutPaid")}
          />
          <AccountingCard
            title="환불 금액"
            value={formatKRW(refund)}
            icon={Undo2}
            tone="red"
            onDetailClick={() => setDetailKey("refund")}
          />
          <AccountingCard
            title="순매출"
            value={formatKRW(net)}
            icon={Receipt}
            tone="blue"
            sub="수수료 매출 − 환불"
            onDetailClick={() => setDetailKey("net")}
          />
          <AccountingCard
            title="거래 건수"
            value={`${bookingCount.toLocaleString()}건`}
            icon={ScrollText}
            tone="slate"
            onDetailClick={() => setDetailKey("count")}
          />
          <AccountingCard
            title="예상 부가세"
            value={formatKRW(vat)}
            icon={RefreshCcw}
            tone="orange"
            sub="일반과세 기준 추정치"
            onDetailClick={() => setDetailKey("vat")}
          />
          <AccountingCard
            title="신규 가입 강사"
            value={`${signups.newInstructors.toLocaleString()}명`}
            icon={UserPlus}
            tone="slate"
            onDetailClick={() => setDetailKey("newInstructors")}
          />
          <AccountingCard
            title="신규 가입 회원"
            value={`${signups.newDivers.toLocaleString()}명`}
            icon={Users}
            tone="slate"
            onDetailClick={() => setDetailKey("newDivers")}
          />
        </div>
      )}

      <Dialog open={detailKey !== null} onOpenChange={(open) => !open && setDetailKey(null)}>
        <DialogContent className="max-w-2xl">
          {detailKey && (
            <>
              <DialogHeader>
                <DialogTitle>{DETAIL_META[detailKey].title}</DialogTitle>
                {DETAIL_META[detailKey].description && (
                  <DialogDescription>{DETAIL_META[detailKey].description}</DialogDescription>
                )}
              </DialogHeader>
              {renderDetailContent()}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF로 저장(브라우저 인쇄) 시에만 보이는 전체 리포트 — 카드/다이얼로그 대신
          모든 지표와 상세 내역을 표/텍스트로 정리해 한 번에 출력한다. */}
      <div className="hidden print:block">
        <h1 className="mb-1 text-xl font-bold text-foreground">ALL BLUE 회계 센터 리포트</h1>
        <p className="mb-4 text-sm text-muted-foreground">{year}년 {month}월</p>

        <table className="mb-6 w-full text-sm">
          <tbody>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">GMV (총 거래금액)</td>
              <td className="py-1 text-right font-medium">{formatKRW(gmv)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">플랫폼 수수료 매출</td>
              <td className="py-1 text-right font-medium">{formatKRW(feeRevenue)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">강사 지급 예정</td>
              <td className="py-1 text-right font-medium">{formatKRW(payoutBreakdown.pending)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">강사 지급 완료</td>
              <td className="py-1 text-right font-medium">{formatKRW(payoutBreakdown.paid)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">환불 금액</td>
              <td className="py-1 text-right font-medium">{formatKRW(refund)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">순매출</td>
              <td className="py-1 text-right font-medium">{formatKRW(net)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">거래 건수</td>
              <td className="py-1 text-right font-medium">{bookingCount.toLocaleString()}건</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">공급가액 (일반과세 기준)</td>
              <td className="py-1 text-right font-medium">{formatKRW(vatSupplyAmount)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">예상 부가세 (일반과세 기준)</td>
              <td className="py-1 text-right font-medium">{formatKRW(vat)}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1 text-muted-foreground">신규 가입 강사</td>
              <td className="py-1 text-right font-medium">{signups.newInstructors.toLocaleString()}명</td>
            </tr>
            <tr>
              <td className="py-1 text-muted-foreground">신규 가입 회원</td>
              <td className="py-1 text-right font-medium">{signups.newDivers.toLocaleString()}명</td>
            </tr>
          </tbody>
        </table>

        <h2 className="mb-2 text-base font-semibold text-foreground">거래 내역</h2>
        <table className="mb-6 w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1 pr-2">일자</th>
              <th className="py-1 pr-2">투어</th>
              <th className="py-1 pr-2">예약자</th>
              <th className="py-1 pr-2">강사</th>
              <th className="py-1 pr-2 text-right">GMV</th>
              <th className="py-1 pr-2 text-right">수수료</th>
              <th className="py-1 pr-2 text-right">환불</th>
              <th className="py-1 pr-2 text-right">강사지급액</th>
              <th className="py-1 pl-2">정산상태</th>
            </tr>
          </thead>
          <tbody>
            {invoiceRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-2 text-center text-muted-foreground">
                  데이터 없음
                </td>
              </tr>
            ) : (
              invoiceRows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-1 pr-2">{new Date(r.issued_at).toLocaleDateString("ko-KR")}</td>
                  <td className="py-1 pr-2">{r.tourTitle ?? "-"}</td>
                  <td className="py-1 pr-2">{r.diverName ?? "-"}</td>
                  <td className="py-1 pr-2">{r.instructorName ?? "-"}</td>
                  <td className="py-1 pr-2 text-right">{formatKRW(r.gmv_amount)}</td>
                  <td className="py-1 pr-2 text-right">{formatKRW(r.platform_fee_amount)}</td>
                  <td className="py-1 pr-2 text-right">{formatKRW(r.refund_amount)}</td>
                  <td className="py-1 pr-2 text-right">{formatKRW(r.instructor_amount)}</td>
                  <td className="py-1 pl-2">{r.payoutStatus ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 className="mb-2 text-base font-semibold text-foreground">신규 가입 강사</h2>
        <table className="mb-6 w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1 pr-2">이름</th>
              <th className="py-1 pl-2">가입일</th>
            </tr>
          </thead>
          <tbody>
            {newInstructorRows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-2 text-center text-muted-foreground">
                  없음
                </td>
              </tr>
            ) : (
              newInstructorRows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-1 pr-2">{r.name}</td>
                  <td className="py-1 pl-2">{new Date(r.created_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <h2 className="mb-2 text-base font-semibold text-foreground">신규 가입 회원</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-1 pr-2">이름</th>
              <th className="py-1 pl-2">가입일</th>
            </tr>
          </thead>
          <tbody>
            {newDiverRows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-2 text-center text-muted-foreground">
                  없음
                </td>
              </tr>
            ) : (
              newDiverRows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-1 pr-2">{r.name}</td>
                  <td className="py-1 pl-2">{new Date(r.created_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAppData } from "@/contexts/AppDataContext";
import { computeBookingStatusBreakdown, type BookingStatusBucket } from "@/lib/adminAnalytics";

const STATUS_COLORS: Record<BookingStatusBucket, string> = {
  확정: "hsl(var(--primary))",
  진행중: "hsl(var(--accent))",
  완료: "hsl(var(--success))",
  취소: "hsl(var(--destructive))",
  대기: "hsl(var(--warning))",
};

const STATUS_QUERY: Record<BookingStatusBucket, string> = {
  확정: "confirmed",
  진행중: "in_progress",
  완료: "completed",
  취소: "cancelled",
  대기: "cancel_pending_review",
};

/** 예약 현황 도넛 차트 — 클릭 시 해당 상태로 필터링된 예약 관리 페이지로 이동. */
export function BookingStatusDonut() {
  const { bookings, tours } = useAppData();
  const navigate = useNavigate();
  const data = computeBookingStatusBreakdown(bookings, tours);

  const chartConfig = Object.fromEntries(
    data.map((d) => [d.name, { label: d.name, color: STATUS_COLORS[d.name as BookingStatusBucket] }]),
  );

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">예약 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[240px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              onClick={(entry) => {
                const bucket = entry?.name as BookingStatusBucket | undefined;
                if (bucket) navigate(`/admin/bookings?status=${STATUS_QUERY[bucket]}`);
              }}
              className="cursor-pointer"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name as BookingStatusBucket]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {data.map((d) => (
            <button
              key={d.name}
              type="button"
              onClick={() => navigate(`/admin/bookings?status=${STATUS_QUERY[d.name as BookingStatusBucket]}`)}
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[11px] text-muted-foreground hover:bg-secondary"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[d.name as BookingStatusBucket] }}
              />
              {d.name} {d.value}건
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

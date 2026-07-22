import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAppData } from "@/contexts/AppDataContext";
import { computeRevenueSeries, type RevenueGranularity } from "@/lib/adminAnalytics";

const chartConfig = {
  총매출: { label: "총매출", color: "hsl(var(--primary))" },
  정산금: { label: "정산금", color: "hsl(var(--accent))" },
  수수료: { label: "수수료", color: "hsl(var(--warning))" },
};

const GRANULARITY_LABEL: Record<RevenueGranularity, string> = {
  day: "오늘",
  week: "주간",
  month: "월간",
  quarter: "분기",
  year: "연간",
};

/** 매출 분석 라인차트 — 총매출/정산금/수수료 동시 표시, 기간 단위 토글. */
export function RevenueLineChart() {
  const { bookings } = useAppData();
  const [granularity, setGranularity] = useState<RevenueGranularity>("month");
  const data = computeRevenueSeries(bookings, granularity);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm font-semibold">매출 분석</CardTitle>
        <Tabs value={granularity} onValueChange={(v) => setGranularity(v as RevenueGranularity)}>
          <TabsList className="h-8">
            {(Object.keys(GRANULARITY_LABEL) as RevenueGranularity[]).map((key) => (
              <TabsTrigger key={key} value={key} className="h-6 px-2.5 text-[11px]">
                {GRANULARITY_LABEL[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">데이터가 없습니다.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
            <LineChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="총매출" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="정산금" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="수수료" stroke="hsl(var(--warning))" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useAppData } from "@/contexts/AppDataContext";
import { computeCountryBookingStats } from "@/lib/adminAnalytics";
import { MONTH_LABELS } from "@/lib/constants";

const chartConfig = {
  count: { label: "예약 건수", color: "hsl(var(--primary))" },
};

/** 지역별(국가별) 예약 현황 막대그래프 + 국가/월/기간 필터. */
export function CountryBookingBarChart() {
  const { bookings, tours } = useAppData();
  const [countryFilter, setCountryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const filteredBookings = bookings.filter((b) => {
    if (monthFilter === "all") return true;
    const tour = tours.find((t) => t.id === b.tourId);
    if (!tour) return false;
    return new Date(tour.startDate).getMonth() === Number(monthFilter);
  });

  const allStats = computeCountryBookingStats(filteredBookings, tours);
  const data =
    countryFilter === "all" ? allStats : allStats.filter((s) => s.country === countryFilter);

  return (
    <Card className="accent-top-ocean">
      <CardHeader className="flex flex-col gap-2 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-sm font-semibold">지역별 예약 현황</CardTitle>
        <div className="flex gap-1.5">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 국가</SelectItem>
              {allStats.map((s) => (
                <SelectItem key={s.country} value={s.country}>
                  {s.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 월</SelectItem>
              {MONTH_LABELS.map((label, idx) => (
                <SelectItem key={label} value={String(idx)}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">데이터가 없습니다.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
            <BarChart data={data}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="country" tickLine={false} axisLine={false} fontSize={11} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="예약 건수" />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

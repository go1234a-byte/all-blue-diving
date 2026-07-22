import { useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SettlementDetailCard } from "@/components/instructor/SettlementDetailCard";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import { formatDateKR } from "@/lib/dates";
import { downloadCsv } from "@/lib/exportCsv";
import type { Payout } from "@/types";

interface SettlementLedgerProps {
  instructorId: string;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "정산 예정",
  held: "정산 보류",
  released: "정산 완료",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  held: "destructive",
  released: "default",
};

export function SettlementLedger({ instructorId }: SettlementLedgerProps) {
  const { payouts, bookings, getTourById } = useAppData();
  const myPayouts = payouts.filter((p) => p.instructorId === instructorId);
  const [selected, setSelected] = useState<Payout | null>(null);

  const totalFirst = myPayouts.reduce((sum, p) => sum + p.firstAmount, 0);
  const totalSecond = myPayouts.reduce((sum, p) => sum + p.secondAmount, 0);

  const selectedBooking = selected ? bookings.find((b) => b.id === selected.bookingId) : undefined;
  const selectedTour = selectedBooking ? getTourById(selectedBooking.tourId) : undefined;

  const handleDownload = () => {
    const rows = myPayouts.map((payout) => {
      const booking = bookings.find((b) => b.id === payout.bookingId);
      const tour = booking ? getTourById(booking.tourId) : undefined;
      return [
        tour?.title ?? "-",
        booking?.diverName ?? "-",
        payout.firstAmount,
        payout.secondAmount,
        payout.firstAmount + payout.secondAmount,
        STATUS_LABEL[payout.status] ?? payout.status,
        booking ? formatDateKR(booking.createdAt) : "-",
      ];
    });
    downloadCsv(
      `ALLBLUE_정산내역_${new Date().toISOString().slice(0, 10)}.csv`,
      ["투어명", "예약자명", "1차 정산(80%)", "2차 정산(20%)", "합계", "상태", "예약일"],
      rows,
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">1차 정산 합계 (80%)</p>
          <p className="mt-1 text-lg font-bold text-primary">{formatKRW(totalFirst)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground">2차 정산 합계 (20%)</p>
          <p className="mt-1 text-lg font-bold text-primary">{formatKRW(totalSecond)}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          disabled={myPayouts.length === 0}
          onClick={handleDownload}
        >
          <Download className="h-3.5 w-3.5" />
          정산 내역 다운로드 (CSV)
        </Button>
      </div>

      <div className="space-y-2">
        {myPayouts.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">정산 내역이 없습니다.</p>
        )}
        {myPayouts.map((payout) => {
          const booking = bookings.find((b) => b.id === payout.bookingId);
          const tour = booking ? getTourById(booking.tourId) : undefined;
          return (
            <Card
              key={payout.id}
              className="cursor-pointer transition-shadow hover:shadow-ocean"
              onClick={() => setSelected(payout)}
            >
              <CardContent className="space-y-2 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-foreground">{tour?.title ?? "-"}</p>
                  <Badge variant={STATUS_VARIANT[payout.status]} className="shrink-0 text-[10px]">
                    {STATUS_LABEL[payout.status]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">1차 정산 (80%)</p>
                    <p className="font-semibold text-foreground">{formatKRW(payout.firstAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">2차 정산 (20%)</p>
                    <p className="font-semibold text-foreground">{formatKRW(payout.secondAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>정산 상세</DialogTitle>
          </DialogHeader>
          {selected && selectedBooking && selectedTour && (
            <SettlementDetailCard
              tour={selectedTour}
              booking={selectedBooking}
              payout={selected}
              onViewHistory={() => setSelected(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

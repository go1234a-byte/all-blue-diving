import { Lock, Unlock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { formatKRW } from "@/lib/pricing";
import type { PayoutStatus } from "@/types";

const STATUS_LABEL: Record<PayoutStatus, string> = {
  scheduled: "정산 예정",
  held: "정산 보류",
  released: "정산 완료",
};

const STATUS_VARIANT: Record<PayoutStatus, "default" | "secondary" | "destructive"> = {
  scheduled: "secondary",
  held: "destructive",
  released: "default",
};

export function PayoutManagement() {
  const { payouts, instructors, setPayoutStatus } = useAppData();

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>강사</TableHead>
            <TableHead className="text-right">1차 정산 (80%)</TableHead>
            <TableHead className="text-right">2차 정산 (20%)</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payouts.map((payout) => {
            const instructor = instructors.find((i) => i.id === payout.instructorId);
            return (
              <TableRow key={payout.id}>
                <TableCell className="font-medium">{instructor?.name ?? "-"}</TableCell>
                <TableCell className="text-right">{formatKRW(payout.firstAmount)}</TableCell>
                <TableCell className="text-right">{formatKRW(payout.secondAmount)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[payout.status]}>{STATUS_LABEL[payout.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {payout.status === "held" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setPayoutStatus(payout.id, "released")}
                    >
                      <Unlock className="h-3.5 w-3.5" />
                      보류 해제
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1"
                      onClick={() => setPayoutStatus(payout.id, "held")}
                      disabled={payout.status === "released"}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      정산 보류
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

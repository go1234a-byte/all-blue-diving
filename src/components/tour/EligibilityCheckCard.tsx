import { useState } from "react";
import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FREEDIVING_CERT_LABELS, SCUBA_CERT_LABELS } from "@/lib/constants";
import { checkEligibility, type LastDive } from "@/lib/eligibility";
import type { Tour } from "@/types";

interface EligibilityCheckCardProps {
  tour: Pick<Tour, "activityTypes" | "certificationLevel" | "minLogCount">;
}

const MESSAGES = {
  ok: { text: "참가 조건을 충족해요.", tone: "border-success/40 bg-success/10 text-foreground" },
  refresher: {
    text: "참가 조건은 충족하지만 6개월 넘게 쉬셨다면 리프레셔(재교육 다이빙)를 권해요. 강사에게 미리 알려주세요.",
    tone: "border-amber-300 bg-amber-50 text-amber-900",
  },
  "lack-cert": { text: "요구 자격보다 낮아요. 강사에게 참가 가능 여부를 먼저 문의해주세요.", tone: "border-destructive/40 bg-destructive/10 text-destructive" },
} as const;

/** "내 자격으로 갈 수 있나?" — 사진만 보고 수준에 안 맞는 투어를 고르는 실수를 예약 전에 막는다. */
export function EligibilityCheckCard({ tour }: EligibilityCheckCardProps) {
  const isFreediving = tour.activityTypes.includes("freediving") && !tour.activityTypes.includes("scuba");
  const labels: Record<string, string> = isFreediving ? FREEDIVING_CERT_LABELS : SCUBA_CERT_LABELS;
  const [myCert, setMyCert] = useState("");
  const [myLogs, setMyLogs] = useState("");
  const [lastDive, setLastDive] = useState<LastDive>("recent");

  const result = myCert
    ? checkEligibility({
        isFreediving,
        requiredCert: tour.certificationLevel,
        minLogCount: tour.minLogCount,
        myCert,
        myLogs: Number(myLogs) || 0,
        lastDive,
      })
    : null;
  const message =
    result?.status === "lack-logs"
      ? { text: `로그가 ${result.missing}회 부족해요. 강사에게 참가 가능 여부를 먼저 문의해주세요.`, tone: MESSAGES["lack-cert"].tone }
      : result && MESSAGES[result.status];

  const field = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <UserCheck className="h-4 w-4 text-primary" />내 자격으로 갈 수 있을까요?
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <label className="space-y-1 text-[11px] text-muted-foreground">
            내 자격
            <select className={field} value={myCert} onChange={(e) => setMyCert(e.target.value)}>
              <option value="">선택</option>
              {Object.entries(labels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-[11px] text-muted-foreground">
            로그 수
            <input
              className={field}
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="0"
              value={myLogs}
              onChange={(e) => setMyLogs(e.target.value)}
            />
          </label>
          <label className="space-y-1 text-[11px] text-muted-foreground">
            마지막 다이빙
            <select className={field} value={lastDive} onChange={(e) => setLastDive(e.target.value as LastDive)}>
              <option value="recent">6개월 이내</option>
              <option value="over6m">6개월 이상 전</option>
            </select>
          </label>
        </div>
        {message && (
          <p role="status" className={`rounded-md border p-2.5 text-xs ${message.tone}`}>
            {message.text}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">안내용이에요. 최종 참가 여부는 강사가 확인합니다.</p>
      </CardContent>
    </Card>
  );
}

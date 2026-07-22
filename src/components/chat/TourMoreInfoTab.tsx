import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Backpack,
  Globe2,
  Plane,
  ScrollText,
  ShieldCheck,
  StampIcon,
  UserRound,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { CANCELLATION_POLICY_LINES, CANCELLATION_POLICY_NOTE } from "@/lib/refund";
import { getImmigrationGuide } from "@/lib/immigrationGuide";
import { maskName } from "@/lib/masking";
import type { Booking, Tour } from "@/types";

interface TourMoreInfoTabProps {
  tour: Tour;
  bookings: Booking[];
  myBooking?: Booking;
  isInstructor: boolean;
}

function useChecklist(tourId: string, items: string[]) {
  const storageKey = `allblue-checklist-${tourId}`;
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setChecked(stored ? JSON.parse(stored) : {});
    } catch {
      setChecked({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const toggle = (item: string) => {
    setChecked((prev) => {
      const next = { ...prev, [item]: !prev[item] };
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return { checked, toggle };
}

export function TourMoreInfoTab({ tour, bookings, myBooking, isInstructor }: TourMoreInfoTabProps) {
  const { updateBookingTravelInfo, diverProfiles } = useAppData();
  const checklistItems = (tour.prepNotes ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
  const { checked, toggle } = useChecklist(tour.id, checklistItems);

  const [flightDraft, setFlightDraft] = useState(myBooking?.flightInfo ?? "");
  const [passportDraft, setPassportDraft] = useState(myBooking?.passportInfo ?? "");
  const [saving, setSaving] = useState(false);

  const handleSaveTravelInfo = async () => {
    if (!myBooking) return;
    setSaving(true);
    try {
      await updateBookingTravelInfo(myBooking.id, { flightInfo: flightDraft, passportInfo: passportDraft });
    } finally {
      setSaving(false);
    }
  };

  const myProfile = myBooking ? diverProfiles.find((p) => p.id === myBooking.diverId) : undefined;

  return (
    <Accordion type="multiple" defaultValue={["prep"]} className="space-y-2">
      <AccordionItem value="prep" className="rounded-xl border border-border bg-card px-3">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
          <span className="flex items-center gap-2">
            <Backpack className="h-4 w-4 text-primary" />
            준비물 · 체크리스트
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-1.5 pb-4">
          {checklistItems.length === 0 ? (
            <p className="text-xs text-muted-foreground">등록된 준비물이 없습니다.</p>
          ) : (
            checklistItems.map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={!!checked[item]} onCheckedChange={() => toggle(item)} />
                <span className={checked[item] ? "text-muted-foreground line-through" : ""}>{item}</span>
              </label>
            ))
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="travel" className="rounded-xl border border-border bg-card px-3">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
          <span className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            항공 · 여권 정보
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {myBooking ? (
            <>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">내 항공편 정보</p>
                <Textarea
                  value={flightDraft}
                  onChange={(e) => setFlightDraft(e.target.value)}
                  placeholder="예: KE123편, 도착 7/20 14:30"
                  className="min-h-16 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">여권 정보</p>
                <Textarea
                  value={passportDraft}
                  onChange={(e) => setPassportDraft(e.target.value)}
                  placeholder="예: 여권 만료일 2030.01.01 (강사만 확인 가능)"
                  className="min-h-14 text-sm"
                />
              </div>
              <Button size="sm" className="h-8 text-xs" disabled={saving} onClick={handleSaveTravelInfo}>
                {saving ? "저장 중..." : "저장"}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                * 입력하신 정보는 본인과 담당 강사만 확인할 수 있습니다.
              </p>
            </>
          ) : isInstructor ? (
            <div className="space-y-2">
              {bookings.length === 0 && <p className="text-xs text-muted-foreground">참가자가 없습니다.</p>}
              {bookings.map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-2.5 text-xs">
                  <p className="font-medium text-foreground">{maskName(b.diverName)}</p>
                  <p className="text-muted-foreground">✈️ {b.flightInfo || "미입력"}</p>
                  <p className="text-muted-foreground">🛂 {b.passportInfo || "미입력"}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">예약 내역이 있는 경우에만 입력할 수 있습니다.</p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="safety" className="rounded-xl border border-border bg-card px-3">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            보험 · 긴급연락처
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-3 pb-4">
          {myBooking ? (
            <div className="space-y-1.5 text-xs text-foreground">
              <p>
                <span className="font-medium">보험 정보 </span>
                {myProfile?.insuranceInfo || "미등록"}
              </p>
              <p>
                <span className="font-medium">긴급연락처 </span>
                {myProfile?.emergencyContactName
                  ? `${myProfile.emergencyContactName} (${myProfile.emergencyContactPhone ?? "-"})`
                  : "미등록"}
              </p>
              <Link to="/mypage" className="inline-block text-xs font-medium text-primary underline underline-offset-2">
                마이페이지에서 수정하기
              </Link>
            </div>
          ) : isInstructor ? (
            <div className="space-y-2">
              {bookings.map((b) => {
                const p = diverProfiles.find((dp) => dp.id === b.diverId);
                return (
                  <div key={b.id} className="flex items-center gap-2 rounded-lg border border-border p-2.5 text-xs">
                    <UserRound className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{maskName(b.diverName)}</p>
                      <p className="text-muted-foreground">
                        긴급연락처: {p?.emergencyContactName ? `${p.emergencyContactName}(${p.emergencyContactPhone ?? "-"})` : "미등록"}
                        {" · "}보험: {p?.insuranceInfo || "미등록"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">예약 내역이 있는 경우에만 확인할 수 있습니다.</p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="immigration" className="rounded-xl border border-border bg-card px-3">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
          <span className="flex items-center gap-2">
            <StampIcon className="h-4 w-4 text-primary" />
            출입국 안내
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <p className="flex items-start gap-1.5 break-keep text-xs text-muted-foreground">
            <Globe2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            {getImmigrationGuide(tour.country)}
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="policy" className="rounded-xl border border-border bg-card px-3">
        <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
          <span className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" />
            취소 및 환불 규정
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-1 pb-4">
          {CANCELLATION_POLICY_LINES.map((line) => (
            <p key={line} className="break-keep text-xs text-muted-foreground">
              {line}
            </p>
          ))}
          <p className="break-keep pt-1 text-[11px] text-muted-foreground">{CANCELLATION_POLICY_NOTE}</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

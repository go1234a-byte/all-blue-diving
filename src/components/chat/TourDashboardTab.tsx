import { useState } from "react";
import { CalendarDays, Megaphone, Pencil, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import { formatDateRangeKR, dDayLabel } from "@/lib/dates";
import type { Booking, Tour } from "@/types";

interface TourDashboardTabProps {
  tour: Tour;
  bookings: Booking[];
  isInstructor: boolean;
}

/** 참가자 대시보드 [대시보드] 탭 — 일정 요약, D-Day, 참가자 수, 강사 공지. */
export function TourDashboardTab({ tour, bookings, isInstructor }: TourDashboardTabProps) {
  const { updateTourNotice } = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(tour.instructorNotice ?? "");
  const [saving, setSaving] = useState(false);

  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTourNotice(tour.id, draft.trim());
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">투어 일정</p>
            <p className="text-sm font-semibold text-foreground">
              {formatDateRangeKR(tour.startDate, tour.endDate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            <Badge className="bg-primary text-primary-foreground">{dDayLabel(tour.startDate)}</Badge>
            <p className="text-xs text-muted-foreground">출발까지</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">참가자 수</p>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {confirmedCount} / {tour.maxParticipants}명
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/40">
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Megaphone className="h-4 w-4 text-primary" />
              강사 공지
            </p>
            {isInstructor && !editing && (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setEditing(true)}>
                <Pencil className="h-3 w-3" />
                수정
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="참가자에게 전달할 공지사항을 입력해주세요"
                className="min-h-20 text-sm"
              />
              <div className="flex justify-end gap-1.5">
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(false)}>
                  취소
                </Button>
                <Button size="sm" className="h-7 text-xs" disabled={saving} onClick={handleSave}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line break-keep text-sm text-muted-foreground">
              {tour.instructorNotice || "등록된 공지가 없습니다."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

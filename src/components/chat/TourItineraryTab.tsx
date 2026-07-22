import { useState } from "react";
import { CalendarRange, Plus, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/contexts/AppDataContext";
import type { Tour, TourItineraryDay } from "@/types";

interface TourItineraryTabProps {
  tour: Tour;
  isInstructor: boolean;
}

const EMPTY_DAY = (dayNumber: number): TourItineraryDay => ({
  dayNumber,
  title: `${dayNumber}일차`,
  briefing: "",
  diving: "",
  meals: "",
  freeTime: "",
});

/** 참가자 대시보드 [일정] 탭 — 집합 정보 + 일자별 브리핑/다이빙일정/식사/자유시간. */
export function TourItineraryTab({ tour, isInstructor }: TourItineraryTabProps) {
  const { updateTourItinerary, updateTourMeetingInfo } = useAppData();
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<TourItineraryDay[]>(tour.itineraryDays ?? []);
  const [meetingPoint, setMeetingPoint] = useState(tour.meetingPoint ?? "");
  const [meetingTime, setMeetingTime] = useState(tour.meetingTime ?? "");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setDays(tour.itineraryDays && tour.itineraryDays.length > 0 ? tour.itineraryDays : [EMPTY_DAY(1)]);
    setMeetingPoint(tour.meetingPoint ?? "");
    setMeetingTime(tour.meetingTime ?? "");
    setEditing(true);
  };

  const updateDay = (index: number, patch: Partial<TourItineraryDay>) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const addDay = () => setDays((prev) => [...prev, EMPTY_DAY(prev.length + 1)]);
  const removeDay = (index: number) => setDays((prev) => prev.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateTourItinerary(tour.id, days),
        updateTourMeetingInfo(tour.id, meetingPoint.trim(), meetingTime.trim()),
      ]);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="grid grid-cols-2 gap-3 p-3">
            <div className="space-y-1">
              <Label className="text-xs">집합 장소</Label>
              <Input value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">집합 시간</Label>
              <Input value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} className="h-8 text-sm" />
            </div>
          </CardContent>
        </Card>
        {days.map((day, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <Input
                  value={day.title}
                  onChange={(e) => updateDay(index, { title: e.target.value })}
                  className="h-8 flex-1 font-semibold"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 text-destructive"
                  onClick={() => removeDay(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">브리핑</Label>
                <Textarea
                  value={day.briefing}
                  onChange={(e) => updateDay(index, { briefing: e.target.value })}
                  className="min-h-14 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">다이빙 일정</Label>
                <Textarea
                  value={day.diving}
                  onChange={(e) => updateDay(index, { diving: e.target.value })}
                  className="min-h-14 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">식사</Label>
                <Textarea
                  value={day.meals}
                  onChange={(e) => updateDay(index, { meals: e.target.value })}
                  className="min-h-10 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">자유시간</Label>
                <Textarea
                  value={day.freeTime}
                  onChange={(e) => updateDay(index, { freeTime: e.target.value })}
                  className="min-h-10 text-sm"
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addDay}>
            <Plus className="h-3.5 w-3.5" />
            일차 추가
          </Button>
          <div className="flex gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              취소
            </Button>
            <Button size="sm" className="gap-1.5" disabled={saving} onClick={handleSave}>
              <Save className="h-3.5 w-3.5" />
              {saving ? "저장 중..." : "일정 저장"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const savedDays = tour.itineraryDays ?? [];

  return (
    <div className="space-y-3">
      {isInstructor && (
        <div className="flex justify-end">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={startEditing}>
            <CalendarRange className="h-3.5 w-3.5" />
            {savedDays.length > 0 ? "일정 수정" : "일정 등록"}
          </Button>
        </div>
      )}

      {(tour.meetingPoint || tour.meetingTime) && (
        <Card>
          <CardContent className="space-y-1 p-4 text-sm">
            <p className="font-semibold text-foreground">집합 정보</p>
            {tour.meetingPoint && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">장소 </span>
                {tour.meetingPoint}
              </p>
            )}
            {tour.meetingTime && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">시간 </span>
                {tour.meetingTime}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {savedDays.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">아직 등록된 일정이 없습니다.</p>
      ) : (
        savedDays.map((day) => (
          <Card key={day.dayNumber}>
            <CardContent className="space-y-1.5 p-4">
              <p className="text-sm font-semibold text-foreground">{day.title}</p>
              {day.briefing && (
                <p className="break-keep text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">브리핑 </span>
                  {day.briefing}
                </p>
              )}
              {day.diving && (
                <p className="break-keep text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">다이빙 </span>
                  {day.diving}
                </p>
              )}
              {day.meals && (
                <p className="break-keep text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">식사 </span>
                  {day.meals}
                </p>
              )}
              {day.freeTime && (
                <p className="break-keep text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">자유시간 </span>
                  {day.freeTime}
                </p>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

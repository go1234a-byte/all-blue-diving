import { useState } from "react";
import { AlertTriangle, BedDouble, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assignRooms } from "@/lib/roomAssignment";
import { ROOM_LEGAL_NOTICE } from "@/lib/constants";
import { maskName } from "@/lib/masking";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import type { Booking } from "@/types";

interface RoomAssignmentDashboardProps {
  bookings: Booking[];
  /** 강사(또는 관리자)인 경우 방 배정을 직접 수정할 수 있는 입력창이 노출된다. */
  isInstructor: boolean;
}

/**
 * 룸 배정 현황. 다이버는 읽기 전용(이름 마스킹)으로 보고, 강사/관리자는 각 참가자별로
 * 방 번호를 직접 입력해 수정할 수 있다. booking.roomNo에 저장되며, 아직 아무도 방을
 * 지정하지 않았다면 "성별/선호 기준 자동 배정" 버튼으로 한 번에 초안을 만든 뒤 다듬을 수 있다.
 */
export function RoomAssignmentDashboard({ bookings, isInstructor }: RoomAssignmentDashboardProps) {
  const { updateBookingRoom } = useAppData();
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const unassigned = confirmedBookings.filter((b) => !b.roomNo);

  const roomsMap = new Map<string, Booking[]>();
  confirmedBookings.forEach((b) => {
    if (!b.roomNo) return;
    if (!roomsMap.has(b.roomNo)) roomsMap.set(b.roomNo, []);
    roomsMap.get(b.roomNo)!.push(b);
  });
  const rooms = Array.from(roomsMap.entries())
    .map(([roomNo, occupants]) => ({ roomNo, occupants }))
    .sort((a, b) => a.roomNo.localeCompare(b.roomNo));

  const handleAutoAssign = async () => {
    setApplying(true);
    try {
      const suggested = assignRooms(confirmedBookings);
      for (const room of suggested) {
        for (const occupant of room.occupants) {
          if (occupant.roomNo !== room.roomNo) {
            await updateBookingRoom(occupant.id, room.roomNo);
          }
        }
      }
      toast({ title: "성별/선호 기준으로 자동 배정했어요", description: "필요하면 아래에서 방 번호를 직접 수정할 수 있어요." });
    } finally {
      setApplying(false);
    }
  };

  const handleRoomInputBlur = (bookingId: string, currentRoomNo: string | undefined, value: string) => {
    const next = value.trim();
    if (next === (currentRoomNo ?? "")) return;
    void updateBookingRoom(bookingId, next || null);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-warning/50 bg-warning/10 text-warning-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-xs font-medium">{ROOM_LEGAL_NOTICE}</AlertDescription>
      </Alert>

      {isInstructor && confirmedBookings.length > 0 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          onClick={handleAutoAssign}
          disabled={applying}
        >
          <Wand2 className="h-3.5 w-3.5" />
          {applying ? "적용 중..." : "성별/선호 기준 자동 배정"}
        </Button>
      )}

      {rooms.length === 0 && unassigned.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">참가자가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <Card key={room.roomNo}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <BedDouble className="h-4 w-4 text-primary" />
                    {room.roomNo}호실
                  </div>
                  <Badge variant="secondary">{room.occupants.length}인실</Badge>
                </div>
                <ul className="space-y-1.5">
                  {room.occupants.map((o) => (
                    <li key={o.id} className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{isInstructor ? o.diverName : maskName(o.diverName)}</span>
                        <span className="flex gap-1">
                          {o.snoring && <Badge variant="outline" className="text-[10px]">코골이</Badge>}
                          {o.smoking && <Badge variant="outline" className="text-[10px]">흡연</Badge>}
                          {o.drinking && <Badge variant="outline" className="text-[10px]">음주</Badge>}
                        </span>
                      </div>
                      {o.roomNote && (
                        <p className="break-keep rounded-md bg-secondary/50 px-2 py-1 text-[11px]">
                          {o.roomNote}
                        </p>
                      )}
                      {isInstructor && (
                        <Input
                          defaultValue={o.roomNo ?? ""}
                          placeholder="방 번호 (예: M-01)"
                          className="h-7 text-xs"
                          onBlur={(e) => handleRoomInputBlur(o.id, o.roomNo, e.target.value)}
                        />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isInstructor && unassigned.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground">미배정 참가자 ({unassigned.length}명)</h4>
          <div className="space-y-1.5">
            {unassigned.map((o) => (
              <div
                key={o.id}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-xs"
              >
                <span className="flex-1 text-foreground">{o.diverName}</span>
                <Input
                  defaultValue=""
                  placeholder="방 번호 입력"
                  className="h-7 w-32 text-xs"
                  onBlur={(e) => handleRoomInputBlur(o.id, o.roomNo, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

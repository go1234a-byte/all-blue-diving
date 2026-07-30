import { useState } from "react";
import { AlertTriangle, BedDouble, Wand2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assignRooms, flattenBookingsToOccupants, type RoomOccupant } from "@/lib/roomAssignment";
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
 * 방 번호를 직접 입력해 수정할 수 있다. 예약 1건에 본인 외 동반자가 여러 명 있을 수
 * 있어서(참가자 수만큼 참가자 정보 입력 기능 도입 이후), 방 배정은 예약 단위가 아니라
 * "사람 단위(occupant)"로 계산한다 — flattenBookingsToOccupants가 예약자 본인과
 * companions 배열의 동반자를 각각 별도 인원으로 펼쳐준다. 본인은 booking.roomNo에,
 * 동반자는 companions 배열 안 해당 인원의 roomNo에 각각 저장된다. 아직 아무도 방을
 * 지정하지 않았다면 "성별/선호 기준 자동 배정" 버튼으로 한 번에 초안을 만든 뒤 다듬을 수 있다.
 */
export function RoomAssignmentDashboard({ bookings, isInstructor }: RoomAssignmentDashboardProps) {
  const { updateBookingRoom, updateCompanionRoom } = useAppData();
  const { toast } = useToast();
  const [applying, setApplying] = useState(false);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const occupants = flattenBookingsToOccupants(confirmedBookings);
  const unassigned = occupants.filter((o) => !o.roomNo);

  const roomsMap = new Map<string, RoomOccupant[]>();
  occupants.forEach((o) => {
    if (!o.roomNo) return;
    if (!roomsMap.has(o.roomNo)) roomsMap.set(o.roomNo, []);
    roomsMap.get(o.roomNo)!.push(o);
  });
  const rooms = Array.from(roomsMap.entries())
    .map(([roomNo, occs]) => ({ roomNo, occupants: occs }))
    .sort((a, b) => a.roomNo.localeCompare(b.roomNo));

  /** occupant가 예약자 본인이면 updateBookingRoom, 동반자면 updateCompanionRoom으로 분기. */
  const applyRoomNo = async (occupant: RoomOccupant, roomNo: string | null) => {
    if (occupant.companionIndex == null) {
      await updateBookingRoom(occupant.bookingId, roomNo);
    } else {
      await updateCompanionRoom(occupant.bookingId, occupant.companionIndex, roomNo);
    }
  };

  const handleAutoAssign = async () => {
    setApplying(true);
    try {
      const suggested = assignRooms(occupants);
      for (const room of suggested) {
        for (const occupant of room.occupants) {
          if (occupant.roomNo !== room.roomNo) {
            await applyRoomNo(occupant, room.roomNo);
          }
        }
      }
      toast({ title: "성별/선호 기준으로 자동 배정했어요", description: "필요하면 아래에서 방 번호를 직접 수정할 수 있어요." });
    } finally {
      setApplying(false);
    }
  };

  const handleRoomInputBlur = (occupant: RoomOccupant, value: string) => {
    const next = value.trim();
    if (next === (occupant.roomNo ?? "")) return;
    void applyRoomNo(occupant, next || null);
  };

  return (
    <div className="space-y-4">
      <Alert className="border-warning/50 bg-warning/10 text-warning-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-xs font-medium">{ROOM_LEGAL_NOTICE}</AlertDescription>
      </Alert>

      {isInstructor && occupants.length > 0 && (
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
                    <li key={o.key} className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>{isInstructor ? o.name : maskName(o.name)}</span>
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
                          onBlur={(e) => handleRoomInputBlur(o, e.target.value)}
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
                key={o.key}
                className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2 text-xs"
              >
                <span className="flex-1 text-foreground">{o.name}</span>
                <Input
                  defaultValue=""
                  placeholder="방 번호 입력"
                  className="h-7 w-32 text-xs"
                  onBlur={(e) => handleRoomInputBlur(o, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { AlertTriangle, BedDouble } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { assignRooms } from "@/lib/roomAssignment";
import { ROOM_LEGAL_NOTICE } from "@/lib/constants";
import { maskName } from "@/lib/masking";
import type { Booking } from "@/types";

interface RoomAssignmentDashboardProps {
  bookings: Booking[];
}

export function RoomAssignmentDashboard({ bookings }: RoomAssignmentDashboardProps) {
  const rooms = assignRooms(bookings);

  return (
    <div className="space-y-4">
      <Alert className="border-warning/50 bg-warning/10 text-warning-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="text-xs font-medium">{ROOM_LEGAL_NOTICE}</AlertDescription>
      </Alert>

      {rooms.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">배정된 룸이 없습니다.</p>
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
                        <span>{maskName(o.diverName)}</span>
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
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

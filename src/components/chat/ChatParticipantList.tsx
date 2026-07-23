import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldCheck, User, XCircle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelBookingDialog } from "@/components/mypage/CancelBookingDialog";
import { maskName } from "@/lib/masking";
import { calculateAge } from "@/lib/dates";
import { useAppData } from "@/contexts/AppDataContext";
import type { Booking, Tour } from "@/types";

interface ChatParticipantListProps {
  bookings: Booking[];
  instructorId?: string;
  instructorName?: string;
  /** 현재 보고 있는 사람이 이 투어의 담당 강사(또는 관리자)인지 여부 — 참가자 실명/취소 버튼 노출 여부를 결정한다. */
  isInstructor: boolean;
  /** 강사/관리자가 예약을 취소할 때 환불율 계산에 필요한 투어 정보. */
  tour?: Tour;
}

/**
 * 채팅방 참가자 탭.
 * - 강사가 보는 경우: 참가자 실명 + 나이 + 등급(C-Card) + 로그수 + 흡연/코골이 여부를 그대로 확인할 수 있고,
 *   예약을 직접 취소할 수도 있다(중복 예약 정리 등).
 * - 다이버(일반 참가자)가 보는 경우: 담당 강사의 이름/프로필로 바로 이동할 수 있고,
 *   다른 참가자는 이름이 마스킹되지만(예: 김*태) 등급과 로그수는 동일하게 확인할 수 있다.
 */
export function ChatParticipantList({
  bookings,
  instructorId,
  instructorName,
  isInstructor,
  tour,
}: ChatParticipantListProps) {
  const { diverProfiles } = useAppData();
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  // 같은 다이버가 예약을 두 번 이상 한 경우(중복예약 방지 기능 도입 전 발생한 과거 기록 등) 눈에 띄게 표시한다.
  const diverIdCounts = new Map<string, number>();
  bookings.forEach((b) => {
    diverIdCounts.set(b.diverId, (diverIdCounts.get(b.diverId) ?? 0) + 1);
  });

  return (
    <div className="space-y-2">
      {instructorName && (
        <Link
          to={instructorId ? `/instructor/${instructorId}/profile` : "#"}
          className="flex items-center gap-3 rounded-lg border border-primary/30 bg-secondary px-3 py-2 transition-colors hover:bg-secondary/70"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <ShieldCheck className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{instructorName}</p>
            <p className="text-xs text-muted-foreground">담당 강사 · 프로필 보기</p>
          </div>
          <Badge className="bg-accent text-accent-foreground">강사</Badge>
        </Link>
      )}
      {bookings.map((booking) => {
        const diverProfile = diverProfiles.find((p) => p.id === booking.diverId);
        const age = diverProfile?.birthDate ? calculateAge(diverProfile.birthDate) : undefined;
        const isDuplicate = (diverIdCounts.get(booking.diverId) ?? 0) > 1;
        return (
          <div key={booking.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {isInstructor ? booking.diverName : maskName(booking.diverName)}
                {isInstructor && age != null ? ` ${age}세` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {booking.gender === "male" ? "남성" : "여성"}
                {booking.roomNo ? ` · ${booking.roomNo}호실` : ""}
              </p>
              {isInstructor && isDuplicate && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  같은 다이버의 예약이 여러 건 있어요. 중복이면 하나를 취소해주세요.
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                  {diverProfile?.cCardAgency || "등급 미등록"}
                </Badge>
                <span>로그 {diverProfile?.logCount != null ? `${diverProfile.logCount}회` : "미등록"}</span>
                {booking.smoking && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                    흡연
                  </Badge>
                )}
                {booking.snoring && (
                  <Badge variant="outline" className="px-1.5 py-0 text-[9px]">
                    코골이
                  </Badge>
                )}
              </div>
              {booking.selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {booking.selectedOptions.map((option) => (
                    <Badge key={option.name} variant="outline" className="break-keep text-[9px]">
                      {option.name}
                    </Badge>
                  ))}
                </div>
              )}
              {isInstructor && tour && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 gap-1 px-1.5 text-[11px] text-destructive hover:text-destructive"
                  onClick={() => setCancelTarget(booking)}
                >
                  <XCircle className="h-3 w-3" />
                  예약 취소
                </Button>
              )}
            </div>
          </div>
        );
      })}
      {bookings.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">참가자가 없습니다.</p>
      )}
      <p className="pt-2 text-xs text-muted-foreground">
        * 개인정보 보호를 위해 참가자 이름/나이는 강사/관리자를 제외하고 마스킹되어 표시됩니다.
      </p>
      {tour && cancelTarget && (
        <CancelBookingDialog
          open={!!cancelTarget}
          onOpenChange={(open) => !open && setCancelTarget(null)}
          booking={cancelTarget}
          tour={tour}
        />
      )}
    </div>
  );
}

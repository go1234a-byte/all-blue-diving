import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { useToast } from "@/hooks/use-toast";
import { formatDateKR } from "@/lib/dates";
import { formatKRW } from "@/lib/pricing";
import type { ProfileStatus } from "@/types";

const STATUS_LABEL: Record<ProfileStatus, string> = {
  active: "정상",
  warned: "경고",
  suspended: "활동정지",
};

const STATUS_VARIANT: Record<ProfileStatus, "default" | "secondary" | "destructive"> = {
  active: "default",
  warned: "secondary",
  suspended: "destructive",
};

const GENDER_LABEL: Record<string, string> = {
  male: "남",
  female: "여",
  other: "선택 안함",
};

/** 관리자 전용 — 다이버 회원 상세 정보 + 경고/정지 관리. 강사 프로필의 관리자 패널과 동일한 패턴. */
const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { diverProfiles, bookings, getTourById, setProfileStatus } = useAppData();
  const { toast } = useToast();

  const diver = diverProfiles.find((p) => p.id === id);
  const diverBookings = [...bookings]
    .filter((b) => b.diverId === id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  if (!diver) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => navigate(-1)} className="text-foreground" aria-label="뒤로가기">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="py-10 text-center text-sm text-muted-foreground">회원 정보를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const handleStatusChange = (status: ProfileStatus) => {
    setProfileStatus(diver.id, status);
    toast({ title: `${diver.name}님을 ${STATUS_LABEL[status]} 처리했습니다.` });
  };

  return (
    <div className="space-y-4">
      <button type="button" onClick={() => navigate(-1)} className="text-foreground" aria-label="뒤로가기">
        <ArrowLeft className="h-5 w-5" />
      </button>

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-semibold text-foreground">{diver.name}</p>
              <Badge variant="outline" className="text-[10px]">다이버</Badge>
            </div>
            <Badge variant={STATUS_VARIANT[diver.status]} className="text-[10px]">
              {STATUS_LABEL[diver.status]}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">연락처</p>
              <p className="font-medium text-foreground">{diver.phone || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">성별</p>
              <p className="font-medium text-foreground">{GENDER_LABEL[diver.gender] ?? "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">가입일</p>
              <p className="font-medium text-foreground">{formatDateKR(diver.createdAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">회원 ID</p>
              <p className="truncate font-mono text-[10px] font-medium text-foreground">{diver.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h3 className="text-sm font-semibold text-foreground">다이빙 정보</h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <p className="text-muted-foreground">C-Card 발급기관</p>
              <p className="font-medium text-foreground">{diver.cCardAgency || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">C-Card 번호</p>
              <p className="font-medium text-foreground">{diver.cCardNumber || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">누적 다이빙 로그</p>
              <p className="font-medium text-foreground">{diver.logCount ?? 0}회</p>
            </div>
            <div>
              <p className="text-muted-foreground">여행자/다이빙 보험</p>
              <p className="font-medium text-foreground">{diver.insuranceInfo || "미가입"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">비상연락처</p>
              <p className="font-medium text-foreground">
                {diver.emergencyContactName
                  ? `${diver.emergencyContactName} (${diver.emergencyContactPhone ?? "-"})`
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">코골이/흡연</p>
              <p className="font-medium text-foreground">
                {diver.snoring ? "코골이 O" : "코골이 X"} · {diver.smoking ? "흡연 O" : "흡연 X"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2 p-4">
          <h3 className="text-sm font-semibold text-foreground">경고/정지 관리</h3>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1 text-xs" disabled={diver.status === "warned"}>
                  회원 경고
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{diver.name}님에게 경고를 주시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>경고 처리 시 회원 상태가 &apos;경고&apos;로 변경됩니다.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange("warned")}>경고 처리</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1 text-xs"
                  disabled={diver.status === "suspended"}
                >
                  활동 정지
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{diver.name}님을 활동정지 시키겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    활동정지 처리 시 해당 회원은 서비스 이용이 제한됩니다. 이 작업은 나중에 다시 해제할 수 있습니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange("suspended")}>활동정지</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {diver.status !== "active" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-full text-xs">
                  {diver.status === "warned" ? "경고 해제" : "활동정지 해제"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{diver.name}님을 정상 상태로 되돌리시겠습니까?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {diver.status === "warned" ? "경고" : "활동정지"} 처리가 해제되고 &apos;정상&apos; 상태로 변경됩니다.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>취소</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleStatusChange("active")}>정상으로 복귀</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">예약 내역 ({diverBookings.length}건)</h3>
        {diverBookings.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">예약 내역이 없습니다.</p>
        )}
        {diverBookings.map((booking) => {
          const tour = getTourById(booking.tourId);
          return (
            <Link key={booking.id} to={`/admin/bookings?highlight=${booking.id}`}>
              <Card className="transition-shadow hover:shadow-ocean">
                <CardContent className="space-y-1 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">{tour?.title ?? "-"}</p>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {booking.status === "confirmed" ? "예약확정" : booking.status === "cancelled" ? "취소됨" : "취소 심사중"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateKR(booking.createdAt)}</p>
                  <p className="text-sm font-semibold text-primary">{formatKRW(booking.totalPaid)}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUserDetailPage;

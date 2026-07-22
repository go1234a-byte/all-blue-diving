import { Link } from "react-router-dom";
import { MessageCircleQuestion, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LicenseVaultCard } from "@/components/mypage/LicenseVaultCard";
import { DiverSafetyProfileCard } from "@/components/mypage/DiverSafetyProfileCard";
import { InquiryHistoryList } from "@/components/mypage/InquiryHistoryList";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { PolicyDisclosure } from "@/components/policy/PolicyDisclosure";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

export function DiverMyPageView() {
  const { diverProfiles } = useAppData();
  const { currentDiverId } = useRole();
  const profile = diverProfiles.find((p) => p.id === currentDiverId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-foreground">{profile?.name ?? "게스트 다이버"}</p>
          <p className="text-xs text-muted-foreground">{profile?.phone ?? "-"}</p>
        </div>
      </div>

      <LicenseVaultCard />

      <DiverSafetyProfileCard profile={profile} diverId={currentDiverId} />

      <Link
        to="/my-bookings"
        className="flex items-center justify-between rounded-xl border border-border bg-card p-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
      >
        내 예약 내역 보기
      </Link>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">문의 내역</h3>
        <InquiryHistoryList diverId={currentDiverId} />
      </div>

      <Link
        to="/support"
        className="flex items-center gap-2 rounded-xl border border-primary/30 bg-secondary/40 p-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
      >
        <MessageCircleQuestion className="h-4 w-4 shrink-0 text-primary" />
        1:1 고객센터 문의
      </Link>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">주요 정책 및 안전 규정</h3>
        <PolicyDisclosure />
      </div>

      <PushNotificationToggle />

      <AccountActions />

      <Link
        to="/instructor"
        className="block rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-4 text-center text-xs text-muted-foreground"
      >
        강사이신가요? 마스터 테스트 툴바에서 &quot;강사&quot; 역할로 전환해보세요.
      </Link>
    </div>
  );
}

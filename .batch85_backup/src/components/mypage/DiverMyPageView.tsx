import { Link } from "react-router-dom";
import { CalendarCheck, ChevronRight, MessageCircleQuestion, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LicenseVaultCard } from "@/components/mypage/LicenseVaultCard";
import { DiverSafetyProfileCard } from "@/components/mypage/DiverSafetyProfileCard";
import { InquiryHistoryList } from "@/components/mypage/InquiryHistoryList";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
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
        <Avatar className="h-14 w-14 border-2 border-accent/40">
          <AvatarFallback className="bg-gradient-ocean-light text-primary-foreground">
            <User className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold text-foreground">
            안녕하세요, {profile?.name ?? "게스트 다이버"}님!
          </p>
          <p className="text-xs text-muted-foreground">{profile?.phone ?? "-"}</p>
        </div>
      </div>

      <LicenseVaultCard />

      <DiverSafetyProfileCard profile={profile} diverId={currentDiverId} />

      {/* 시안의 메뉴 리스트(아이콘 + 라벨 + 화살표) 구성을 그대로 적용 */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Link
          to="/my-bookings"
          className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          <CalendarCheck className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1">내 예약 내역 보기</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        <div className="border-t border-border" />
        <Link
          to="/support"
          className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/40"
        >
          <MessageCircleQuestion className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1">1:1 고객센터 문의</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">문의 내역</h3>
        <InquiryHistoryList diverId={currentDiverId} />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">주요 정책 및 안전 규정</h3>
        <PolicyDisclosure />
      </div>

      <PushNotificationToggle />

      <ThemeToggle />

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

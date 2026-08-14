import { Link } from "react-router-dom";
import { CalendarCheck, ChevronRight, Lock, MessageCircleQuestion, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DiverProfileEditCard } from "@/components/mypage/DiverProfileEditCard";
import { DiverSafetyProfileCard } from "@/components/mypage/DiverSafetyProfileCard";
import { InquiryHistoryList } from "@/components/mypage/InquiryHistoryList";
import { AccountActions } from "@/components/mypage/AccountActions";
import { PushNotificationToggle } from "@/components/mypage/PushNotificationToggle";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PolicyDisclosure } from "@/components/policy/PolicyDisclosure";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";

/**
 * 로그인 라우트 가드(RequireRole)를 우회해 도달한 비회원(주로 개발 모드 — RequireRole은
 * QA 역할전환을 위해 개발 모드에서 role만 보고 isLoggedIn은 안 봄)이 실제 프로필/서류
 * 카드를 만지다가 Supabase 업로드가 조용히 실패하는 문제가 있었다. 비회원에게는 실제
 * 카드 대신 잠금 표시만 보여주고 클릭도 막는다.
 */
function LockedFeatureCard({ label }: { label: string }) {
  return (
    <Link
      to="/auth"
      className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 p-4 text-muted-foreground"
    >
      <Lock className="h-5 w-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs">로그인 후 이용할 수 있어요</p>
      </div>
    </Link>
  );
}

export function DiverMyPageView() {
  const { diverProfiles } = useAppData();
  const { currentDiverId, isLoggedIn } = useRole();
  const profile = diverProfiles.find((p) => p.id === currentDiverId);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <Avatar className="h-14 w-14 border-2 border-accent/40">
          <AvatarImage src={profile?.avatarUrl || undefined} alt={profile?.name ?? "프로필"} />
          <AvatarFallback className="bg-gradient-ocean-light text-primary-foreground">
            <User className="h-7 w-7" />
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold text-foreground">
            안녕하세요, {isLoggedIn ? (profile?.name ?? "게스트 다이버") : "비회원"}님!
          </p>
          <p className="text-xs text-muted-foreground">{isLoggedIn ? (profile?.phone ?? "-") : "로그인이 필요해요"}</p>
        </div>
      </div>

      {isLoggedIn ? (
        <>
          <DiverProfileEditCard profile={profile} diverId={currentDiverId} />
          <DiverSafetyProfileCard profile={profile} diverId={currentDiverId} />
        </>
      ) : (
        <>
          <LockedFeatureCard label="내 프로필" />
          <LockedFeatureCard label="다이빙 자격 · 비상연락처 · 보험" />
        </>
      )}

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

      {/* 예전엔 개발 전용 MasterRoleToolbar(import.meta.env.DEV로 프로덕션에서는 렌더되지 않음)로
          역할을 전환하라는 안내였는데, 프로덕션에는 그 툴바 자체가 없어서 다이버가 이 링크를 누르면
          /instructor에서 RequireRole에 막혀 로그인 화면으로 튕겨나가기만 했다. 실제로 강사인 사용자가
          쓸 수 있도록 강사 로그인/가입이 가능한 /auth로 보낸다. */}
      <Link
        to="/auth"
        className="block rounded-xl border border-dashed border-primary/40 bg-secondary/40 p-4 text-center text-xs text-muted-foreground"
      >
        강사이신가요? 강사 계정으로 로그인하거나 가입해보세요.
      </Link>
    </div>
  );
}

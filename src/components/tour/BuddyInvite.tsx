import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { shareOrCopyLink } from "@/lib/share";
import { buildBuddyInviteUrl, getBuddyInvite, rememberBuddyInvite } from "@/lib/buddyInvite";

/**
 * "버디랑 같이 가기" — 초대 링크를 공유한다(카톡 등 기기 공유 시트, 없으면 링크 복사).
 * 다이빙은 버디와 짝지어 들어가는 운동이라 친구 단위 예약이 많다. 친구가 링크로 예약하면
 * 결제 화면의 룸 배정 메모에 "버디 OO님과 같은 방 희망"이 미리 채워진다.
 */
export function BuddyInviteCard({ tourId, booked }: { tourId: string; booked: boolean }) {
  const { isLoggedIn, profile, role } = useRole();
  const { getTourById } = useAppData();
  const { toast } = useToast();
  if (!isLoggedIn || !profile?.id || role !== "public") return null;
  const tour = getTourById(tourId);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-secondary/30 p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Users className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{booked ? "같이 갈 버디를 초대하세요" : "버디랑 같이 가기"}</p>
        <p className="break-keep text-[11px] text-muted-foreground">
          링크로 예약하면 같은 방 배정을 자동으로 요청해 드려요.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1 text-xs"
        onClick={async () => {
          const r = await shareOrCopyLink({
            title: tour ? `${tour.title} 같이 가요!` : "ALL BLUE 투어 같이 가요!",
            text: `${profile.name ?? "버디"}님이 다이빙 투어에 초대했어요 🤿`,
            url: buildBuddyInviteUrl(tourId, profile.id),
          });
          if (r === "copied") toast({ title: "초대 링크를 복사했어요", description: "카톡에 붙여넣어 버디에게 보내세요." });
          if (r === "failed") toast({ title: "링크를 만들지 못했어요", variant: "destructive" });
        }}
      >
        <UserPlus className="h-3.5 w-3.5" />
        초대
      </Button>
    </div>
  );
}

/** 초대 링크로 들어온 사람에게 보이는 배너. ?buddy= 값을 기억해 결제 화면으로 넘긴다. */
export function BuddyInvitedBanner({ tourId }: { tourId: string }) {
  const [params] = useSearchParams();
  const { publicProfiles } = useAppData();
  const { profile } = useRole();
  const fromUrl = params.get("buddy");
  const [inviterId, setInviterId] = useState<string | null>(() => fromUrl ?? getBuddyInvite(tourId));

  useEffect(() => {
    if (fromUrl && fromUrl !== profile?.id) {
      rememberBuddyInvite(tourId, fromUrl);
      setInviterId(fromUrl);
    }
  }, [fromUrl, tourId, profile?.id]);

  if (!inviterId || inviterId === profile?.id) return null;
  const name = publicProfiles.find((p) => p.id === inviterId)?.name;
  if (!name) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
      <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p className="break-keep text-foreground">
        <b>{name}</b>님이 이 투어에 같이 가자고 초대했어요. 예약하면 같은 방 배정을 함께 요청해 드려요.
      </p>
    </div>
  );
}

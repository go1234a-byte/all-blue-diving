import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { SubscribeSheet } from "@/components/alerts/SubscribeSheet";
import { AlertEmptyState, DiverNotificationList, SubscriptionList } from "@/components/alerts/AlertLists";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRole } from "@/contexts/RoleContext";
import { useTourAlertMutations, useDiverNotifications, useTourAlertSubscriptions } from "@/hooks/useTourAlerts";
import { useToast } from "@/hooks/use-toast";
import { MAX_TOUR_ALERT_SUBSCRIPTIONS, type DiverNotification, type TourAlertSubscription } from "@/types/alerts";

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.";
}

/** 다이버 알림 센터 — 받은 알림 목록과 새 투어 구독 조건 관리. 벨 "전체 보기"에서 열린다. */
const Notifications = () => {
  const navigate = useNavigate();
  const { role } = useRole();
  const isDiver = role === "public";
  const { toast } = useToast();
  const notifications = useDiverNotifications();
  const subscriptions = useTourAlertSubscriptions();
  const { toggleSubscription, removeSubscription } = useTourAlertMutations();
  const [sheetOpen, setSheetOpen] = useState(false);

  const subscriptionList = subscriptions.data ?? [];
  const notificationList = notifications.data ?? [];
  const isFull = subscriptionList.length >= MAX_TOUR_ALERT_SUBSCRIPTIONS;

  const handleOpen = (n: DiverNotification) => navigate(n.url);

  const handleToggle = async (sub: TourAlertSubscription, enabled: boolean) => {
    try {
      await toggleSubscription.mutateAsync({ id: sub.id, enabled });
    } catch (error) {
      toast({ title: "변경하지 못했어요", description: errorText(error), variant: "destructive" });
    }
  };

  const handleRemove = async (sub: TourAlertSubscription) => {
    try {
      await removeSubscription.mutateAsync(sub.id);
      toast({ title: "구독을 삭제했어요" });
    } catch (error) {
      toast({ title: "삭제하지 못했어요", description: errorText(error), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-full bg-gradient-surface pb-20 md:pb-12">
      <AppHeader title="알림" />
      <main className="mx-auto w-full max-w-md space-y-8 px-5 py-6 md:max-w-2xl md:px-6">
        <h1 className="text-[22px] font-bold text-foreground">알림</h1>

        {!isDiver ? (
          <AlertEmptyState
            message="다이버 계정에서만 알림을 받을 수 있어요."
            actionLabel="투어 둘러보기"
            onAction={() => navigate("/search")}
          />
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-[18px] font-bold text-foreground">받은 알림</h2>
              {notifications.isPending ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-16 w-full rounded-xl" />
                </div>
              ) : notificationList.length === 0 ? (
                <AlertEmptyState
                  message="아직 받은 알림이 없어요."
                  actionLabel="새 투어 알림 받기"
                  onAction={() => setSheetOpen(true)}
                />
              ) : (
                <DiverNotificationList items={notificationList} onOpen={handleOpen} />
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-[18px] font-bold text-foreground">새 투어 구독</h2>
                  <p className="text-[13px] text-muted-foreground">
                    조건에 맞는 투어가 열리면 알려드려요 ({subscriptionList.length}/{MAX_TOUR_ALERT_SUBSCRIPTIONS})
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-11 gap-1.5 rounded-xl px-4"
                  onClick={() => setSheetOpen(true)}
                  disabled={isFull}
                >
                  <Plus className="h-4 w-4" />
                  추가
                </Button>
              </div>

              {subscriptions.isPending ? (
                <Skeleton className="h-16 w-full rounded-xl" />
              ) : subscriptionList.length === 0 ? (
                <AlertEmptyState
                  message="구독한 조건이 없어요."
                  actionLabel="조건 추가하기"
                  onAction={() => setSheetOpen(true)}
                />
              ) : (
                <SubscriptionList
                  items={subscriptionList}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                  busy={toggleSubscription.isPending || removeSubscription.isPending}
                />
              )}
            </section>
          </>
        )}
      </main>

      <SubscribeSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      <BottomNav />
    </div>
  );
};

export default Notifications;

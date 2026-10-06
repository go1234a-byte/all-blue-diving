import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { SubscribeForm, type SubscribeFormProps } from "@/components/alerts/SubscribeForm";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTourAlertMutations, useTourAlertSubscriptions } from "@/hooks/useTourAlerts";

const SHEET_TITLE = "새 투어 알림 받기";
const SHEET_DESCRIPTION = "조건에 맞는 새 투어가 열리면 알려드려요. 최대 10개까지 저장할 수 있어요.";

/**
 * 시트 껍데기. 모바일은 바텀시트(Drawer), 데스크톱은 다이얼로그.
 * isMobile을 밖에서 받아서, 화면 미리보기에서도 두 모양을 모두 띄울 수 있다.
 */
export function SubscribeSheetShell({
  isMobile,
  open,
  onOpenChange,
  children,
}: {
  isMobile: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-[20px] font-bold">{SHEET_TITLE}</DrawerTitle>
            <DrawerDescription className="text-[13px]">{SHEET_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-5 pb-8">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold">{SHEET_TITLE}</DialogTitle>
          <DialogDescription className="text-[13px]">{SHEET_DESCRIPTION}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export type SubscribePrefill = Pick<SubscribeFormProps, "initialCountry" | "initialMonthKeys" | "initialActivityTypes">;

export interface SubscribeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: SubscribePrefill;
}

/** 데이터 연결: 구독 개수와 저장 뮤테이션을 붙인 시트. 닫으면 폼이 언마운트돼 다음에 열 때 prefill로 초기화된다. */
export function SubscribeSheet({ open, onOpenChange, prefill }: SubscribeSheetProps) {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { data: subscriptions = [] } = useTourAlertSubscriptions();
  const { createSubscription } = useTourAlertMutations();

  const handleSubmit: SubscribeFormProps["onSubmit"] = async (input) => {
    try {
      await createSubscription.mutateAsync({
        country: input.country,
        months: input.months,
        activityTypes: input.activityTypes,
      });
      toast({ title: "알림 구독을 저장했어요", description: `${input.country} 새 투어가 열리면 알려드릴게요.` });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "구독을 저장하지 못했어요",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <SubscribeSheetShell isMobile={isMobile} open={open} onOpenChange={onOpenChange}>
      <SubscribeForm
        initialCountry={prefill?.initialCountry}
        initialMonthKeys={prefill?.initialMonthKeys}
        initialActivityTypes={prefill?.initialActivityTypes}
        subscriptionCount={subscriptions.length}
        saving={createSubscription.isPending}
        onSubmit={handleSubmit}
      />
    </SubscribeSheetShell>
  );
}

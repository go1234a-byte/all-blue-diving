import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { MAX_ITEM_LABEL_LENGTH } from "@/lib/packingChecklist";

/** 본인만 보는 준비물 추가 시트. 모바일은 바텀시트, 데스크톱은 다이얼로그. */
export function AddOwnItemSheet({
  open,
  onOpenChange,
  onSubmit,
  saving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (label: string) => void;
  saving?: boolean;
}) {
  const isMobile = useIsMobile();
  const title = "내 준비물 추가";
  const description = "나만 보는 항목이에요. 강사님과 다른 다이버에게는 보이지 않아요.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[92vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-[20px] font-bold">{title}</DrawerTitle>
            <DrawerDescription className="text-[13px]">{description}</DrawerDescription>
          </DrawerHeader>
          <div className="px-5 pb-8">
            <OwnItemForm onSubmit={onSubmit} saving={saving} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-bold">{title}</DialogTitle>
          <DialogDescription className="text-[13px]">{description}</DialogDescription>
        </DialogHeader>
        <OwnItemForm onSubmit={onSubmit} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}

function OwnItemForm({ onSubmit, saving }: { onSubmit: (label: string) => void; saving: boolean }) {
  const [label, setLabel] = useState("");
  const trimmed = label.trim();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (trimmed) onSubmit(trimmed);
      }}
    >
      <Input
        value={label}
        maxLength={MAX_ITEM_LABEL_LENGTH}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="예: 텀블러"
        aria-label="준비물 이름"
        className="h-12 text-[16px]"
        autoFocus
      />
      <p className="text-[13px] text-muted-foreground">
        {label.length}/{MAX_ITEM_LABEL_LENGTH}자
      </p>
      <Button type="submit" className="h-12 w-full rounded-xl text-[15px] font-semibold" disabled={!trimmed || saving}>
        {saving ? "추가 중..." : "추가하기"}
      </Button>
    </form>
  );
}

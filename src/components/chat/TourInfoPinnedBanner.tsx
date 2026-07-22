import { useState } from "react";
import { Pin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InclusionsExclusionsCard } from "@/components/tour/InclusionsExclusionsCard";
import type { Tour } from "@/types";

interface TourInfoPinnedBannerProps {
  tour: Tour;
}

/**
 * 그룹채팅 상단 고정 배너. 클릭 시 해당 투어의 포함/불포함 사항과
 * 강사가 등록한 준비물 텍스트를 카드 형태로 즉시 확인할 수 있다.
 */
export function TourInfoPinnedBanner({ tour }: TourInfoPinnedBannerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-lg border border-primary/40 bg-secondary/60 px-3 py-2 text-left text-xs font-medium text-foreground"
      >
        <Pin className="h-3.5 w-3.5 shrink-0 text-primary" />
        포함/불포함 및 준비물 확인
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tour.title}</DialogTitle>
          </DialogHeader>
          <InclusionsExclusionsCard inclusions={tour.inclusions} exclusions={tour.exclusions} />
          {tour.prepNotes && (
            <div className="space-y-2 rounded-xl border border-primary/30 bg-secondary/40 p-4">
              <h3 className="text-sm font-semibold text-foreground">강사 추천 준비물</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{tour.prepNotes}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

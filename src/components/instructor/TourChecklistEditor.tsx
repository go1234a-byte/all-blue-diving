import { useState } from "react";
import { ChecklistDraftEditor } from "@/components/instructor/ChecklistDraftEditor";
import { useToast } from "@/hooks/use-toast";
import { useTourChecklistItems } from "@/hooks/useTripChecklist";
import type { ChecklistItem } from "@/lib/packingChecklist";

/** 강사 투어 수정 화면에 붙는 준비물 편집기 (데이터 연결). 저장하면 tours.checklist_items를 바꾼다. */
export function TourChecklistEditor({ tourId }: { tourId: string }) {
  const { toast } = useToast();
  const { items, save } = useTourChecklistItems(tourId);
  // 편집 중에만 draft를 쓰고, 저장하거나 못 바꾼 상태면 서버 값을 그대로 보여준다.
  const [draft, setDraft] = useState<ChecklistItem[] | null>(null);
  const shown = draft ?? items.data ?? [];

  const handleSave = async () => {
    const cleaned = shown.map((item) => ({ ...item, label: item.label.trim() }));
    if (cleaned.some((item) => item.label === "")) {
      toast({ title: "빈 항목이 있어요", description: "준비물 이름을 채우거나 항목을 지워주세요.", variant: "destructive" });
      return;
    }
    try {
      await save.mutateAsync(cleaned);
      setDraft(null);
      toast({ title: "체크리스트를 저장했어요" });
    } catch (error) {
      toast({
        title: "저장하지 못했어요",
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  return (
    <ChecklistDraftEditor
      items={shown}
      onChange={setDraft}
      onSave={handleSave}
      saving={save.isPending}
      dirty={draft !== null}
    />
  );
}

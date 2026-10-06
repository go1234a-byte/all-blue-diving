import { Link, useNavigate, useParams } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { AlertEmptyState } from "@/components/alerts/AlertLists";
import { AddOwnItemSheet } from "@/components/trip/AddOwnItemSheet";
import { ChecklistSummaryCards } from "@/components/trip/ChecklistSummaryCards";
import { ChecklistView, type ChecklistSectionView } from "@/components/trip/ChecklistView";
import { PrepNotesCard } from "@/components/trip/PrepNotesCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useToast } from "@/hooks/use-toast";
import { useTripChecklist } from "@/hooks/useTripChecklist";
import { useState } from "react";
import {
  buildOwnItem,
  buildPackingTemplate,
  daysUntil,
  EMPTY_CHECKLIST_STATE,
  GROUP_ORDER,
  MAX_OWN_ITEMS,
  mergeChecklist,
  rentalIncluded,
  suitHint,
  type ChecklistState,
} from "@/lib/packingChecklist";

const RENTAL_NOTE = "투어에 장비 대여가 포함돼요 (선택)";

/**
 * 출발 준비물 체크리스트. 이 투어의 확정 예약이 있는 다이버만 본다 (RequireRole + 예약 확인).
 * 기본 템플릿 + 강사 항목 + 본인 항목을 합치고, 체크·숨김·추가는 본인 행에만 저장한다.
 */
const TripChecklist = () => {
  const { tourId = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentDiverId } = useRole();
  const { getTourById, getInstructorById, bookings } = useAppData();
  const [addOpen, setAddOpen] = useState(false);

  const tour = getTourById(tourId);
  const booking = bookings.find(
    (b) => b.tourId === tourId && b.diverId === currentDiverId && b.status === "confirmed",
  );
  const { items, state: stateQuery, save } = useTripChecklist(tourId, currentDiverId, !!booking);

  if (!booking) {
    return (
      <div className="min-h-full bg-gradient-surface pb-20 md:pb-12">
        <AppHeader title="준비물" />
        <main className="mx-auto w-full max-w-md space-y-6 px-5 py-6 md:max-w-2xl">
          <AlertEmptyState
            message="이 투어의 확정 예약이 있는 다이버만 준비물을 볼 수 있어요."
            actionLabel="내 예약 보기"
            onAction={() => navigate("/my-bookings")}
          />
        </main>
        <BottomNav />
      </div>
    );
  }

  const loading = items.isPending || stateQuery.isPending;
  const instructorItems = items.data ?? [];
  const state = stateQuery.data ?? EMPTY_CHECKLIST_STATE;
  const template = tour ? buildPackingTemplate(tour.activityTypes) : [];
  const merged = mergeChecklist(template, instructorItems, state);

  // 저장: 상태 전체 + 보이는 항목 기준 집계. 리마인드 대상 판단이 이 집계를 쓴다.
  const persist = async (next: ChecklistState, failTitle: string) => {
    const counts = mergeChecklist(template, instructorItems, next).progress;
    try {
      await save.mutateAsync({ next, totalCount: counts.total, checkedCount: counts.done });
    } catch (error) {
      toast({
        title: failTitle,
        description: error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleToggle = (key: string, next: boolean) => {
    const checkedKeys = next
      ? [...state.checkedKeys.filter((k) => k !== key), key]
      : state.checkedKeys.filter((k) => k !== key);
    void persist({ ...state, checkedKeys }, "체크를 저장하지 못했어요");
  };

  const handleHide = (key: string) =>
    void persist({ ...state, hiddenKeys: [...state.hiddenKeys.filter((k) => k !== key), key] }, "숨기지 못했어요");

  const handleRestore = (key: string) =>
    void persist({ ...state, hiddenKeys: state.hiddenKeys.filter((k) => k !== key) }, "복구하지 못했어요");

  const handleAddOwn = async (label: string) => {
    const item = buildOwnItem(label);
    if (!item) return;
    if (state.customItems.length >= MAX_OWN_ITEMS) {
      toast({ title: `내 준비물은 ${MAX_OWN_ITEMS}개까지 추가할 수 있어요` });
      return;
    }
    await persist({ ...state, customItems: [...state.customItems, item] }, "추가하지 못했어요");
    setAddOpen(false);
  };

  // 카테고리별 섹션. 강사 항목은 맨 위, 본인 항목은 맨 아래.
  const gearNote = [
    tour ? suitHint(tour.waterTempC) : null,
    tour && rentalIncluded(tour.inclusions) ? RENTAL_NOTE : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const sections: ChecklistSectionView[] = GROUP_ORDER.map((group) => ({
    group,
    items: merged.items.filter((i) => i.group === group),
    note: group === "gear" && gearNote ? gearNote : undefined,
  })).filter((s) => s.items.length > 0);

  const instructor = tour ? getInstructorById(tour.instructorId) : undefined;

  return (
    <div className="min-h-full bg-gradient-surface pb-20 md:pb-12">
      <AppHeader title="준비물" />
      <main className="mx-auto w-full max-w-md space-y-8 px-5 py-6 md:max-w-2xl md:px-6">
        <div className="space-y-1">
          <h1 className="text-[22px] font-bold text-foreground">출발 준비물</h1>
          {tour && (
            <Link to={`/tour/${tour.id}`} className="text-[13px] text-muted-foreground hover:underline">
              {tour.title}
            </Link>
          )}
        </div>

        {tour?.cancelledAt ? (
          <AlertEmptyState
            message="취소된 투어예요. 준비물은 더 확인하지 않아도 돼요."
            actionLabel="내 예약 보기"
            onAction={() => navigate("/my-bookings")}
          />
        ) : loading || !tour ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <ChecklistSummaryCards dDay={daysUntil(tour.startDate)} progress={merged.progress} />
            {tour.prepNotes && tour.prepNotes.trim() && <PrepNotesCard text={tour.prepNotes.trim()} />}
            <ChecklistView
              sections={sections}
              progress={merged.progress}
              hiddenItems={merged.hiddenItems}
              instructor={instructor ? { name: instructor.name, avatarUrl: instructor.avatarUrl } : undefined}
              onToggle={handleToggle}
              onHide={handleHide}
              onRestore={handleRestore}
              onAddOwn={() => setAddOpen(true)}
              busy={save.isPending}
            />
          </>
        )}
      </main>
      <AddOwnItemSheet open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAddOwn} saving={save.isPending} />
      <BottomNav />
    </div>
  );
};

export default TripChecklist;

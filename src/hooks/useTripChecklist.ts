import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChecklistState,
  fetchTourChecklistItems,
  saveChecklistState,
  saveTourChecklistItems,
} from "@/lib/checklistApi";
import type { ChecklistItem, ChecklistState } from "@/lib/packingChecklist";

export const tripChecklistKeys = {
  items: (tourId: string) => ["tour-checklist-items", tourId] as const,
  state: (diverId: string, tourId: string) => ["tour-checklist-state", diverId, tourId] as const,
};

/** 강사 목록 + 본인 상태. 예약이 확인된 다이버만 켠다(enabled). */
export function useTripChecklist(tourId: string, diverId: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const items = useQuery({
    queryKey: tripChecklistKeys.items(tourId),
    queryFn: () => fetchTourChecklistItems(tourId),
    enabled: enabled && !!tourId,
  });
  const state = useQuery({
    queryKey: tripChecklistKeys.state(diverId, tourId),
    queryFn: () => fetchChecklistState(diverId, tourId),
    enabled: enabled && !!tourId && !!diverId,
  });

  const save = useMutation({
    mutationFn: ({
      next,
      totalCount,
      checkedCount,
    }: {
      next: ChecklistState;
      totalCount: number;
      checkedCount: number;
    }) => saveChecklistState(diverId, tourId, next, { totalCount, checkedCount }),
    // 낙관적 갱신: 누른 즉시 반영하고, 저장이 실패하면 이전 상태로 되돌린다.
    onMutate: async ({ next }) => {
      const queryKey = tripChecklistKeys.state(diverId, tourId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ChecklistState>(queryKey);
      queryClient.setQueryData<ChecklistState>(queryKey, next);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(tripChecklistKeys.state(diverId, tourId), context.previous);
    },
  });

  return { items, state, save };
}

/** 강사 편집기: 목록 조회와 저장. 저장 뒤 목록 쿼리를 다시 가져온다. */
export function useTourChecklistItems(tourId: string) {
  const queryClient = useQueryClient();
  const items = useQuery({
    queryKey: tripChecklistKeys.items(tourId),
    queryFn: () => fetchTourChecklistItems(tourId),
    enabled: !!tourId,
  });
  const save = useMutation({
    mutationFn: (next: ChecklistItem[]) => saveTourChecklistItems(tourId, next),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tripChecklistKeys.items(tourId) }),
  });
  return { items, save };
}

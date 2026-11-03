import { useAppData } from "@/contexts/AppDataContext";
import { useRole } from "@/contexts/RoleContext";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { handleImageFallback } from "@/lib/image";

/** 상세 상단의 사진 후기 줄 — 후기 사진이 있을 때만 보인다. ReviewList 와 같은 공개 규칙(강사·관리자 전용 후기·차단 작성자 제외)을 따르고, 누르면 후기 섹션으로 이동한다. */
export function ReviewPhotoStrip({ tourId, instructorId }: { tourId: string; instructorId: string }) {
  const { getReviewsByTourId } = useAppData();
  const { role, currentInstructorId } = useRole();
  const { blockedIds } = useBlockedUsers();
  const privileged = role === "admin" || (role === "instructor" && !!currentInstructorId && currentInstructorId === instructorId);
  const reviews = getReviewsByTourId(tourId).filter((r) => (r.visibility !== "instructor_only" || privileged) && !blockedIds.has(r.diverId));
  const photos = reviews.flatMap((r) => r.photos).filter(Boolean);
  if (photos.length === 0) return null;
  const photoReviews = reviews.filter((r) => r.photos.length > 0).length;
  return (
    <section aria-label="사진 후기" className="space-y-2">
      <button
        type="button"
        onClick={() => document.getElementById("tab-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" })}
        className="flex w-full items-center justify-between text-left"
      >
        <h3 className="text-sm font-semibold text-foreground">
          후기 사진 <span className="font-normal text-muted-foreground">· 사진 후기 {photoReviews}개</span>
        </h3>
        <span className="text-xs text-primary">전체 후기 ›</span>
      </button>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
        {photos.slice(0, 10).map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt="" loading="lazy" onError={handleImageFallback} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
        ))}
      </div>
    </section>
  );
}

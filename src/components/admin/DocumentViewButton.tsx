import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getInstructorDocumentSignedUrl } from "@/lib/uploadImage";

/**
 * 강사 제출 서류 1건을 "보기" 버튼으로 노출한다. 파일은 비공개 버킷(instructor-documents)에
 * 있어서 미리 URL을 만들어둘 수 없고, 누른 시점에 서명된 임시 URL을 발급받아 새 탭으로 연다
 * (본인 또는 관리자만 발급 성공 — storage RLS가 서명 URL 발급 자체를 막는다).
 * 관리자 강사 승인 큐(InstructorApplicationQueue)와 강사 상세 프로필(InstructorPublicProfile)
 * 양쪽에서 공용으로 사용한다.
 */
export function DocumentViewButton({ path, label }: { path?: string | null; label: string }) {
  const [loading, setLoading] = useState(false);

  if (!path) {
    return (
      <span className="rounded-md border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground">
        {label} 미제출
      </span>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    const url = await getInstructorDocumentSignedUrl(path);
    setLoading(false);
    if (!url) {
      alert(`${label} 파일을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 gap-1 text-[11px]"
      onClick={handleClick}
      disabled={loading}
    >
      <FileText className="h-3 w-3" />
      {loading ? "불러오는 중..." : `${label} 보기`}
    </Button>
  );
}

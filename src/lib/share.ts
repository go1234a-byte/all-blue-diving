interface ShareData {
  title: string;
  text?: string;
  url: string;
}

/**
 * 네이티브 공유 시트(navigator.share)가 있으면 그걸 띄운다 — 모바일에서는 카카오톡,
 * 인스타그램(다이렉트 메시지/스토리), 문자 등 기기에 설치된 앱이 자동으로 목록에 뜬다.
 * 카카오/인스타그램 전용 버튼은 만들지 않는다 — 카카오는 도메인 등록된 JS 키가 있어야
 * 하고(현재 프로젝트에 없음), 인스타그램은 웹에서 피드/스토리로 직접 공유하는 공개 API가
 * 애초에 없다. 미지원 환경(대부분 데스크톱)에서는 링크를 클립보드에 복사하는 것으로 대체한다.
 */
export async function shareOrCopyLink(data: ShareData): Promise<"shared" | "copied" | "failed"> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(data);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "shared";
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}

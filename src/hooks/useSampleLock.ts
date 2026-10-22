import { useRole } from "@/contexts/RoleContext";
import { isSampleContent } from "@/lib/sampleContent";

/** 앱 심사용 데모 계정. 심사관이 예약 흐름을 끝까지 볼 수 있게 이 계정만 예시 투어 예약을 허용한다(100% 쿠폰, 실결제 없음). DB 트리거도 같은 계정을 예외로 둔다. */
const APP_REVIEW_EMAIL = "go1234a+applereview@gmail.com";

/** 이 사용자에게 예시 투어로 잠가야 하는지 판정하는 함수를 돌려준다. */
export function useSampleLock(): (title: string | undefined | null) => boolean {
  const { user } = useRole();
  const isReviewer = user?.email?.toLowerCase() === APP_REVIEW_EMAIL;
  return (title) => !isReviewer && isSampleContent(title);
}

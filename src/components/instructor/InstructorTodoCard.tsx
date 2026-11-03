import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useAppData } from "@/contexts/AppDataContext";
import { UnderMinDecisionPanel } from "@/components/instructor/UnderMinDecisionPanel";

interface Props {
  instructorId: string;
  /** 관리자 승인(인증배지)을 받은 강사인지. */
  verified: boolean;
  /** 사업자등록증을 제출했는지. */
  hasLicense: boolean;
}

/** 강사 콘솔 맨 위 "해야 할 일" — 흩어져 있던 안내(최소 인원 결정·사업자등록증·승인 대기)를 급한 순서로 한 카드에 모은다. 할 일이 없으면 보이지 않는다. */
export function InstructorTodoCard({ instructorId, verified, hasLicense }: Props) {
  const { tours } = useAppData();
  const pendingCount = tours.filter((t) => t.instructorId === instructorId && t.underMinDecisionPending).length;
  const needLicense = verified && !hasLicense;
  const total = pendingCount + (needLicense ? 1 : 0) + (!verified ? 1 : 0);
  if (total === 0) return null;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <h2 className="text-[15px] font-bold text-foreground">해야 할 일</h2>
        <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">{total}</span>
      </div>
      {pendingCount > 0 && <UnderMinDecisionPanel instructorId={instructorId} embedded />}
      {!verified && (
        <div className="space-y-1 border-t border-border px-4 py-3">
          <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-extrabold text-amber-800">승인 대기</span>
          <p className="break-keep text-[13px] leading-relaxed text-foreground">
            관리자 승인(인증배지) 대기 중이에요. 승인 전에는 투어를 실제로 등록할 수 없어요 — 내용은 미리 준비해두시고, 승인되면 바로 등록해주세요.
          </p>
        </div>
      )}
      {needLicense && (
        <div className="space-y-2 border-t border-border px-4 py-3">
          <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-extrabold text-amber-800">제출 필요</span>
          <p className="break-keep text-[13px] leading-relaxed text-foreground">
            <b>사업자등록증</b>이 제출되지 않아 신규 투어 등록이 막혀 있어요. 이미 열린 투어의 예약·정산·채팅은 그대로 이용할 수 있어요.
          </p>
          <Link
            to="/mypage?biz=1"
            className="block rounded-lg bg-cta py-2.5 text-center text-sm font-bold text-cta-foreground"
          >
            제출하러 가기
          </Link>
        </div>
      )}
    </Card>
  );
}

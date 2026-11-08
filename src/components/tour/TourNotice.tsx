import type { Tour } from "@/types";

const STEPS = [
  ["예약", "결제를 마치면 예약이 접수돼요."],
  ["출발 확정", "최소 인원이 모이면 출발이 확정돼요. 모이지 않으면 규정에 따라 환불돼요."],
  ["단체 채팅방", "확정되면 강사와 참가자가 함께하는 채팅방이 열려요."],
  ["집합", "강사가 채팅방에 집합 장소와 시간을 다시 안내해요."],
] as const;

/** 예약 전에 알아 둘 것. 위쪽은 모든 투어 공통 안내, 아래쪽 3개는 강사가 적은 경우에만 보인다(비어 있으면 숨김). */
export function TourNotice({ tour }: { tour: Pick<Tour, "meetingTime" | "divePlan" | "pickupInfo" | "onsiteCostNotes" | "minParticipants"> }) {
  const mine = [
    ["다이빙 횟수·포인트", tour.divePlan],
    ["픽업·이동", tour.pickupInfo],
    ["현장 지불·팁", tour.onsiteCostNotes],
  ].filter((x): x is [string, string] => Boolean(x[1] && x[1].trim()));
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">예약 전 안내</h3>

      {mine.length > 0 && (
        <dl className="space-y-2.5">
          {mine.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[12px] font-semibold text-muted-foreground">{k}</dt>
              <dd className="whitespace-pre-line text-sm text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">예약 후 이렇게 진행돼요</p>
        <ol className="space-y-1.5">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-2.5 text-sm">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-foreground">{i + 1}</span>
              <span><b className="font-semibold text-foreground">{t}</b> <span className="text-muted-foreground">{d}</span></span>
            </li>
          ))}
        </ol>
        {tour.meetingTime?.trim() && <p className="mt-2 text-sm text-muted-foreground">집합 시간({tour.meetingTime.trim()})보다 30분 일찍 도착해 주세요.</p>}
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-semibold text-muted-foreground">건강·참가 안내</p>
        <ul className="list-disc space-y-1 pl-4 text-sm text-muted-foreground">
          <li>심장·호흡기 질환, 척추 질환, 임신, 최근 수술, 심한 감기나 귀 압력 조절이 어려운 경우는 예약 전에 의사와 강사에게 꼭 상담해 주세요.</li>
          <li>최소 연령과 필요 자격은 투어와 강사 기준을 따르며, 최종 참가 여부는 강사가 판단해요.</li>
          <li>다이빙 후 비행기를 타려면 보통 12시간(여러 번 다이빙했다면 18시간) 이상 쉬어야 해요.</li>
        </ul>
        <p className="mt-1.5 text-[12px] text-muted-foreground">일반적인 안내이며 개인의 건강 상태에 대한 의학적 판단이 아니에요.</p>
      </div>
    </div>
  );
}

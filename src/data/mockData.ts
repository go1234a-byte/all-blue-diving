import type { DiveCenter, Profile } from "@/types";

// ── ALL BLUE 목업 데이터 정리 완료 ──
// 투어/예약/리뷰/신고/정산/문의/채팅/강사·다이버 프로필 등 도메인 데이터는
// 전부 Enter Cloud(Supabase) 테이블(tours/bookings/reviews/reports/payouts/inquiries/
// chat_messages/profiles/instructors)에서 직접 조회·기록한다 (src/contexts/AppDataContext.tsx 참고).
//
// 아래 두 항목만 예외적으로 남아있다:
// - MOCK_ADMIN_PROFILE: 관리자 화면 상단에 표시되는 고정 프로필(단일 관리자 계정 데모용, 실제 인증은 profiles.role='admin'을 사용).
// - MOCK_DIVE_CENTERS: 레거시 "예약된 센터 소개" 카드용 정적 데이터(신규 Center 엔티티는 centers 테이블로 완전히 대체됨).

export const MOCK_ADMIN_PROFILE: Profile = {
  id: "admin-1",
  role: "admin",
  name: "관리자",
  phone: "010-0000-0000",
  gender: "male",
  status: "active",
  createdAt: "2023-01-01",
};

export const MOCK_DIVE_CENTERS: DiveCenter[] = [
  {
    instructorId: "inst-1",
    name: "모알보알 블루 다이브 센터",
    address: "필리핀 세부 모알보알 파나그사마 비치로 12",
    operatingHours: "매일 07:00 - 19:00",
    photos: [
      "https://cdn.enter.pro/resources/uid_100187712/gallery_boat_setup_0117a349.png",
      "https://cdn.enter.pro/resources/uid_100187712/gallery_group_divers_9f03a7bd.png",
      "https://cdn.enter.pro/resources/uid_100187712/gallery_coral_macro_ddd7bad3.png",
    ],
  },
  {
    instructorId: "inst-2",
    name: "제주 프리다이브 아카데미",
    address: "제주특별자치도 서귀포시 성산읍 섭지코지로 25",
    operatingHours: "매일 08:00 - 18:00",
    photos: [
      "https://cdn.enter.pro/resources/uid_100187712/gallery_group_divers_9f03a7bd.png",
      "https://cdn.enter.pro/resources/uid_100187712/gallery_sunset_return_bbd94b9e.png",
      "https://cdn.enter.pro/resources/uid_100187712/gallery_boat_setup_0117a349.png",
    ],
  },
  {
    instructorId: "inst-3",
    name: "코로르 딥블루 테크니컬 센터",
    address: "팔라우 코로르 말라칼 하버로드 8",
    operatingHours: "매일 06:30 - 20:00",
    photos: [
      "https://cdn.enter.pro/resources/uid_100187712/gallery_coral_macro_ddd7bad3.png",
      "https://cdn.enter.pro/resources/uid_100187712/gallery_boat_setup_0117a349.png",
      "https://cdn.enter.pro/resources/uid_100187712/gallery_sunset_return_bbd94b9e.png",
    ],
  },
];

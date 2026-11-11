/**
 * 홈 첫 화면 광고 슬롯. 광고주가 아직 없어서 지금 들어 있는 것은 "광고 게재를 모집하는" 자체 광고(house ad)다.
 * 가격·할인·효과 같은 사실 주장은 넣지 않는다. 실제 광고가 정해지면 이 배열만 바꾸면 된다(`sample: true` 는 "예시" 표기).
 */
export interface HomeAd {
  id: string;
  photo: string;
  /** 사진 초점(object-position). 폰/데스크톱 첫 화면에서 잘리는 방향을 고른다. */
  position: string;
  category: string;
  headline: string;
  sub: string;
  cta: string;
  href: string;
  sample?: boolean;
}

export const HOME_ADS: HomeAd[] = [
  {
    id: "center",
    photo: "/landing/descend.webp",
    position: "35% 40%",
    category: "다이빙 센터",
    headline: "우리 센터를 가장 먼저 보여드려요",
    sub: "다이빙을 찾는 사람이 모이는 첫 화면에 센터를 소개하세요.",
    cta: "광고 문의하기",
    href: "/business-inquiry",
    sample: true,
  },
  {
    id: "liveaboard",
    photo: "/landing/whale.webp",
    position: "50% 45%",
    category: "리브어보드·리조트",
    headline: "만타와 고래상어를 찾는 다이버에게",
    sub: "리브어보드와 리조트 상품을 홈 화면에서 소개할 수 있어요.",
    cta: "광고 문의하기",
    href: "/business-inquiry",
    sample: true,
  },
  {
    id: "gear",
    photo: "/landing/turtle.webp",
    position: "50% 50%",
    category: "장비·브랜드",
    headline: "다이버가 직접 써 보는 장비",
    sub: "장비·액세서리 브랜드의 새 소식을 알릴 수 있어요.",
    cta: "광고 문의하기",
    href: "/business-inquiry",
    sample: true,
  },
  {
    id: "travel",
    photo: "/landing/boat.webp",
    position: "50% 55%",
    category: "여행·보험",
    headline: "출발 전에 챙기는 여행자 서비스",
    sub: "여행자 보험·항공·숙박 같은 다이버 여행 서비스를 소개해 보세요.",
    cta: "광고 문의하기",
    href: "/business-inquiry",
    sample: true,
  },
];

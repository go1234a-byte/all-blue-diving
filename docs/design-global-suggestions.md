# 디자인 전역 개선 제안

4-1 알림 화면 작업 중 발견했지만, 공용 컴포넌트라 이번 작업 범위 밖으로 남긴 항목입니다.
새 화면에서는 가이드 크기로 덮어써 두었고, 아래는 공용 컴포넌트 자체를 고치는 제안입니다.

1. **공용 Dialog 닫기 버튼 (`src/components/ui/dialog.tsx`)**
   닫기 X 아이콘이 16×16px이라 터치 영역이 가이드(44px)보다 작습니다.
   제안: 버튼에 44px 히트 영역을 주거나 아이콘을 키웁니다.

2. **공용 Button·Label·DialogDescription 기본 글자 크기**
   기본 클래스가 `text-sm`(14px)이라 가이드의 15–16px / 13px 체계와 맞지 않습니다.
   제안: 기본값을 가이드 크기로 맞추거나, 용도별 variant를 둡니다.

3. **공용 Switch (`src/components/ui/switch.tsx`)**
   보이는 크기는 24px이라 터치 영역이 작습니다. 지금은 화면마다 `::before`로 히트 영역을 넓혔습니다.
   제안: 공용 Switch에 44px 히트 영역을 기본으로 넣습니다.

4. **PushNotificationToggle 카드형과 MonthMultiSelect 내부 글자**
   카드형 토글은 12px / 14px 글자를 쓰고, MonthMultiSelect 내부 버튼은 14px입니다.
   제안: 가이드 크기(13 / 15 / 16px)로 맞춥니다. 행(row) 변형은 이미 맞춰 두었습니다.

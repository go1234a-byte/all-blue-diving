interface SleepingSpermWhaleProps {
  className?: string;
}

/**
 * 향유고래가 수중에서 세로로(머리를 위로, 꼬리를 아래로) 정지한 채 떠서 자는 실루엣.
 * 실제로 향유고래는 수면 근처에서 몸을 세운 채 몇 분씩 움직이지 않고 잠을 잔다고
 * 알려져 있다 — 스플래시 배경의 "깊은 바다" 연출로 사용, 로고/문구를 가리지 않도록
 * 낮은 불투명도의 실루엣으로만 표현한다.
 */
export function SleepingSpermWhale({ className }: SleepingSpermWhaleProps) {
  return (
    <svg
      viewBox="0 0 300 720"
      fill="none"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* 몸통 실루엣: 뭉툭한 사각형에 가까운 큰 머리 → 완만하게 가늘어지는 몸통 → 아래쪽 꼬리지느러미 */}
      <path
        d="
          M 108 18
          C 96 18 88 30 86 48
          L 84 130
          C 78 140 74 150 74 160
          C 74 172 82 180 92 182
          C 88 200 86 220 86 240
          L 90 420
          C 88 450 86 480 82 500
          C 100 505 125 500 150 500
          C 142 535.2 118 554.4 92.4 570.4
          C 70 583.2 60.4 605.6 73.2 628
          C 98.8 621.6 121.2 599.2 137.2 570.4
          C 142 560.8 146.8 551.2 150 541.6
          C 153.2 551.2 158 560.8 162.8 570.4
          C 178.8 599.2 201.2 621.6 226.8 628
          C 239.6 605.6 230 583.2 207.6 570.4
          C 182 554.4 158 535.2 150 500
          C 175 500 200 505 218 500
          C 214 480 212 450 210 420
          L 214 240
          C 214 220 212 200 208 182
          C 218 180 226 172 226 160
          C 226 150 222 140 216 130
          L 214 48
          C 212 30 204 18 192 18
          C 186 12 178 8 168 8
          L 132 8
          C 122 8 114 12 108 18
          Z
        "
        fill="currentColor"
      />
      {/* 왼쪽 가슴지느러미 */}
      <path
        d="M 78 165 C 58 172 42 186 34 206 C 50 202 66 194 80 184 Z"
        fill="currentColor"
      />
      {/* 등 쪽 마디(향유고래는 등지느러미 대신 낮은 돌기가 이어진다) */}
      <ellipse cx="219" cy="230" rx="7" ry="5" fill="currentColor" />
      <ellipse cx="221" cy="255" rx="6" ry="4.5" fill="currentColor" />
      <ellipse cx="221" cy="278" rx="5.5" ry="4" fill="currentColor" />
      {/* 눈 */}
      <circle cx="100" cy="70" r="3" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

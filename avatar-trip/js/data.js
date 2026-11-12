/* 기본 제공 여행 일정 (좌표는 실제 장소 기준, 대기 시간은 평소 줄 길이 기준 예상치) */
window.PRESETS = {
  osaka: {
    label: '오사카·교토 3박 4일',
    city: '오사카',
    country: '일본',
    lat: 34.6687,
    lng: 135.5013,
    timezone: 'Asia/Tokyo',
    nights: 3,
    airport: { name: '간사이 국제공항', lat: 34.4320, lng: 135.2304 },
    hotel: { name: '난바역 근처 숙소', lat: 34.6655, lng: 135.5013 },
    days: [
      [
        { name: '551 호라이 난바 본점', type: 'food', lat: 34.6658, lng: 135.5016, stay: 30, wait: 20, note: '돼지고기 찐빵' },
        { name: '도톤보리 글리코 사인', type: 'sight', lat: 34.6690, lng: 135.5014, stay: 40, wait: 0 },
        { name: '신사이바시스지 상점가', type: 'shop', lat: 34.6735, lng: 135.5013, stay: 70, wait: 0 },
        { name: '홋쿄쿠세이 오므라이스', type: 'food', lat: 34.6716, lng: 135.4990, stay: 50, wait: 25, at: '17:30' }
      ],
      [
        { name: '후시미 이나리 타이샤', type: 'sight', lat: 34.9671, lng: 135.7727, stay: 100, wait: 0 },
        { name: '니시키 시장', type: 'food', lat: 35.0050, lng: 135.7649, stay: 60, wait: 0 },
        { name: '기요미즈데라', type: 'sight', lat: 34.9949, lng: 135.7850, stay: 80, wait: 0 },
        { name: '기온 거리 산책', type: 'sight', lat: 35.0037, lng: 135.7750, stay: 50, wait: 0 },
        { name: '% 아라비카 커피 히가시야마', type: 'cafe', lat: 34.9985, lng: 135.7804, stay: 30, wait: 15 }
      ],
      [
        { name: '오사카 성', type: 'sight', lat: 34.6873, lng: 135.5262, stay: 90, wait: 0 },
        { name: '쿠로몬 시장', type: 'food', lat: 34.6654, lng: 135.5065, stay: 50, wait: 0 },
        { name: '츠텐카쿠', type: 'sight', lat: 34.6525, lng: 135.5063, stay: 40, wait: 10 },
        { name: '쿠시카츠 다루마 신세카이', type: 'food', lat: 34.6515, lng: 135.5059, stay: 50, wait: 40 },
        { name: '우메다 스카이빌딩 공중정원', type: 'sight', lat: 34.7053, lng: 135.4896, stay: 60, wait: 15, at: '17:30' }
      ],
      [
        { name: '이치란 라멘 도톤보리', type: 'food', lat: 34.6687, lng: 135.5031, stay: 40, wait: 30 },
        { name: '돈키호테 도톤보리', type: 'shop', lat: 34.6688, lng: 135.5027, stay: 50, wait: 0 }
      ]
    ]
  },
  tokyo: {
    label: '도쿄 2박 3일',
    city: '도쿄',
    country: '일본',
    lat: 35.6812,
    lng: 139.7671,
    timezone: 'Asia/Tokyo',
    nights: 2,
    airport: { name: '하네다 공항', lat: 35.5494, lng: 139.7798 },
    hotel: { name: '신주쿠역 근처 숙소', lat: 35.6905, lng: 139.7005 },
    days: [
      [
        { name: '츠키지 장외시장', type: 'food', lat: 35.6655, lng: 139.7707, stay: 60, wait: 10 },
        { name: '긴자 거리', type: 'shop', lat: 35.6717, lng: 139.7650, stay: 60, wait: 0 },
        { name: '도쿄 타워', type: 'sight', lat: 35.6586, lng: 139.7454, stay: 50, wait: 15 },
        { name: '후운지 츠케멘 신주쿠', type: 'food', lat: 35.6862, lng: 139.6966, stay: 40, wait: 40, at: '17:00' }
      ],
      [
        { name: '메이지 신궁', type: 'sight', lat: 35.6764, lng: 139.6993, stay: 60, wait: 0 },
        { name: '하라주쿠 다케시타 거리', type: 'shop', lat: 35.6717, lng: 139.7036, stay: 60, wait: 0 },
        { name: '시부야 스크램블 교차로', type: 'sight', lat: 35.6595, lng: 139.7005, stay: 30, wait: 0 },
        { name: '아사쿠사 센소지', type: 'sight', lat: 35.7148, lng: 139.7967, stay: 70, wait: 0 },
        { name: '도쿄 스카이트리', type: 'sight', lat: 35.7101, lng: 139.8107, stay: 70, wait: 25 },
        { name: '오모이데 요코초', type: 'food', lat: 35.6930, lng: 139.6995, stay: 70, wait: 10, at: '18:00' }
      ],
      [
        { name: '팀랩 플래닛 도쿄', type: 'sight', lat: 35.6491, lng: 139.7898, stay: 120, wait: 20 },
        { name: '도요스 센캬쿠반라이', type: 'food', lat: 35.6456, lng: 139.7845, stay: 50, wait: 15 }
      ]
    ]
  }
};

window.STOP_TYPES = {
  food: { label: '맛집', icon: '🍜' },
  cafe: { label: '카페', icon: '☕' },
  sight: { label: '구경', icon: '📷' },
  shop: { label: '쇼핑', icon: '🛍️' }
};

window.AVATAR_COLORS = ['#e0533d', '#0f8f86', '#3b6fd8', '#e3a72f', '#8a56c9', '#2f3d55'];

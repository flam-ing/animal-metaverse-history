// ANIMALVERSE 공용 NPC / 월드 데이터
// NPC는 플레이어 선택 불가 종으로 구성. 각 버전이 스타일에 맞게 그린다.
// zone: 아래 AV_ZONES 의 id 를 참조. dialogue: 상호작용(E키) 시 순서대로/랜덤으로 출력.

window.AV_ZONES = [
  { id: 'plaza',     ko: '중앙 광장',   hint: '분수와 게시판이 있는 마을의 중심' },
  { id: 'park',      ko: '벚꽃 공원',   hint: '벚나무와 벤치, 산책로' },
  { id: 'lake',      ko: '반짝 호수',   hint: '낚시터와 오리배가 있는 호숫가' },
  { id: 'cafe',      ko: '카페 거리',   hint: '알록달록한 가게가 늘어선 거리' },
  { id: 'hotspring', ko: '온천 마을',   hint: '김이 모락모락 나는 노천탕' },
];

window.AV_NPCS = [
  {
    id: 'capybara', ko: '카피바라', name: '뜨뜻', role: '온천 지킴이', zone: 'hotspring', emoji: '🛁',
    palette: { primary: '#B08A5C', secondary: '#E3C79C', accent: '#8A6A42', dark: '#3C2E1C' },
    build: { kind: 'mammal', body: 'chunky-rect', calm: true },
    dialogue: [
      '어서 오세요… 물이 아주 좋습니다…',
      '온천은 서두르면 안 돼요. 인생도 그렇고요.',
      '귤 올려드릴까요? 머리 위에.',
    ],
  },
  {
    id: 'pigeon', ko: '비둘기', name: '구구', role: '우체부', zone: 'plaza', emoji: '📮',
    palette: { primary: '#9FA8B8', secondary: '#D7DCE4', accent: '#6E7A8E', dark: '#33383F' },
    build: { kind: 'bird', wings: true, walk: 'bob' },
    dialogue: [
      '구구! 편지 왔습니다! …아, 아직 주소가 없으시군요.',
      '광장 게시판에 새 소식 붙여놨어요. 구구.',
      '하늘에서 보면 이 마을, 꽤 귀엽습니다.',
    ],
  },
  {
    id: 'alpaca', ko: '알파카', name: '보송', role: '카페 사장', zone: 'cafe', emoji: '☕',
    palette: { primary: '#F0E4D3', secondary: '#FFFDF8', accent: '#C9A87C', dark: '#4A3B2A' },
    build: { kind: 'mammal', neck: 'long', fluffy: true },
    dialogue: [
      '어서 오세요~ 오늘의 추천은 당근 라떼예요.',
      '털이 복슬복슬한 날엔 장사가 잘 돼요.',
      '단골이 되시면 도토리 쿠키를 서비스로 드려요.',
    ],
  },
  {
    id: 'raccoon', ko: '라쿤', name: '너굴', role: '잡화점 주인', zone: 'cafe', emoji: '🛒',
    palette: { primary: '#7E8490', secondary: '#D5D9DF', accent: '#3E434C', dark: '#2A2D33' },
    build: { kind: 'mammal', eyePatch: true, tail: 'ringed' },
    dialogue: [
      '어서 오게나! 반짝이는 물건, 다 있다네.',
      '이 조약돌… 특별해 보이지 않나? 특별하다네.',
      '외상은 사절이야. 도토리도 화폐로 받네.',
    ],
  },
  {
    id: 'goat', ko: '염소', name: '메에', role: '정원사', zone: 'park', emoji: '🌱',
    palette: { primary: '#E9E2D5', secondary: '#FFFFFF', accent: '#B9A98E', dark: '#3F382C' },
    build: { kind: 'mammal', horns: true, beard: true },
    dialogue: [
      '메에~ 꽃밭은 밟지 말아 주세요.',
      '벚꽃이 지면 튤립이 핍니다. 정원은 계획이죠.',
      '잡초요? …사실 제가 다 먹어서 없습니다.',
    ],
  },
  {
    id: 'parrot', ko: '앵무새', name: '초록', role: '광장 안내원', zone: 'plaza', emoji: 'ℹ️',
    palette: { primary: '#4CAF6D', secondary: '#D9F2E0', accent: '#F5C542', dark: '#1F4A2E' },
    build: { kind: 'bird', wings: true, crest: true, talkative: true },
    dialogue: [
      '환영합니다! 환영합니다! (두 번 말하는 게 제 스타일)',
      '북쪽은 공원! 동쪽은 카페 거리! 서쪽은 호수!',
      '길을 잃으면 저를 찾아오세요. 저는 못 찾아도요.',
    ],
  },
  {
    id: 'sloth', ko: '나무늘보', name: '느긋', role: '벤치 철학자', zone: 'park', emoji: '🛋️',
    palette: { primary: '#A89478', secondary: '#E6DAC4', accent: '#7C6A50', dark: '#3A3226' },
    build: { kind: 'mammal', slow: true, smile: true },
    dialogue: [
      '급할수록…… 천천히…….',
      '구름…… 보는 중…… 같이 볼래요…….',
      '어제 하려던 말이 있는데…… 내일 할게요…….',
    ],
  },
  {
    id: 'axolotl', ko: '우파루파', name: '파루', role: '낚시터 지킴이', zone: 'lake', emoji: '🎣',
    palette: { primary: '#F2B8C6', secondary: '#FFE4EC', accent: '#E88AA5', dark: '#4A2F38' },
    build: { kind: 'amphibian', gills: 'frilly', smile: true },
    dialogue: [
      '오늘 물고기가 잘 잡혀요! …제 친구들이지만요.',
      '호수 바닥에는 반짝이는 게 가라앉아 있대요.',
      '헤엄 배우고 싶으면 말만 하세요!',
    ],
  },
];

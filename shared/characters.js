// ANIMALVERSE 공용 캐릭터 데이터
// 플레이어가 처음에 선택할 수 있는 동물 20종.
// 모든 버전(3D/2D)이 이 데이터를 읽어 각자의 스타일로 그린다.
// palette: primary(몸통) / secondary(배·밝은 부분) / accent(포인트: 부리·귀 안쪽 등) / dark(윤곽·눈)
// build 힌트: 렌더러가 참고할 형태 특징 (자유 해석 가능)

window.AV_CHARACTERS = [
  {
    id: 'flamingo', ko: '플라밍고', en: 'Flamingo', emoji: '🦩',
    palette: { primary: '#F4739C', secondary: '#FFD3E0', accent: '#F7A8C2', dark: '#33222B' },
    build: { kind: 'bird', neck: 'long', legs: 'long-thin', beak: 'curved', wings: true, tail: 'small' },
    intro: '한 다리로 서서 우아하게. 오늘도 핑크빛 하루!',
  },
  {
    id: 'rabbit', ko: '토끼', en: 'Rabbit', emoji: '🐰',
    palette: { primary: '#F5F0EA', secondary: '#FFFFFF', accent: '#F5A9B8', dark: '#3A3335' },
    build: { kind: 'mammal', ears: 'long-up', tail: 'puff', legs: 'short' },
    intro: '깡총깡총! 당근 있으면 친구 해요.',
  },
  {
    id: 'fox', ko: '여우', en: 'Fox', emoji: '🦊',
    palette: { primary: '#E8833A', secondary: '#FFF4E3', accent: '#C9622B', dark: '#3B2A20' },
    build: { kind: 'mammal', ears: 'pointy', tail: 'bushy', muzzle: 'sharp' },
    intro: '숲에서 온 꾀돌이. 지름길은 제가 다 알아요.',
  },
  {
    id: 'panda', ko: '판다', en: 'Panda', emoji: '🐼',
    palette: { primary: '#F7F4EF', secondary: '#FFFFFF', accent: '#2E2B2C', dark: '#2E2B2C' },
    build: { kind: 'mammal', ears: 'round-dark', eyePatch: true, body: 'chunky' },
    intro: '대나무가 최고야. 뒹굴뒹굴이 특기입니다.',
  },
  {
    id: 'cat', ko: '치즈 고양이', en: 'Cat', emoji: '🐱',
    palette: { primary: '#F2B366', secondary: '#FFE9C7', accent: '#E08E3C', dark: '#3C2F23' },
    build: { kind: 'mammal', ears: 'triangle', tail: 'curl', stripes: true },
    intro: '츄르 주면 야옹 해드림. 낮잠은 국룰.',
  },
  {
    id: 'dog', ko: '시바견', en: 'Shiba', emoji: '🐶',
    palette: { primary: '#E7A960', secondary: '#FFF6E8', accent: '#D18C42', dark: '#38291C' },
    build: { kind: 'mammal', ears: 'triangle', tail: 'curl-up', body: 'sturdy' },
    intro: '산책! 산책! 산책 가는 거지요?!',
  },
  {
    id: 'penguin', ko: '펭귄', en: 'Penguin', emoji: '🐧',
    palette: { primary: '#31394A', secondary: '#F6F8FA', accent: '#F5B940', dark: '#20242E' },
    build: { kind: 'bird', wings: 'flipper', legs: 'stubby', beak: 'short', body: 'egg' },
    intro: '뒤뚱뒤뚱. 미끄럼틀은 배로 타는 겁니다.',
  },
  {
    id: 'owl', ko: '부엉이', en: 'Owl', emoji: '🦉',
    palette: { primary: '#8C6849', secondary: '#E8D5B8', accent: '#F0B429', dark: '#33261B' },
    build: { kind: 'bird', ears: 'tufts', eyes: 'big', wings: true, beak: 'tiny' },
    intro: '밤이 좋아요. 부엉부엉, 별 보러 갈래요?',
  },
  {
    id: 'lion', ko: '사자', en: 'Lion', emoji: '🦁',
    palette: { primary: '#EBB755', secondary: '#FFE9BC', accent: '#B5722E', dark: '#4A331C' },
    build: { kind: 'mammal', mane: true, tail: 'tuft', body: 'sturdy' },
    intro: '갈기 관리가 제일 힘들어요. 어흥은 인사입니다.',
  },
  {
    id: 'tiger', ko: '호랑이', en: 'Tiger', emoji: '🐯',
    palette: { primary: '#EE8A3C', secondary: '#FFF1DC', accent: '#2E2620', dark: '#2E2620' },
    build: { kind: 'mammal', stripes: true, ears: 'round', tail: 'striped' },
    intro: '줄무늬는 태어날 때부터. 용맹함도 기본 옵션.',
  },
  {
    id: 'elephant', ko: '코끼리', en: 'Elephant', emoji: '🐘',
    palette: { primary: '#9BA8BC', secondary: '#C9D3E0', accent: '#F0A7B4', dark: '#3D4350' },
    build: { kind: 'mammal', trunk: true, ears: 'huge', body: 'chunky' },
    intro: '코로 인사할게요. 기억력 하나는 자신 있어요.',
  },
  {
    id: 'giraffe', ko: '기린', en: 'Giraffe', emoji: '🦒',
    palette: { primary: '#F2C94C', secondary: '#FFF3CE', accent: '#C98A3B', dark: '#4A371C' },
    build: { kind: 'mammal', neck: 'long', spots: true, horns: 'ossicone', legs: 'long' },
    intro: '위에서 보면 다 보여요. 높은 곳 소식통.',
  },
  {
    id: 'monkey', ko: '원숭이', en: 'Monkey', emoji: '🐵',
    palette: { primary: '#A9764C', secondary: '#F1D9BE', accent: '#8A5A34', dark: '#3B2A1C' },
    build: { kind: 'mammal', tail: 'long-curl', ears: 'round-side', agile: true },
    intro: '바나나 나눠 먹을 사람? 나무 타기 1등!',
  },
  {
    id: 'frog', ko: '개구리', en: 'Frog', emoji: '🐸',
    palette: { primary: '#6DBE58', secondary: '#D8F0C4', accent: '#F2E863', dark: '#2C4A24' },
    build: { kind: 'amphibian', eyes: 'top-bulge', legs: 'springy', mouth: 'wide' },
    intro: '개굴! 비 오는 날이 제일 신나요.',
  },
  {
    id: 'turtle', ko: '거북이', en: 'Turtle', emoji: '🐢',
    palette: { primary: '#7FB069', secondary: '#DCEBC4', accent: '#5B7C4A', dark: '#31431F' },
    build: { kind: 'reptile', shell: true, legs: 'stubby', slow: true },
    intro: '느려도 괜찮아요. 등껍질은 제 원룸입니다.',
  },
  {
    id: 'bear', ko: '곰', en: 'Bear', emoji: '🐻',
    palette: { primary: '#8D6142', secondary: '#D9B896', accent: '#6B4830', dark: '#33221A' },
    build: { kind: 'mammal', ears: 'round', body: 'chunky', paws: 'big' },
    intro: '꿀단지 위치는 비밀. 포옹은 서비스예요.',
  },
  {
    id: 'pig', ko: '돼지', en: 'Pig', emoji: '🐷',
    palette: { primary: '#F5A8B8', secondary: '#FFD9E0', accent: '#E27E96', dark: '#4A2C34' },
    build: { kind: 'mammal', snout: true, tail: 'spiral', ears: 'floppy' },
    intro: '꿀꿀! 맛집 지도는 저한테 물어보세요.',
  },
  {
    id: 'chick', ko: '병아리', en: 'Chick', emoji: '🐤',
    palette: { primary: '#FFD94A', secondary: '#FFF3B8', accent: '#F5A623', dark: '#5A431A' },
    build: { kind: 'bird', body: 'tiny-round', beak: 'tiny', wings: 'stub' },
    intro: '삐약! 작지만 씩씩합니다.',
  },
  {
    id: 'hedgehog', ko: '고슴도치', en: 'Hedgehog', emoji: '🦔',
    palette: { primary: '#8A6B52', secondary: '#F0DFC8', accent: '#5C4433', dark: '#33261B' },
    build: { kind: 'mammal', spikes: true, body: 'small-round', nose: 'pointy' },
    intro: '가시는 장식이에요. 사실 겁이 많아요.',
  },
  {
    id: 'otter', ko: '수달', en: 'Otter', emoji: '🦦',
    palette: { primary: '#9C7A58', secondary: '#E9D7BC', accent: '#7A5C40', dark: '#3A2C1E' },
    build: { kind: 'mammal', body: 'long', tail: 'thick', swim: true },
    intro: '조개 까기 달인. 물수제비도 잘해요.',
  },
];

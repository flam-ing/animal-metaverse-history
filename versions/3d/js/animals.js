// ANIMALVERSE 3D — 로우폴리 동물 빌더 (28종: 플레이어 20 + NPC 8)
// Box/Sphere/Cylinder/Cone 프리미티브 + flat shading 조합.
// 모든 모델은 +Z 방향을 바라보게 제작. group 원점 = 발밑 지면.
import * as THREE from 'three';

// ── 재질/지오메트리 헬퍼 ──────────────────────────────
const MATS = new Map();
export function mat(color) {
  const key = String(color);
  if (!MATS.has(key)) MATS.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return MATS.get(key);
}
function sph(r, color, w = 8, h = 6) { return new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat(color)); }
function box(w, h, d, color) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)); }
function cyl(rt, rb, h, color, seg = 8) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat(color)); }
function cone(r, h, color, seg = 6) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), mat(color)); }
function tube(pts, r, color, seg = 10) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 6), mat(color));
}
function torus(r, t, color, arc = Math.PI * 2) {
  return new THREE.Mesh(new THREE.TorusGeometry(r, t, 5, 12, arc), mat(color));
}

function baseRig() {
  return {
    group: new THREE.Group(),
    legs: [], wings: [], head: null, body: null, tail: null,
    labelY: 1.5, kind: '',
  };
}

function addEyes(head, o = {}) {
  const r = o.r ?? 0.045, x = o.x ?? 0.1, y = o.y ?? 0.04, z = o.z ?? 0.18, c = o.color ?? '#2b2226';
  for (const s of [-1, 1]) {
    const e = sph(r, c, 6, 5);
    e.position.set(x * s, y, z);
    head.add(e);
    const glint = sph(r * 0.38, '#ffffff', 5, 4);
    glint.position.set(x * s + r * 0.3, y + r * 0.35, z + r * 0.75);
    head.add(glint);
  }
}

function addSmile(parent, x, y, z, r, color) {
  const t = torus(r, 0.013, color, Math.PI);
  t.rotation.z = Math.PI; // 아래쪽 반원 = 미소
  t.position.set(x, y, z);
  parent.add(t);
}

// 다리 피벗: (x, hipY, z)에 위치, 회전축이 엉덩이. len 만큼 아래로 뻗음.
function legPivot(x, hipY, z, len, r, color, o = {}) {
  const piv = new THREE.Group();
  piv.position.set(x, hipY, z);
  const m = cyl(r * 0.82, r, len, color, 7);
  m.position.y = -len / 2;
  piv.add(m);
  if (o.foot) {
    const f = box(r * 2.4, r * 0.9, r * 3.0, o.foot);
    f.position.set(0, -len + r * 0.42, r * 0.8);
    piv.add(f);
  }
  piv.userData.phase = 0;
  return piv;
}

// ── 4족 기본 골격 ─────────────────────────────────────
function quad(p, o = {}) {
  const r = baseRig();
  const br = o.br ?? 0.3;          // 몸통 반지름
  const bl = o.bl ?? 0.72;         // 몸통 길이
  const hip = o.hip ?? 0.3;        // 엉덩이 높이
  const bodyY = hip + br * (o.bodyLift ?? 0.55);
  const body = sph(br, o.bodyColor ?? p.primary);
  body.scale.set(o.bw ?? 1, o.bh ?? 0.95, bl / (br * 2));
  body.position.y = bodyY;
  r.group.add(body); r.body = body;
  if (o.belly !== false) {
    const belly = sph(br * 0.8, o.bellyColor ?? p.secondary);
    belly.scale.set((o.bw ?? 1) * 0.82, 0.68, (bl / (br * 2)) * 0.82);
    belly.position.set(0, bodyY - br * 0.36, 0.02);
    r.group.add(belly);
  }
  const legR = o.legR ?? br * 0.27;
  const lx = o.lx ?? br * 0.58, lz = bl * 0.3;
  const mk = (sx, sz, ph) => {
    const l = legPivot(lx * sx, hip, lz * sz, hip + 0.02, legR, o.legColor ?? p.primary, o);
    l.userData.phase = ph;
    r.group.add(l); r.legs.push(l);
  };
  mk(1, 1, 0); mk(-1, 1, Math.PI); mk(1, -1, Math.PI); mk(-1, -1, 0); // 대각 보행
  if (!o.noHead) {
    const hr = o.hr ?? br * 0.82;
    const head = new THREE.Group();
    head.position.set(0, bodyY + br * (o.headUp ?? 0.72), bl * 0.42 + (o.headFwd ?? 0));
    const skull = sph(hr, o.headColor ?? p.primary);
    head.add(skull);
    if (o.eyes !== false) {
      addEyes(head, { r: hr * 0.17, x: hr * 0.44, y: hr * 0.16, z: hr * 0.78, color: p.dark });
    }
    r.head = head; r.group.add(head);
    r.hr = hr;
    r.labelY = head.position.y + hr + 0.45;
  } else {
    r.labelY = bodyY + br + 0.5;
  }
  r.br = br; r.bl = bl; r.hip = hip; r.bodyY = bodyY;
  return r;
}

// ── 새 기본 골격 (계란형 몸) ──────────────────────────
function birdBase(p, o = {}) {
  const r = baseRig();
  const br = o.br ?? 0.28, hip = o.hip ?? 0.15, eggH = o.eggH ?? 1.2;
  const bodyY = hip + br * eggH * 0.82;
  const body = sph(br, o.bodyColor ?? p.primary);
  body.scale.set(1, eggH, 1.02);
  body.position.y = bodyY;
  r.group.add(body); r.body = body;
  if (o.belly !== false) {
    const belly = sph(br * 0.82, o.bellyColor ?? p.secondary);
    belly.scale.set(0.76, eggH * 0.82, 0.6);
    belly.position.set(0, bodyY - br * 0.1, br * 0.44);
    r.group.add(belly);
  }
  const legColor = o.legColor ?? p.accent;
  for (const s of [-1, 1]) {
    const l = legPivot(br * 0.38 * s, hip, 0, hip + 0.02, br * 0.13, legColor, { foot: legColor });
    l.userData.phase = s > 0 ? 0 : Math.PI;
    r.group.add(l); r.legs.push(l);
  }
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.set(br * 0.9 * s, bodyY + br * eggH * 0.32, 0);
    const w = sph(br * 0.56, o.wingColor ?? p.primary);
    w.scale.set(0.28, o.wingLen ?? 1.0, 0.74);
    w.position.set(br * 0.1 * s, -br * 0.45, -br * 0.05);
    piv.add(w);
    piv.rotation.z = s * 0.14;
    piv.userData.side = s;
    piv.userData.z0 = piv.rotation.z;
    r.group.add(piv); r.wings.push(piv);
  }
  r.br = br; r.hip = hip; r.bodyY = bodyY; r.eggH = eggH;
  r.labelY = bodyY + br * eggH + 0.42;
  return r;
}

// ══════════════════════════════════════════════════════
//  플레이어 20종
// ══════════════════════════════════════════════════════

// 🦩 플라밍고 — 마스코트. 긴 다리 + S자 목 + 굽은 부리 + 외다리 idle
function buildFlamingo(p) {
  const r = baseRig();
  const hip = 0.74;
  const legC = '#E0668F';
  for (const s of [-1, 1]) {
    const l = new THREE.Group();
    l.position.set(0.12 * s, hip, 0);
    const th = cyl(0.026, 0.032, hip, legC, 6);
    th.position.y = -hip / 2;
    l.add(th);
    const knee = sph(0.045, legC, 6, 5);
    knee.position.y = -hip * 0.44;
    l.add(knee);
    const foot = box(0.13, 0.03, 0.17, legC);
    foot.position.set(0, -hip + 0.016, 0.05);
    l.add(foot);
    l.userData.phase = s > 0 ? 0 : Math.PI;
    r.group.add(l); r.legs.push(l);
  }
  const bodyY = hip + 0.28;
  const body = sph(0.35, p.primary);
  body.scale.set(0.9, 0.82, 1.2);
  body.position.y = bodyY;
  r.group.add(body); r.body = body;
  const chest = sph(0.26, p.secondary);
  chest.scale.set(0.78, 0.62, 0.85);
  chest.position.set(0, bodyY - 0.1, 0.14);
  r.group.add(chest);
  // 꽁지깃
  const tail = new THREE.Group();
  tail.position.set(0, bodyY + 0.1, -0.36);
  for (let i = 0; i < 3; i++) {
    const f = sph(0.1 - i * 0.02, i === 1 ? p.accent : p.primary, 6, 5);
    f.scale.set(0.6, 0.8, 1.4);
    f.position.set((i - 1) * 0.07, i * 0.045, -i * 0.055);
    f.rotation.x = 0.55;
    tail.add(f);
  }
  r.group.add(tail); r.tail = tail;
  // 날개 (겹깃)
  for (const s of [-1, 1]) {
    const piv = new THREE.Group();
    piv.position.set(0.28 * s, bodyY + 0.13, 0.02);
    const w = sph(0.22, p.accent);
    w.scale.set(0.3, 0.72, 1.05);
    w.position.set(0.03 * s, -0.1, -0.03);
    piv.add(w);
    for (let i = 0; i < 3; i++) {
      const tip = cone(0.045, 0.16, '#E0668F', 5);
      tip.position.set(0.05 * s, -0.22 + i * 0.02, -0.2 - i * 0.05);
      tip.rotation.x = Math.PI + 0.5;
      piv.add(tip);
    }
    piv.rotation.z = s * 0.1;
    piv.userData.side = s;
    piv.userData.z0 = piv.rotation.z;
    r.group.add(piv); r.wings.push(piv);
  }
  // S자 목
  const neck = tube(
    [[0, bodyY + 0.12, 0.3], [0, bodyY + 0.5, 0.52], [0, bodyY + 0.86, 0.48], [0, bodyY + 1.02, 0.32]],
    0.055, p.primary, 12
  );
  r.group.add(neck);
  // 머리 + 굽은 부리
  const head = new THREE.Group();
  head.position.set(0, bodyY + 1.06, 0.3);
  const skull = sph(0.13, p.primary);
  head.add(skull);
  addEyes(head, { r: 0.028, x: 0.075, y: 0.035, z: 0.09, color: p.dark });
  const beakBase = cone(0.06, 0.2, '#F9CBD9', 6);
  beakBase.rotation.x = Math.PI / 2 + 0.55;
  beakBase.position.set(0, -0.04, 0.17);
  head.add(beakBase);
  const beakTip = cone(0.042, 0.13, p.dark, 6);
  beakTip.rotation.x = Math.PI / 2 + 1.05;
  beakTip.position.set(0, -0.13, 0.235);
  head.add(beakTip);
  const cheek = sph(0.028, p.accent, 5, 4);
  cheek.position.set(0, 0.1, 0.06);
  head.add(cheek);
  r.head = head; r.group.add(head);
  r.labelY = bodyY + 1.35;
  r.kind = 'flamingo';
  return r;
}

// 🐰 토끼 — 긴 귀 + 꼬리 방울
function buildRabbit(p) {
  const r = quad(p, { br: 0.26, bl: 0.56, hip: 0.2, hr: 0.24 });
  for (const s of [-1, 1]) {
    const ear = sph(0.16, p.primary);
    ear.scale.set(0.34, 1.35, 0.24);
    ear.position.set(0.1 * s, 0.36, -0.03);
    ear.rotation.z = -0.16 * s;
    r.head.add(ear);
    const inner = sph(0.11, p.accent);
    inner.scale.set(0.26, 1.15, 0.16);
    inner.position.set(0.1 * s, 0.36, 0.005);
    inner.rotation.z = -0.16 * s;
    r.head.add(inner);
  }
  const nose = sph(0.03, p.accent, 5, 4);
  nose.position.set(0, -0.02, 0.235);
  r.head.add(nose);
  const tail = sph(0.1, p.secondary);
  tail.position.set(0, r.bodyY + 0.05, -0.32);
  r.group.add(tail);
  r.labelY += 0.28;
  return r;
}

// 🦊 여우 — 뾰족 귀 + 뾰족 주둥이 + 풍성한 꼬리
function buildFox(p) {
  const r = quad(p, { br: 0.27, bl: 0.62, hip: 0.28, hr: 0.25 });
  for (const s of [-1, 1]) {
    const ear = cone(0.1, 0.24, p.primary, 4);
    ear.position.set(0.13 * s, 0.28, -0.02);
    ear.rotation.z = -0.22 * s;
    r.head.add(ear);
    const inner = cone(0.06, 0.15, p.secondary, 4);
    inner.position.set(0.13 * s, 0.26, 0.02);
    inner.rotation.z = -0.22 * s;
    r.head.add(inner);
  }
  const muzzle = cone(0.1, 0.24, p.secondary, 6);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.05, 0.3);
  r.head.add(muzzle);
  const nose = sph(0.035, p.dark, 5, 4);
  nose.position.set(0, -0.05, 0.42);
  r.head.add(nose);
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.02, -0.3);
  const t1 = sph(0.15, p.primary);
  t1.scale.set(0.75, 0.75, 1.7);
  t1.position.set(0, 0.09, -0.22);
  t1.rotation.x = -0.35;
  tail.add(t1);
  const t2 = sph(0.08, p.secondary);
  t2.position.set(0, 0.22, -0.44);
  tail.add(t2);
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🐼 판다 — 눈 패치 + 검은 팔다리/귀
function buildPanda(p) {
  const dark = p.accent;
  const r = quad(p, { br: 0.34, bl: 0.7, hip: 0.26, hr: 0.3, legColor: dark, legR: 0.11, belly: false });
  const band = sph(0.3, dark);
  band.scale.set(1.05, 0.85, 0.42);
  band.position.set(0, r.bodyY + 0.05, 0.12);
  r.group.add(band);
  for (const s of [-1, 1]) {
    const ear = sph(0.1, dark, 6, 5);
    ear.position.set(0.2 * s, 0.24, -0.03);
    r.head.add(ear);
    const patch = sph(0.075, dark, 6, 5);
    patch.scale.set(0.85, 1.15, 0.45);
    patch.position.set(0.12 * s, 0.05, 0.245);
    patch.rotation.z = 0.5 * s;
    r.head.add(patch);
  }
  const nose = sph(0.04, dark, 5, 4);
  nose.position.set(0, -0.08, 0.29);
  r.head.add(nose);
  return r;
}

// 🐱 치즈 고양이 — 세모 귀 + 줄무늬 링 + 말린 꼬리
function buildCat(p) {
  const r = quad(p, { br: 0.27, bl: 0.6, hip: 0.26, hr: 0.25 });
  for (const s of [-1, 1]) {
    const ear = cone(0.09, 0.18, p.primary, 4);
    ear.position.set(0.13 * s, 0.26, 0);
    ear.rotation.z = -0.25 * s;
    r.head.add(ear);
    const inner = cone(0.05, 0.11, p.secondary, 4);
    inner.position.set(0.13 * s, 0.25, 0.03);
    inner.rotation.z = -0.25 * s;
    r.head.add(inner);
  }
  for (const z of [-0.12, 0.03, 0.18]) {
    const ring = torus(0.26, 0.028, p.accent);
    ring.scale.set(1, 0.92, 1);
    ring.position.set(0, r.bodyY + 0.01, z);
    r.group.add(ring);
  }
  const nose = sph(0.028, p.accent, 5, 4);
  nose.position.set(0, -0.04, 0.24);
  r.head.add(nose);
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.05, -0.28);
  const tt = tube([[0, 0, 0], [0, 0.16, -0.14], [0, 0.36, -0.1], [0, 0.44, 0.04]], 0.045, p.primary, 8);
  tail.add(tt);
  const tip = sph(0.055, p.accent, 5, 4);
  tip.position.set(0, 0.45, 0.05);
  tail.add(tip);
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🐶 시바견 — 말린 꼬리 + 크림 볼
function buildShiba(p) {
  const r = quad(p, { br: 0.29, bl: 0.62, hip: 0.28, hr: 0.27 });
  for (const s of [-1, 1]) {
    const ear = cone(0.09, 0.17, p.accent, 4);
    ear.position.set(0.14 * s, 0.27, -0.02);
    ear.rotation.z = -0.2 * s;
    r.head.add(ear);
  }
  const muzzle = sph(0.13, p.secondary);
  muzzle.scale.set(1.05, 0.8, 0.75);
  muzzle.position.set(0, -0.07, 0.2);
  r.head.add(muzzle);
  const nose = sph(0.04, p.dark, 5, 4);
  nose.position.set(0, -0.04, 0.3);
  r.head.add(nose);
  for (const s of [-1, 1]) {
    const brow = sph(0.035, p.secondary, 5, 4);
    brow.position.set(0.1 * s, 0.17, 0.21);
    r.head.add(brow);
  }
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.14, -0.3);
  const curl = torus(0.1, 0.05, p.primary, Math.PI * 1.5);
  curl.rotation.y = Math.PI / 2;
  tail.add(curl);
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🐧 펭귄 — 계란 몸 + 지느러미 날개 + 노란 부리/발
function buildPenguin(p) {
  const r = birdBase(p, { br: 0.32, eggH: 1.3, hip: 0.13, wingLen: 1.15 });
  const y = r.bodyY + 0.28;
  const face = sph(0.19, p.secondary);
  face.scale.set(1.25, 0.85, 0.5);
  face.position.set(0, y + 0.06, 0.19);
  r.group.add(face);
  const hd = new THREE.Group();
  hd.position.set(0, y + 0.06, 0);
  addEyes(hd, { r: 0.038, x: 0.1, y: 0.05, z: 0.28, color: p.dark });
  const beak = cone(0.055, 0.16, p.accent, 5);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.02, 0.36);
  hd.add(beak);
  r.group.add(hd); r.head = hd;
  return r;
}

// 🦉 부엉이 — 큰 눈 + 귀깃
function buildOwl(p) {
  const r = birdBase(p, { br: 0.29, eggH: 1.2, hip: 0.12, bellyColor: p.secondary, legColor: '#C7A26A' });
  const y = r.bodyY + 0.24;
  const hd = new THREE.Group();
  hd.position.set(0, y, 0);
  for (const s of [-1, 1]) {
    const disc = sph(0.115, p.secondary, 8, 6);
    disc.scale.set(1, 1, 0.42);
    disc.position.set(0.115 * s, 0.06, 0.235);
    hd.add(disc);
    const pupil = sph(0.055, p.dark, 6, 5);
    pupil.position.set(0.115 * s, 0.06, 0.28);
    hd.add(pupil);
    const glint = sph(0.02, '#ffffff', 5, 4);
    glint.position.set(0.115 * s + 0.025, 0.085, 0.315);
    hd.add(glint);
    const tuft = cone(0.07, 0.18, p.primary, 4);
    tuft.position.set(0.17 * s, 0.32, 0.02);
    tuft.rotation.z = -0.45 * s;
    hd.add(tuft);
  }
  const beak = cone(0.04, 0.1, p.accent, 4);
  beak.rotation.x = Math.PI / 2 + 0.5;
  beak.position.set(0, -0.02, 0.28);
  hd.add(beak);
  r.group.add(hd); r.head = hd;
  return r;
}

// 🦁 사자 — 갈기 + 꼬리 술
function buildLion(p) {
  const r = quad(p, { br: 0.31, bl: 0.72, hip: 0.32, hr: 0.27 });
  const mane = torus(0.27, 0.13, p.accent);
  mane.position.set(0, 0.01, -0.06);
  r.head.add(mane);
  const maneBack = sph(0.3, p.accent);
  maneBack.scale.set(1, 1, 0.55);
  maneBack.position.set(0, 0, -0.12);
  r.head.add(maneBack);
  for (const s of [-1, 1]) {
    const ear = sph(0.07, p.primary, 6, 5);
    ear.position.set(0.15 * s, 0.24, 0.02);
    r.head.add(ear);
  }
  const muzzle = sph(0.11, p.secondary);
  muzzle.scale.set(1.1, 0.75, 0.7);
  muzzle.position.set(0, -0.08, 0.21);
  r.head.add(muzzle);
  const nose = sph(0.04, p.dark, 5, 4);
  nose.position.set(0, -0.04, 0.29);
  r.head.add(nose);
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.06, -0.34);
  const tl = cyl(0.025, 0.032, 0.4, p.primary, 5);
  tl.rotation.x = 0.7;
  tl.position.set(0, 0.1, -0.14);
  tail.add(tl);
  const tuft = cone(0.06, 0.14, p.accent, 5);
  tuft.rotation.x = Math.PI + 0.7;
  tuft.position.set(0, 0.26, -0.28);
  tail.add(tuft);
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🐯 호랑이 — 줄무늬 링 + 이마 무늬
function buildTiger(p) {
  const r = quad(p, { br: 0.31, bl: 0.76, hip: 0.3, hr: 0.27 });
  for (const z of [-0.2, -0.06, 0.08, 0.22]) {
    const ring = torus(0.3, 0.03, p.accent);
    ring.scale.set(1, 0.9, 1);
    ring.position.set(0, r.bodyY + 0.01, z);
    r.group.add(ring);
  }
  for (const s of [-1, 1]) {
    const ear = sph(0.08, p.primary, 6, 5);
    ear.position.set(0.15 * s, 0.24, 0);
    r.head.add(ear);
    const stripe = box(0.05, 0.1, 0.03, p.accent);
    stripe.position.set(0.09 * s, 0.2, 0.22);
    stripe.rotation.z = 0.5 * s;
    r.head.add(stripe);
  }
  const crown = box(0.05, 0.12, 0.03, p.accent);
  crown.position.set(0, 0.2, 0.23);
  r.head.add(crown);
  const muzzle = sph(0.11, p.secondary);
  muzzle.scale.set(1.1, 0.75, 0.7);
  muzzle.position.set(0, -0.08, 0.21);
  r.head.add(muzzle);
  const nose = sph(0.04, p.dark, 5, 4);
  nose.position.set(0, -0.04, 0.29);
  r.head.add(nose);
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.05, -0.36);
  const tl = cyl(0.03, 0.035, 0.42, p.primary, 5);
  tl.rotation.x = 0.8;
  tl.position.set(0, 0.1, -0.16);
  tail.add(tl);
  const tip = sph(0.045, p.accent, 5, 4);
  tip.position.set(0, 0.24, -0.3);
  tail.add(tip);
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🐘 코끼리 — 코 + 큰 귀
function buildElephant(p) {
  const r = quad(p, { br: 0.38, bl: 0.82, hip: 0.32, hr: 0.32, legR: 0.13, headUp: 0.62 });
  for (const s of [-1, 1]) {
    const ear = sph(0.24, p.primary);
    ear.scale.set(0.7, 0.9, 0.16);
    ear.position.set(0.31 * s, 0.04, -0.04);
    ear.rotation.y = 0.5 * s;
    r.head.add(ear);
    const inner = sph(0.17, p.accent);
    inner.scale.set(0.6, 0.8, 0.12);
    inner.position.set(0.32 * s, 0.04, -0.01);
    inner.rotation.y = 0.5 * s;
    r.head.add(inner);
  }
  const trunk = tube(
    [[0, -0.06, 0.26], [0, -0.3, 0.36], [0, -0.52, 0.3], [0, -0.62, 0.42]],
    0.07, p.primary, 10
  );
  r.head.add(trunk);
  for (const s of [-1, 1]) {
    const tusk = cone(0.035, 0.14, '#F4EFE6', 5);
    tusk.rotation.x = Math.PI / 2 + 0.6;
    tusk.position.set(0.12 * s, -0.16, 0.26);
    r.head.add(tusk);
  }
  const tail = cyl(0.02, 0.03, 0.3, p.primary, 5);
  tail.rotation.x = 0.5;
  tail.position.set(0, r.bodyY, -0.44);
  r.group.add(tail);
  return r;
}

// 🦒 기린 — 긴 목 + 반점 + 뿔
function buildGiraffe(p) {
  const r = quad(p, { br: 0.28, bl: 0.66, hip: 0.52, hr: 0.2, noHead: true, legR: 0.08 });
  const neckLen = 0.85;
  const neck = cyl(0.08, 0.11, neckLen, p.primary, 7);
  neck.position.set(0, r.bodyY + neckLen / 2 + 0.1, 0.24);
  neck.rotation.x = -0.18;
  r.group.add(neck);
  const headY = r.bodyY + neckLen + 0.16;
  const head = new THREE.Group();
  head.position.set(0, headY, 0.42);
  const skull = sph(0.17, p.primary);
  skull.scale.set(0.95, 0.9, 1.2);
  head.add(skull);
  addEyes(head, { r: 0.032, x: 0.09, y: 0.05, z: 0.14, color: p.dark });
  const muzzle = sph(0.1, p.secondary);
  muzzle.scale.set(0.9, 0.72, 0.8);
  muzzle.position.set(0, -0.04, 0.15);
  head.add(muzzle);
  for (const s of [-1, 1]) {
    const oss = cyl(0.02, 0.02, 0.12, p.primary, 5);
    oss.position.set(0.07 * s, 0.2, -0.02);
    head.add(oss);
    const knob = sph(0.035, p.accent, 5, 4);
    knob.position.set(0.07 * s, 0.27, -0.02);
    head.add(knob);
    const ear = sph(0.06, p.primary, 5, 4);
    ear.scale.set(1.4, 0.6, 0.4);
    ear.position.set(0.17 * s, 0.1, -0.04);
    head.add(ear);
  }
  r.head = head; r.group.add(head);
  // 반점
  const spotPos = [
    [0.2, r.bodyY + 0.14, 0.1], [-0.18, r.bodyY + 0.16, -0.1], [0.16, r.bodyY - 0.05, -0.2],
    [-0.2, r.bodyY, 0.18], [0.05, r.bodyY + 0.22, -0.05],
    [0.07, r.bodyY + 0.5, 0.28], [-0.06, r.bodyY + 0.72, 0.32],
  ];
  for (const [x, y, z] of spotPos) {
    const sp = sph(0.055, p.accent, 5, 4);
    sp.scale.set(1, 1, 0.5);
    const v = new THREE.Vector3(x, 0, z - (y > r.bodyY + 0.4 ? 0.28 : 0)).normalize();
    sp.position.set(x, y, z);
    sp.lookAt(sp.position.clone().add(v));
    r.group.add(sp);
  }
  const tail = cyl(0.018, 0.022, 0.34, p.primary, 5);
  tail.rotation.x = 0.4;
  tail.position.set(0, r.bodyY + 0.02, -0.4);
  r.group.add(tail);
  r.labelY = headY + 0.55;
  return r;
}

// 🐵 원숭이 — 둥근 옆귀 + 살구색 얼굴 + 말린 긴 꼬리
function buildMonkey(p) {
  const r = quad(p, { br: 0.26, bl: 0.58, hip: 0.28, hr: 0.25, eyes: false });
  const face = sph(0.17, p.secondary);
  face.scale.set(1.05, 0.9, 0.5);
  face.position.set(0, -0.02, 0.14);
  r.head.add(face);
  addEyes(r.head, { r: 0.04, x: 0.08, y: 0.04, z: 0.22, color: p.dark });
  const nose = sph(0.025, p.accent, 5, 4);
  nose.position.set(0, -0.05, 0.23);
  r.head.add(nose);
  for (const s of [-1, 1]) {
    const ear = sph(0.08, p.primary, 6, 5);
    ear.scale.set(0.45, 1, 1);
    ear.position.set(0.24 * s, 0.03, 0);
    r.head.add(ear);
    const inner = sph(0.05, p.secondary, 5, 4);
    inner.scale.set(0.35, 0.8, 0.8);
    inner.position.set(0.25 * s, 0.03, 0.02);
    r.head.add(inner);
  }
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.04, -0.26);
  const tt = tube([[0, 0, 0], [0, 0.2, -0.2], [0, 0.44, -0.16], [0, 0.5, 0.02]], 0.035, p.primary, 9);
  tail.add(tt);
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🐸 개구리 — 위로 볼록 눈 + 넓은 입 + 웅크린 자세
function buildFrog(p) {
  const r = baseRig();
  const body = sph(0.3, p.primary);
  body.scale.set(1.2, 0.82, 1.05);
  body.position.y = 0.3;
  r.group.add(body); r.body = body;
  const belly = sph(0.24, p.secondary);
  belly.scale.set(1.05, 0.62, 0.85);
  belly.position.set(0, 0.22, 0.06);
  r.group.add(belly);
  for (const s of [-1, 1]) {
    const dome = sph(0.1, p.primary, 7, 5);
    dome.position.set(0.15 * s, 0.56, 0.1);
    r.group.add(dome);
    const pupil = sph(0.048, p.dark, 6, 5);
    pupil.position.set(0.15 * s, 0.58, 0.17);
    r.group.add(pupil);
    const glint = sph(0.018, '#ffffff', 5, 4);
    glint.position.set(0.16 * s + 0.02, 0.6, 0.2);
    r.group.add(glint);
    const cheek = sph(0.035, p.accent, 5, 4);
    cheek.scale.set(1, 0.6, 0.5);
    cheek.position.set(0.24 * s, 0.34, 0.22);
    r.group.add(cheek);
  }
  addSmile(r.group, 0, 0.36, 0.315, 0.09, p.dark);
  // 앞다리
  for (const s of [-1, 1]) {
    const l = legPivot(0.19 * s, 0.24, 0.16, 0.26, 0.045, p.primary);
    l.userData.phase = s > 0 ? 0 : Math.PI;
    r.group.add(l); r.legs.push(l);
  }
  // 뒷다리 (웅크린 허벅지)
  for (const s of [-1, 1]) {
    const thigh = sph(0.13, p.primary);
    thigh.scale.set(0.8, 0.9, 1.25);
    thigh.position.set(0.27 * s, 0.16, -0.12);
    r.group.add(thigh);
    const foot = box(0.1, 0.05, 0.24, p.primary);
    foot.position.set(0.28 * s, 0.03, 0.02);
    r.group.add(foot);
  }
  r.labelY = 1.0;
  r.kind = 'frog';
  return r;
}

// 🐢 거북 — 등껍질 + 짧은 다리
function buildTurtle(p) {
  const r = quad(p, {
    br: 0.3, bl: 0.62, hip: 0.13, bh: 0.72, bodyColor: p.accent, belly: false,
    hr: 0.17, headColor: p.primary, headUp: 0.55, headFwd: 0.14, legColor: p.primary, legR: 0.09,
  });
  const rim = cyl(0.31, 0.33, 0.08, p.secondary, 10);
  rim.scale.z = 1.1;
  rim.position.y = r.bodyY - 0.14;
  r.group.add(rim);
  for (const [x, z] of [[0, 0], [0.14, 0.12], [-0.14, 0.12], [0.14, -0.14], [-0.14, -0.14]]) {
    const bump = sph(0.075, '#4E6B3E', 5, 4);
    bump.scale.set(1, 0.5, 1);
    bump.position.set(x, r.bodyY + 0.16 - Math.abs(x) * 0.35, z);
    r.group.add(bump);
  }
  addSmile(r.head, 0, -0.05, 0.155, 0.05, p.dark);
  return r;
}

// 🐻 곰 — 통통 몸 + 둥근 귀 + 큰 발
function buildBear(p) {
  const r = quad(p, { br: 0.36, bl: 0.74, hip: 0.28, hr: 0.3, legR: 0.13, bellyColor: p.secondary });
  for (const s of [-1, 1]) {
    const ear = sph(0.1, p.primary, 6, 5);
    ear.position.set(0.19 * s, 0.25, -0.02);
    r.head.add(ear);
    const inner = sph(0.055, p.secondary, 5, 4);
    inner.position.set(0.19 * s, 0.25, 0.04);
    r.head.add(inner);
  }
  const muzzle = sph(0.13, p.secondary);
  muzzle.scale.set(1, 0.78, 0.7);
  muzzle.position.set(0, -0.09, 0.22);
  r.head.add(muzzle);
  const nose = sph(0.05, p.dark, 5, 4);
  nose.position.set(0, -0.05, 0.31);
  r.head.add(nose);
  return r;
}

// 🐷 돼지 — 들창코 + 처진 귀 + 나선 꼬리
function buildPig(p) {
  const r = quad(p, { br: 0.31, bl: 0.64, hip: 0.24, hr: 0.27 });
  const snout = cyl(0.09, 0.1, 0.09, p.accent, 8);
  snout.rotation.x = Math.PI / 2;
  snout.position.set(0, -0.03, 0.27);
  r.head.add(snout);
  for (const s of [-1, 1]) {
    const nostril = sph(0.018, p.dark, 4, 4);
    nostril.position.set(0.035 * s, -0.03, 0.32);
    r.head.add(nostril);
    const ear = sph(0.09, p.primary, 5, 4);
    ear.scale.set(0.7, 1.1, 0.35);
    ear.position.set(0.16 * s, 0.24, 0.06);
    ear.rotation.set(0.5, 0, -0.5 * s);
    r.head.add(ear);
  }
  const tail = torus(0.05, 0.018, p.accent, Math.PI * 1.6);
  tail.rotation.y = Math.PI / 2;
  tail.position.set(0, r.bodyY + 0.06, -0.34);
  r.group.add(tail);
  return r;
}

// 🐤 병아리 — 아주 작고 동그란 몸
function buildChick(p) {
  const r = birdBase(p, { br: 0.2, eggH: 1.12, hip: 0.08, wingLen: 0.8 });
  const y = r.bodyY + 0.12;
  const hd = new THREE.Group();
  hd.position.set(0, y, 0);
  addEyes(hd, { r: 0.032, x: 0.08, y: 0.06, z: 0.17, color: p.dark });
  const beak = cone(0.035, 0.09, p.accent, 4);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.01, 0.22);
  hd.add(beak);
  for (const s of [-1, 1]) {
    const blush = sph(0.025, '#FBAF8F', 4, 4);
    blush.scale.set(1, 0.6, 0.4);
    blush.position.set(0.12 * s, -0.02, 0.16);
    hd.add(blush);
  }
  r.group.add(hd); r.head = hd;
  const sprout = cone(0.03, 0.1, p.accent, 4);
  sprout.position.set(0, r.bodyY + 0.26, -0.02);
  sprout.rotation.z = 0.3;
  r.group.add(sprout);
  r.labelY = r.bodyY + 0.55;
  return r;
}

// 🦔 고슴도치 — 등 가시 + 크림 얼굴 + 뾰족 코
function buildHedgehog(p) {
  const r = quad(p, {
    br: 0.24, bl: 0.5, hip: 0.12, hr: 0.2, headColor: p.secondary,
    headUp: 0.5, headFwd: 0.06, legR: 0.06, legColor: p.accent, belly: false,
  });
  // 등 가시
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 5; j++) {
      const a = -0.9 + j * 0.45;                       // 좌우 각도
      const zz = -0.16 + i * 0.14;
      const spike = cone(0.045, 0.17, (i + j) % 2 ? p.accent : p.dark, 4);
      const dir = new THREE.Vector3(Math.sin(a), Math.cos(a) * 0.9 + 0.35, 0).normalize();
      spike.position.set(
        Math.sin(a) * 0.2,
        r.bodyY + Math.cos(a) * 0.17 + 0.05,
        zz
      );
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      r.group.add(spike);
    }
  }
  const noseCone = cone(0.07, 0.16, p.secondary, 5);
  noseCone.rotation.x = Math.PI / 2;
  noseCone.position.set(0, -0.05, 0.22);
  r.head.add(noseCone);
  const nose = sph(0.03, p.dark, 5, 4);
  nose.position.set(0, -0.05, 0.3);
  r.head.add(nose);
  return r;
}

// 🦦 수달 — 길쭉한 몸 + 두꺼운 꼬리
function buildOtter(p) {
  const r = quad(p, { br: 0.24, bl: 0.86, hip: 0.16, hr: 0.21, bh: 0.9 });
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY - 0.02, -0.38);
  const tt = sph(0.12, p.primary);
  tt.scale.set(0.85, 0.5, 2.0);
  tt.position.set(0, -0.02, -0.2);
  tail.add(tt);
  r.group.add(tail); r.tail = tail;
  const muzzle = sph(0.11, p.secondary);
  muzzle.scale.set(1.05, 0.75, 0.6);
  muzzle.position.set(0, -0.05, 0.17);
  r.head.add(muzzle);
  const nose = sph(0.032, p.dark, 5, 4);
  nose.position.set(0, -0.02, 0.26);
  r.head.add(nose);
  for (const s of [-1, 1]) {
    const ear = sph(0.045, p.primary, 5, 4);
    ear.position.set(0.15 * s, 0.15, -0.03);
    r.head.add(ear);
  }
  // 조개
  const clam = sph(0.05, '#E8D8EA', 6, 4);
  clam.scale.set(1, 0.6, 1);
  clam.position.set(0, r.bodyY + 0.13, 0.34);
  r.group.add(clam);
  return r;
}

// ══════════════════════════════════════════════════════
//  NPC 8종
// ══════════════════════════════════════════════════════

// 🛁 카피바라 — 각진 몸 + 머리 위 귤
function buildCapybara(p) {
  const r = baseRig();
  const hip = 0.26;
  const body = box(0.58, 0.46, 0.9, p.primary);
  body.position.y = hip + 0.2;
  r.group.add(body); r.body = body;
  const belly = box(0.5, 0.2, 0.78, p.secondary);
  belly.position.y = hip + 0.04;
  r.group.add(belly);
  for (const [sx, sz, ph] of [[1, 1, 0], [-1, 1, Math.PI], [1, -1, Math.PI], [-1, -1, 0]]) {
    const l = legPivot(0.2 * sx, hip, 0.3 * sz, hip + 0.02, 0.07, p.accent);
    l.userData.phase = ph;
    r.group.add(l); r.legs.push(l);
  }
  const head = new THREE.Group();
  head.position.set(0, hip + 0.42, 0.52);
  const skull = box(0.4, 0.32, 0.4, p.primary);
  head.add(skull);
  const snout = box(0.28, 0.18, 0.14, p.secondary);
  snout.position.set(0, -0.06, 0.24);
  head.add(snout);
  // 지그시 감은 눈 (가로선)
  for (const s of [-1, 1]) {
    const eye = box(0.07, 0.02, 0.02, p.dark);
    eye.position.set(0.12 * s, 0.06, 0.21);
    head.add(eye);
    const ear = box(0.08, 0.08, 0.05, p.accent);
    ear.position.set(0.15 * s, 0.19, -0.1);
    head.add(ear);
  }
  const nose = box(0.1, 0.04, 0.02, p.dark);
  nose.position.set(0, -0.02, 0.32);
  head.add(nose);
  // 머리 위 귤
  const tangerine = sph(0.09, '#F0A24B', 7, 5);
  tangerine.position.set(0, 0.24, 0.02);
  head.add(tangerine);
  const leaf = box(0.06, 0.015, 0.03, '#6FA85A');
  leaf.position.set(0.02, 0.33, 0.02);
  leaf.rotation.z = 0.4;
  head.add(leaf);
  r.head = head; r.group.add(head);
  r.bodyY = hip + 0.2;
  r.labelY = 1.35;
  r.kind = 'calm';
  return r;
}

// 📮 비둘기 — 고개 까딱 + 우편가방
function buildPigeon(p) {
  const r = birdBase(p, { br: 0.24, eggH: 1.1, hip: 0.12, legColor: '#C77E5A' });
  const hd = new THREE.Group();
  hd.position.set(0, r.bodyY + 0.3, 0.12);
  const skull = sph(0.13, p.primary);
  hd.add(skull);
  addEyes(hd, { r: 0.028, x: 0.08, y: 0.03, z: 0.09, color: p.dark });
  const beak = cone(0.03, 0.1, '#E8B04B', 4);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.01, 0.16);
  hd.add(beak);
  const sheen = sph(0.09, p.accent, 6, 5);
  sheen.scale.set(0.9, 0.6, 0.7);
  sheen.position.set(0, -0.12, 0.03);
  hd.add(sheen);
  r.group.add(hd); r.head = hd;
  // 꼬리깃
  const tail = box(0.16, 0.04, 0.26, p.accent);
  tail.position.set(0, r.bodyY - 0.06, -0.3);
  tail.rotation.x = -0.35;
  r.group.add(tail);
  // 우편 가방
  const bag = box(0.16, 0.14, 0.1, '#C7935A');
  bag.position.set(0.26, r.bodyY - 0.1, 0.05);
  r.group.add(bag);
  const strap = box(0.03, 0.02, 0.36, '#8A6238');
  strap.position.set(0.13, r.bodyY + 0.14, 0.03);
  strap.rotation.z = -0.9;
  r.group.add(strap);
  r.kind = 'bob';
  r.labelY = r.bodyY + 0.75;
  return r;
}

// ☕ 알파카 — 복슬 목 + 작은 얼굴
function buildAlpaca(p) {
  const r = quad(p, { br: 0.29, bl: 0.62, hip: 0.34, noHead: true, legColor: p.accent, legR: 0.07 });
  // 복슬 몸 덧뭉치
  for (const [x, y, z] of [[0.16, 0.16, -0.1], [-0.16, 0.14, 0.08], [0, 0.2, 0.16], [0, 0.2, -0.2]]) {
    const fluff = sph(0.15, p.secondary, 6, 5);
    fluff.position.set(x, r.bodyY + y, z);
    r.group.add(fluff);
  }
  const neckLen = 0.62;
  const neck = cyl(0.1, 0.12, neckLen, p.primary, 7);
  neck.position.set(0, r.bodyY + neckLen / 2 + 0.05, 0.22);
  r.group.add(neck);
  for (let i = 0; i < 3; i++) {
    const fluff = sph(0.13 - i * 0.015, p.secondary, 6, 5);
    fluff.position.set(i % 2 ? 0.07 : -0.07, r.bodyY + 0.2 + i * 0.18, 0.22);
    r.group.add(fluff);
  }
  const headY = r.bodyY + neckLen + 0.16;
  const head = new THREE.Group();
  head.position.set(0, headY, 0.26);
  const skull = sph(0.15, p.primary);
  skull.scale.set(0.95, 1, 1.1);
  head.add(skull);
  const hair = sph(0.12, p.secondary, 6, 5);
  hair.position.set(0, 0.12, -0.02);
  head.add(hair);
  addEyes(head, { r: 0.03, x: 0.08, y: 0.02, z: 0.13, color: p.dark });
  const muzzle = sph(0.07, p.secondary, 6, 5);
  muzzle.scale.set(0.9, 0.75, 0.8);
  muzzle.position.set(0, -0.06, 0.13);
  head.add(muzzle);
  for (const s of [-1, 1]) {
    const ear = cone(0.04, 0.12, p.primary, 4);
    ear.position.set(0.1 * s, 0.2, -0.02);
    ear.rotation.z = -0.25 * s;
    head.add(ear);
  }
  addSmile(head, 0, -0.08, 0.17, 0.035, p.dark);
  r.head = head; r.group.add(head);
  r.labelY = headY + 0.55;
  return r;
}

// 🛒 라쿤 — 눈 마스크 + 줄무늬 꼬리
function buildRaccoon(p) {
  const r = quad(p, { br: 0.27, bl: 0.6, hip: 0.26, hr: 0.25, eyes: false });
  const mask = sph(0.15, p.accent);
  mask.scale.set(1.55, 0.5, 0.55);
  mask.position.set(0, 0.05, 0.13);
  r.head.add(mask);
  addEyes(r.head, { r: 0.042, x: 0.11, y: 0.05, z: 0.2, color: '#F4F6F8' });
  for (const s of [-1, 1]) {
    const pupil = sph(0.022, p.dark, 5, 4);
    pupil.position.set(0.11 * s, 0.05, 0.235);
    r.head.add(pupil);
    const ear = cone(0.08, 0.15, p.accent, 4);
    ear.position.set(0.14 * s, 0.26, -0.02);
    ear.rotation.z = -0.25 * s;
    r.head.add(ear);
  }
  const muzzle = sph(0.09, p.secondary);
  muzzle.scale.set(1, 0.7, 0.7);
  muzzle.position.set(0, -0.09, 0.2);
  r.head.add(muzzle);
  const nose = sph(0.035, p.dark, 5, 4);
  nose.position.set(0, -0.06, 0.27);
  r.head.add(nose);
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.02, -0.3);
  tail.rotation.x = 0.85;
  for (let i = 0; i < 4; i++) {
    const seg = cyl(0.085 - i * 0.014, 0.095 - i * 0.014, 0.11, i % 2 ? p.accent : p.primary, 7);
    seg.position.y = 0.1 + i * 0.105;
    tail.add(seg);
  }
  r.group.add(tail); r.tail = tail;
  return r;
}

// 🌱 염소 — 뿔 + 턱수염
function buildGoat(p) {
  const r = quad(p, { br: 0.27, bl: 0.6, hip: 0.32, hr: 0.24 });
  for (const s of [-1, 1]) {
    const horn = cone(0.045, 0.22, p.accent, 5);
    horn.position.set(0.09 * s, 0.24, -0.06);
    horn.rotation.x = -0.65;
    r.head.add(horn);
    const ear = sph(0.07, p.primary, 5, 4);
    ear.scale.set(1.5, 0.55, 0.4);
    ear.position.set(0.2 * s, 0.06, -0.03);
    ear.rotation.z = -0.35 * s;
    r.head.add(ear);
  }
  const muzzle = sph(0.1, p.secondary);
  muzzle.scale.set(0.95, 0.75, 0.75);
  muzzle.position.set(0, -0.07, 0.19);
  r.head.add(muzzle);
  const nose = sph(0.03, p.dark, 5, 4);
  nose.position.set(0, -0.04, 0.28);
  r.head.add(nose);
  const beard = cone(0.045, 0.14, p.accent, 4);
  beard.rotation.x = Math.PI;
  beard.position.set(0, -0.2, 0.14);
  r.head.add(beard);
  const tail = cone(0.04, 0.1, p.primary, 4);
  tail.rotation.x = -0.6;
  tail.position.set(0, r.bodyY + 0.12, -0.32);
  r.group.add(tail);
  return r;
}

// ℹ️ 앵무새 — 볏 + 굽은 부리 + 긴 꼬리깃
function buildParrot(p) {
  const r = birdBase(p, { br: 0.23, eggH: 1.18, hip: 0.12, legColor: '#8A7250' });
  const hd = new THREE.Group();
  hd.position.set(0, r.bodyY + 0.3, 0.1);
  const skull = sph(0.14, p.primary);
  hd.add(skull);
  addEyes(hd, { r: 0.03, x: 0.08, y: 0.03, z: 0.1, color: p.dark });
  const beakTop = sph(0.05, p.accent, 6, 5);
  beakTop.scale.set(0.8, 0.9, 1);
  beakTop.position.set(0, 0, 0.15);
  hd.add(beakTop);
  const beakTip = cone(0.032, 0.09, p.accent, 4);
  beakTip.rotation.x = Math.PI + 0.35;
  beakTip.position.set(0, -0.05, 0.18);
  hd.add(beakTip);
  for (let i = 0; i < 3; i++) {
    const crest = cone(0.035, 0.14, p.accent, 4);
    crest.position.set(0, 0.15 + i * 0.015, 0.03 - i * 0.06);
    crest.rotation.x = -0.3 - i * 0.35;
    hd.add(crest);
  }
  r.group.add(hd); r.head = hd;
  const tail = box(0.1, 0.04, 0.34, p.accent);
  tail.position.set(0, r.bodyY - 0.12, -0.28);
  tail.rotation.x = -0.55;
  r.group.add(tail);
  r.labelY = r.bodyY + 0.78;
  return r;
}

// 🛋️ 나무늘보 — 미소 + 늘어진 팔
function buildSloth(p) {
  const r = quad(p, { br: 0.26, bl: 0.56, hip: 0.28, hr: 0.25, eyes: false, legR: 0.075 });
  const face = sph(0.16, p.secondary);
  face.scale.set(1.05, 0.95, 0.5);
  face.position.set(0, -0.01, 0.14);
  r.head.add(face);
  addEyes(r.head, { r: 0.035, x: 0.09, y: 0.03, z: 0.22, color: p.dark });
  for (const s of [-1, 1]) {
    const streak = sph(0.05, p.accent, 5, 4);
    streak.scale.set(0.7, 1.6, 0.3);
    streak.position.set(0.11 * s, 0.0, 0.21);
    streak.rotation.z = 0.55 * s;
    r.head.add(streak);
  }
  const nose = sph(0.03, p.dark, 5, 4);
  nose.position.set(0, -0.06, 0.24);
  r.head.add(nose);
  addSmile(r.head, 0, -0.1, 0.235, 0.05, p.dark);
  // 발톱
  for (const l of r.legs) {
    const claw = cone(0.03, 0.08, p.secondary, 4);
    claw.rotation.x = Math.PI / 2;
    claw.position.set(0, -r.hip + 0.03, 0.09);
    l.add(claw);
  }
  r.kind = 'calm';
  return r;
}

// 🎣 우파루파 — 프릴 아가미 + 꼬리 지느러미
function buildAxolotl(p) {
  const r = quad(p, {
    br: 0.24, bl: 0.74, hip: 0.11, hr: 0.24, headUp: 0.42, headFwd: 0.1,
    legR: 0.05, bh: 0.85, eyes: false,
  });
  addEyes(r.head, { r: 0.035, x: 0.11, y: 0.05, z: 0.17, color: p.dark });
  addSmile(r.head, 0, -0.05, 0.225, 0.06, p.dark);
  for (const s of [-1, 1]) {
    const blush = sph(0.035, p.accent, 5, 4);
    blush.scale.set(1, 0.6, 0.4);
    blush.position.set(0.15 * s, -0.03, 0.17);
    r.head.add(blush);
    for (let i = 0; i < 3; i++) {
      const gill = cone(0.032, 0.15, p.accent, 4);
      gill.position.set((0.2 + i * 0.03) * s, 0.1 - i * 0.07, -0.06 - i * 0.03);
      gill.rotation.z = s * (1.35 + i * 0.25);
      r.head.add(gill);
      const gt = sph(0.028, '#F8D2DD', 4, 4);
      gt.position.set((0.28 + i * 0.035) * s, 0.13 - i * 0.08, -0.07 - i * 0.03);
      r.head.add(gt);
    }
  }
  const tail = new THREE.Group();
  tail.position.set(0, r.bodyY + 0.06, -0.36);
  const fin = sph(0.14, p.primary);
  fin.scale.set(0.24, 0.95, 1.7);
  fin.position.set(0, 0.05, -0.18);
  tail.add(fin);
  const finEdge = sph(0.1, p.secondary);
  finEdge.scale.set(0.18, 0.8, 1.5);
  finEdge.position.set(0, 0.12, -0.22);
  tail.add(finEdge);
  r.group.add(tail); r.tail = tail;
  return r;
}

// ── 빌더 레지스트리 ───────────────────────────────────
const BUILDERS = {
  flamingo: buildFlamingo, rabbit: buildRabbit, fox: buildFox, panda: buildPanda,
  cat: buildCat, dog: buildShiba, penguin: buildPenguin, owl: buildOwl,
  lion: buildLion, tiger: buildTiger, elephant: buildElephant, giraffe: buildGiraffe,
  monkey: buildMonkey, frog: buildFrog, turtle: buildTurtle, bear: buildBear,
  pig: buildPig, chick: buildChick, hedgehog: buildHedgehog, otter: buildOtter,
  capybara: buildCapybara, pigeon: buildPigeon, alpaca: buildAlpaca, raccoon: buildRaccoon,
  goat: buildGoat, parrot: buildParrot, sloth: buildSloth, axolotl: buildAxolotl,
};

export function buildAnimal(def) {
  const builder = BUILDERS[def.id] || ((p) => quad(p, {}));
  const rig = builder(def.palette);
  // 애니메이션 기준값 저장
  if (rig.body) rig.body.userData.y0 = rig.body.position.y;
  if (rig.head) {
    rig.head.userData.y0 = rig.head.position.y;
    rig.head.userData.z0 = rig.head.position.z;
  }
  if (rig.tail) rig.tail.userData.ry0 = rig.tail.rotation.y;
  for (const w of rig.wings) w.userData.z0 = w.rotation.z;
  return rig;
}

// ── 걷기/idle 애니메이션 (본 없이 그룹 회전) ─────────────
export function animateRig(rig, t, speed) {
  const s = Math.min(Math.max(speed, 0), 1);
  const w = t * 10;
  const calm = rig.kind === 'calm' ? 0.55 : 1;
  for (const l of rig.legs) {
    let rot = Math.sin(w + l.userData.phase) * 0.62 * s * calm;
    if (rig.kind === 'flamingo') {
      const want = s < 0.05 && l.userData.phase > 0 ? 1 : 0;
      l.userData.lift = (l.userData.lift ?? 0) + (want - (l.userData.lift ?? 0)) * 0.05;
      rot -= l.userData.lift * 1.45;
    }
    l.rotation.x = rot;
  }
  for (const wg of rig.wings) {
    wg.rotation.z = wg.userData.z0 +
      wg.userData.side * (Math.sin(w * 1.15) * 0.4 * s + Math.sin(t * 2.3) * 0.045);
  }
  if (rig.body) {
    const bounce = rig.kind === 'frog' ? 0.1 : 0.035;
    rig.body.position.y = rig.body.userData.y0 +
      Math.abs(Math.sin(w)) * bounce * s + Math.sin(t * 2) * 0.007;
  }
  if (rig.head) {
    rig.head.position.y = rig.head.userData.y0 + Math.sin(t * 2 + 1) * 0.013;
    if (rig.kind === 'bob') {
      rig.head.position.z = rig.head.userData.z0 + Math.sin(w) * 0.055 * s;
    }
  }
  if (rig.tail) {
    rig.tail.rotation.y = (rig.tail.userData.ry0 || 0) + Math.sin(t * 3.1) * 0.22;
  }
}

// ── 이름 라벨 (canvas 텍스처 Sprite) ─────────────────────
export function makeLabel(main, sub) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const f1 = '700 34px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  const f2 = '500 23px "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  g.font = f1;
  let w = g.measureText(main).width;
  if (sub) {
    g.font = f2;
    w = Math.max(w, g.measureText(sub).width);
  }
  const pad = 20, h = sub ? 84 : 56;
  c.width = Math.ceil(w + pad * 2);
  c.height = h;
  const rr = 16;
  g.beginPath();
  g.roundRect(1, 1, c.width - 2, h - 2, rr);
  g.fillStyle = 'rgba(255,255,255,0.86)';
  g.fill();
  g.strokeStyle = 'rgba(214,73,126,0.35)';
  g.lineWidth = 2;
  g.stroke();
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#43303a';
  g.font = f1;
  g.fillText(main, c.width / 2, sub ? 28 : h / 2 + 1);
  if (sub) {
    g.fillStyle = '#a37287';
    g.font = f2;
    g.fillText(sub, c.width / 2, 60);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
  const k = 1 / 90;
  sp.scale.set(c.width * k, c.height * k, 1);
  return sp;
}

// ── 발밑 블롭 그림자 ─────────────────────────────────
const SHADOW_MAT = new THREE.MeshBasicMaterial({
  color: 0x2a3140, transparent: true, opacity: 0.16, depthWrite: false,
});
export function blobShadow(r = 0.45) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 14), SHADOW_MAT);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}

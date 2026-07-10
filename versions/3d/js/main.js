// ANIMALVERSE 로우폴리 아일랜드 — 메인 (월드 + 선택 무대 + 게임 루프)
import * as THREE from 'three';
import { buildAnimal, animateRig, makeLabel, blobShadow, mat } from './animals.js';

const CHARS = window.AV_CHARACTERS || [];
const NPCS = window.AV_NPCS || [];
const ZONES = {}; (window.AV_ZONES || []).forEach((z) => (ZONES[z.id] = z));

// 섬 위 존 좌표 (x, z)
const ZONE_POS = {
  plaza: { x: 0, z: 0, r: 7 },
  park: { x: -13, z: -9, r: 8 },
  cafe: { x: 13, z: -9, r: 8 },
  lake: { x: -13, z: 11, r: 9 },
  hotspring: { x: 13, z: 11, r: 8 },
};
const ISLAND_R = 25;

let renderer, scene, camera, clock;
let worldGroup, stageGroup;
let mode = 'select'; // 'select' | 'world'
let player = null;
const npcs = [];
const visitors = [];
const keys = {};
let curZone = null, nearNpc = null;
let selectedDef = null, stageRig = null, stageSpin = 0;
const dlg = { open: false, npc: null, i: 0 };

// ─────────────────────────────────────────
function init() {
  const canvas = document.getElementById('gl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color('#bfe3f2');
  scene.fog = new THREE.Fog('#cfe9f4', 42, 78);

  camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 6, 12);
  camera.lookAt(0, 1, 0);

  const hemi = new THREE.HemisphereLight('#fff4e8', '#7fa06a', 0.95);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d8', 1.0);
  sun.position.set(14, 22, 8);
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.28);
  fill.position.set(-10, 8, -12);
  scene.add(fill);

  clock = new THREE.Clock();

  buildWorld();
  buildStage();
  buildSelectUI();
  bindInput();

  window.addEventListener('resize', onResize);

  document.getElementById('loading').style.opacity = '0';
  setTimeout(() => document.getElementById('loading').classList.add('hidden'), 420);
  document.getElementById('select-screen').classList.remove('hidden');

  renderer.setAnimationLoop(frame);
}

// ── 월드(섬) 구성 ─────────────────────────
function buildWorld() {
  worldGroup = new THREE.Group();
  worldGroup.visible = false;
  scene.add(worldGroup);

  // 물
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(70, 40),
    new THREE.MeshLambertMaterial({ color: '#77c4e0', transparent: true, opacity: 0.9 })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.35;
  worldGroup.add(water);

  // 섬 지면 (낮은 원기둥 = 두께감)
  const land = new THREE.Mesh(
    new THREE.CylinderGeometry(ISLAND_R, ISLAND_R - 1.5, 1.4, 40),
    new THREE.MeshLambertMaterial({ color: '#8ccf6f', flatShading: true })
  );
  land.position.y = -0.2;
  worldGroup.add(land);
  // 모래 테두리
  const beach = new THREE.Mesh(
    new THREE.RingGeometry(ISLAND_R - 2.4, ISLAND_R + 0.4, 40),
    new THREE.MeshLambertMaterial({ color: '#f0dcae' })
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.y = 0.51;
  worldGroup.add(beach);

  // 존별 소품
  buildPlaza(ZONE_POS.plaza);
  buildPark(ZONE_POS.park);
  buildCafe(ZONE_POS.cafe);
  buildLake(ZONE_POS.lake);
  buildOnsen(ZONE_POS.hotspring);
  scatterGrass();
}

function box(w, h, d, c) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c)); }
function cyl(rt, rb, h, c, s = 10) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), mat(c)); }
function sph(r, c, w = 8, h = 6) { return new THREE.Mesh(new THREE.SphereGeometry(r, w, h), mat(c)); }
function cone(r, h, c, s = 7) { return new THREE.Mesh(new THREE.ConeGeometry(r, h, s), mat(c)); }
function place(obj, x, z, y = 0.5) { obj.position.set(x, y, z); worldGroup.add(obj); return obj; }

const fountainDrops = [];
function buildPlaza(p) {
  const base = cyl(3, 3.4, 0.5, '#d9dde4', 16); place(base, p.x, p.z, 0.75);
  const bowl = cyl(2, 1.4, 0.5, '#c7ccd6', 16); place(bowl, p.x, p.z, 1.2);
  const stem = cyl(0.3, 0.3, 1.2, '#c7ccd6'); place(stem, p.x, p.z, 1.9);
  const top = cyl(0.9, 0.5, 0.35, '#c7ccd6', 12); place(top, p.x, p.z, 2.6);
  // 물방울 파티클
  for (let i = 0; i < 14; i++) {
    const d = sph(0.09, '#bfe6f5', 5, 4);
    d.userData = { a: Math.random() * Math.PI * 2, sp: 0.6 + Math.random() * 0.6, t: Math.random() };
    place(d, p.x, p.z, 2.8);
    fountainDrops.push(d);
  }
  // 게시판
  const board = box(1.8, 1.2, 0.16, '#c9a06a'); place(board, p.x + 4, p.z - 1.5, 1.3);
  const leg = box(0.16, 1.3, 0.16, '#8a6a42'); place(leg, p.x + 4, p.z - 1.5, 0.65);
  const paper = box(1.4, 0.85, 0.02, '#fff8ec'); place(paper, p.x + 4, p.z - 1.42, 1.35);
}

const cherryTrees = [];
function tree(x, z) {
  const g = new THREE.Group();
  const trunk = cyl(0.28, 0.4, 2.2, '#8a5a3a'); trunk.position.y = 1.1; g.add(trunk);
  for (let i = 0; i < 4; i++) {
    const blob = sph(1.1 + Math.random() * 0.5, '#f7b5cf', 7, 6);
    blob.position.set((Math.random() - 0.5) * 1.6, 2.4 + Math.random() * 0.8, (Math.random() - 0.5) * 1.6);
    g.add(blob);
  }
  g.position.set(x, 0.5, z);
  g.userData = { sway: Math.random() * Math.PI * 2 };
  worldGroup.add(g);
  cherryTrees.push(g);
  return g;
}
function buildPark(p) {
  tree(p.x - 3, p.z - 2); tree(p.x + 3, p.z - 3); tree(p.x, p.z + 3);
  tree(p.x + 4, p.z + 1); tree(p.x - 4, p.z + 2);
  // 벤치
  const bench = new THREE.Group();
  bench.add(place(box(2, 0.16, 0.6, '#c98a4a'), 0, 0, 0.6));
  const seat = box(2, 0.16, 0.6, '#c98a4a'); seat.position.set(0, 0.6, 0); bench.add(seat);
  const backr = box(2, 0.6, 0.14, '#b57a3a'); backr.position.set(0, 0.95, -0.28); bench.add(backr);
  bench.position.set(p.x + 1, 0.5, p.z + 5);
  worldGroup.add(bench);
}

function shop(x, z, roof) {
  const g = new THREE.Group();
  g.add(offset(box(3, 2.4, 3, '#fbeee0'), 0, 1.2, 0));
  const rf = cone(2.6, 1.4, roof, 4); rf.position.y = 3.1; rf.rotation.y = Math.PI / 4; g.add(rf);
  const door = box(0.8, 1.3, 0.1, '#8a6a52'); door.position.set(0, 0.65, 1.52); g.add(door);
  const awning = box(3.2, 0.1, 0.9, roof); awning.position.set(0, 1.9, 1.7); awning.rotation.x = -0.25; g.add(awning);
  g.position.set(x, 0.5, z);
  worldGroup.add(g);
}
function offset(o, x, y, z) { o.position.set(x, y, z); return o; }
function buildCafe(p) {
  shop(p.x - 3, p.z - 2, '#e27e96');
  shop(p.x + 3, p.z - 2, '#4caf6d');
  shop(p.x, p.z + 3, '#e0a030');
}

function buildLake(p) {
  // 작은 호수 (지면보다 낮은 물)
  const pond = new THREE.Mesh(new THREE.CircleGeometry(5, 24), new THREE.MeshLambertMaterial({ color: '#5fb8d8' }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(p.x, 0.53, p.z); worldGroup.add(pond);
  // 부두
  const dock = box(1.2, 0.2, 4, '#b98a52'); place(dock, p.x, p.z - 4.5, 0.62);
  for (let i = 0; i < 2; i++) { const pl = box(0.16, 0.6, 0.16, '#8a6238'); place(pl, p.x - 0.4 + i * 0.8, p.z - 2.8, 0.4); }
}

const steamPuffs = [];
function buildOnsen(p) {
  const rim = cyl(3.2, 3.4, 0.6, '#b7936a', 16); place(rim, p.x, p.z, 0.8);
  const wtr = new THREE.Mesh(new THREE.CircleGeometry(2.7, 20), new THREE.MeshLambertMaterial({ color: '#cfeff0', transparent: true, opacity: 0.92 }));
  wtr.rotation.x = -Math.PI / 2; wtr.position.set(p.x, 1.02, p.z); worldGroup.add(wtr);
  for (let i = 0; i < 5; i++) {
    const rock = sph(0.5 + Math.random() * 0.3, '#8a7a6a', 6, 5);
    const a = (i / 5) * Math.PI * 2;
    place(rock, p.x + Math.cos(a) * 3, p.z + Math.sin(a) * 3, 0.7);
  }
  // 김 파티클 (스프라이트)
  const steamTex = makeSteamTex();
  for (let i = 0; i < 8; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, opacity: 0.4, depthWrite: false }));
    sp.scale.set(1.6, 1.6, 1);
    sp.userData = { t: Math.random(), x: p.x + (Math.random() - 0.5) * 4, z: p.z + (Math.random() - 0.5) * 4 };
    sp.position.set(sp.userData.x, 1.2, sp.userData.z);
    worldGroup.add(sp);
    steamPuffs.push(sp);
  }
}
function makeSteamTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); return t;
}

function scatterGrass() {
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * (ISLAND_R - 3);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (nearestZone(x, z).d < 3.5) continue;
    const blade = cone(0.18, 0.5, i % 2 ? '#7bbf5a' : '#f6d94a', 4);
    place(blade, x, z, 0.72);
  }
}

// ── 선택 무대 ─────────────────────────────
function buildStage() {
  stageGroup = new THREE.Group();
  scene.add(stageGroup);
  const ped = cyl(2.4, 2.8, 0.5, '#f3c8db', 20); ped.position.y = 0.25; stageGroup.add(ped);
  const ped2 = cyl(2.0, 2.4, 0.3, '#f7dbe8', 20); ped2.position.y = 0.6; stageGroup.add(ped2);
  setStageAnimal(CHARS[0]);
}
function setStageAnimal(def) {
  if (stageRig) stageGroup.remove(stageRig.group);
  stageRig = buildAnimal(def);
  stageRig.group.position.y = 0.75;
  stageRig.group.scale.setScalar(1.4);
  stageGroup.add(stageRig.group);
  selectedDef = def;
}

// ── 선택 UI ───────────────────────────────
function buildSelectUI() {
  const grid = document.getElementById('char-grid');
  CHARS.forEach((def) => {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `<img alt="${def.ko}" src="${thumb(def)}"><div class="cname">${def.ko}</div><div class="cemoji">${def.emoji || ''}</div>`;
    card.addEventListener('click', () => {
      grid.querySelectorAll('.char-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      setStageAnimal(def);
      document.getElementById('info-name').innerHTML = `${def.ko}<span class="en">${def.en}</span>`;
      document.getElementById('info-intro').textContent = def.intro || '';
    });
    grid.appendChild(card);
  });
  // 첫 캐릭터 자동 선택
  grid.firstChild.click();

  document.getElementById('enter-btn').addEventListener('click', enterWorld);
}

// 각 동물 썸네일: 단일 렌더러 재사용해 오프스크린 렌더 → dataURL
let thumbScene = null, thumbCam = null;
function thumb(def) {
  if (!thumbScene) {
    thumbScene = new THREE.Scene();
    thumbScene.add(new THREE.HemisphereLight('#ffffff', '#889', 1.1));
    const d = new THREE.DirectionalLight('#fff', 0.7); d.position.set(3, 5, 4); thumbScene.add(d);
    thumbCam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  }
  const rig = buildAnimal(def);
  rig.group.position.y = -0.9;
  thumbScene.add(rig.group);
  // 카메라 프레이밍
  thumbCam.position.set(2.4, 1.4, 3.2);
  thumbCam.lookAt(0, 0.2, 0);
  const prevSize = new THREE.Vector2(); renderer.getSize(prevSize);
  renderer.setSize(150, 150, false);
  renderer.render(thumbScene, thumbCam);
  const url = renderer.domElement.toDataURL('image/png');
  renderer.setSize(prevSize.x, prevSize.y, false);
  thumbScene.remove(rig.group);
  return url;
}

// ── 월드 진입 ─────────────────────────────
function enterWorld() {
  mode = 'world';
  document.getElementById('select-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  stageGroup.visible = false;
  worldGroup.visible = true;

  // 플레이어
  player = buildAnimal(selectedDef);
  player.group.add(blobShadow(0.5));
  player.group.position.set(0, 0.5, 5);
  player.heading = Math.PI;
  player.label = makeLabel(selectedDef.ko, null);
  player.label.position.y = (player.labelY || 1.5) + 0.6;
  player.group.add(player.label);
  scene.add(player.group);

  // NPC
  NPCS.forEach((n, i) => {
    const zp = ZONE_POS[n.zone] || ZONE_POS.plaza;
    const a = (i / NPCS.length) * Math.PI * 2;
    const rig = buildAnimal(n);
    rig.group.add(blobShadow(0.5));
    const x = zp.x + Math.cos(a) * 2.5, z = zp.z + Math.sin(a) * 2.5;
    rig.group.position.set(x, 0.5, z);
    rig.anchor = { x, z };
    rig.def = n; rig.seed = i * 1.7; rig.speed = 0; rig.heading = 0;
    rig.label = makeLabel(n.name, n.role);
    rig.label.position.y = (rig.labelY || 1.5) + 0.7;
    rig.group.add(rig.label);
    scene.add(rig.group);
    npcs.push(rig);
  });

  // 방문객 6마리
  const pool = CHARS.filter((c) => c.id !== selectedDef.id);
  for (let k = 0; k < 6 && k < pool.length; k++) {
    const def = pool[(k * 3 + 1) % pool.length];
    const rig = buildAnimal(def);
    rig.group.add(blobShadow(0.45));
    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 12;
    rig.group.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
    rig.target = pickWander();
    rig.wait = 0; rig.speed = 0; rig.heading = 0; rig.seed = k * 2.1;
    scene.add(rig.group);
    visitors.push(rig);
  }
}
function pickWander() {
  const a = Math.random() * Math.PI * 2, r = Math.random() * (ISLAND_R - 5);
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

// ── 입력 ───────────────────────────────────
function bindInput() {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (k === 'e') { e.preventDefault(); interact(); }
    if (k.indexOf('arrow') === 0) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
}
function interact() {
  if (mode !== 'world') return;
  if (dlg.open) {
    dlg.i++;
    if (dlg.i >= dlg.npc.def.dialogue.length) closeDlg(); else showDlg();
    return;
  }
  if (nearNpc) openDlg(nearNpc);
}
function openDlg(n) { dlg.open = true; dlg.npc = n; dlg.i = 0; document.getElementById('dialogue').classList.remove('hidden'); showDlg(); }
function showDlg() {
  const n = dlg.npc.def;
  document.getElementById('dlg-name').innerHTML = `${n.name}<span class="role">${n.role}</span>`;
  document.getElementById('dlg-text').textContent = n.dialogue[dlg.i];
}
function closeDlg() { dlg.open = false; dlg.npc = null; document.getElementById('dialogue').classList.add('hidden'); }

// ── 존 판정 ────────────────────────────────
function nearestZone(x, z) {
  let best = null, bd = 1e9;
  for (const id in ZONE_POS) {
    const p = ZONE_POS[id];
    const d = Math.hypot(x - p.x, z - p.z);
    if (d < bd) { bd = d; best = id; }
  }
  return { id: best, d: bd, r: ZONE_POS[best].r };
}

// ── 프레임 ─────────────────────────────────
function frame() {
  const dt = Math.min(0.05, clock.getDelta());
  const t = clock.elapsedTime;

  animateWorldProps(t);

  if (mode === 'select') {
    stageSpin += dt * 0.7;
    stageGroup.rotation.y = stageSpin;
    if (stageRig) animateRig(stageRig, t, 0);
    camera.position.lerp(new THREE.Vector3(0, 2.2, 6.5), 0.08);
    camera.lookAt(0, 1.2, 0);
  } else {
    updateWorld(dt, t);
  }

  renderer.render(scene, camera);
}

function animateWorldProps(t) {
  fountainDrops.forEach((d) => {
    d.userData.t += 0.03;
    const ph = d.userData.t % 1;
    d.position.y = 2.8 + Math.sin(ph * Math.PI) * 1.2;
    d.position.x += Math.cos(d.userData.a) * 0.02;
    d.position.z += Math.sin(d.userData.a) * 0.02;
    if (ph < 0.03) {
      const p = ZONE_POS.plaza;
      d.position.set(p.x, 2.8, p.z);
    }
  });
  cherryTrees.forEach((g) => { g.rotation.z = Math.sin(t * 1.2 + g.userData.sway) * 0.03; });
  steamPuffs.forEach((s) => {
    s.userData.t += 0.006;
    const ph = s.userData.t % 1;
    s.position.y = 1.2 + ph * 3;
    s.material.opacity = 0.42 * (1 - ph);
    s.scale.setScalar(1.2 + ph * 1.8);
  });
}

function updateWorld(dt, t) {
  // 플레이어 이동 (카메라 기준 상대 이동)
  let f = 0, r = 0;
  if (!dlg.open) {
    if (keys['w'] || keys['arrowup']) f += 1;
    if (keys['s'] || keys['arrowdown']) f -= 1;
    if (keys['a'] || keys['arrowleft']) r -= 1;
    if (keys['d'] || keys['arrowright']) r += 1;
  }
  // 카메라 정면(XZ 평면)과 오른쪽 벡터
  const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
  // right = cross(fwd, up): fwd=(0,0,-1)일 때 (0,0,-1)x(0,1,0) = (1,0,0) = +X = 화면상 오른쪽 → negate 불필요
  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
  const moveDir = new THREE.Vector3().addScaledVector(fwd, f).addScaledVector(right, r);
  const mag = moveDir.length();
  let speed = 0;
  if (mag > 0.0001) {
    moveDir.normalize(); speed = 1;
    const nx = player.group.position.x + moveDir.x * 6 * dt;
    const nz = player.group.position.z + moveDir.z * 6 * dt;
    if (Math.hypot(nx, nz) < ISLAND_R - 2) {
      player.group.position.x = nx; player.group.position.z = nz;
    }
    player.heading = Math.atan2(moveDir.x, moveDir.z);
  }
  player.group.rotation.y += angleDelta(player.group.rotation.y, player.heading) * 0.2;
  animateRig(player, t, speed);
  keepLabelFacing(player.label);

  // 카메라 3인칭 추적
  const px = player.group.position.x, pz = player.group.position.z;
  const camDist = 9, camH = 6;
  const desired = new THREE.Vector3(
    px - Math.sin(player.heading) * camDist,
    camH,
    pz - Math.cos(player.heading) * camDist
  );
  camera.position.lerp(desired, 0.07);
  camera.lookAt(px, 1.4, pz);

  // 존 토스트
  const nz2 = nearestZone(px, pz);
  const inZone = nz2.d < nz2.r ? nz2.id : null;
  if (inZone && inZone !== curZone) { curZone = inZone; showToast(inZone); }

  // NPC
  nearNpc = null; let bestD = 3.2;
  npcs.forEach((n) => {
    const tx = n.anchor.x + Math.cos(n.seed + t * 0.3) * 1.6;
    const tz = n.anchor.z + Math.sin(n.seed * 1.3 + t * 0.26) * 1.6;
    const dx = tx - n.group.position.x, dz = tz - n.group.position.z;
    const dl = Math.hypot(dx, dz);
    let sp = 0;
    if (dl > 0.15) {
      sp = 1;
      n.group.position.x += (dx / dl) * 1.4 * dt;
      n.group.position.z += (dz / dl) * 1.4 * dt;
      n.heading = Math.atan2(dx, dz);
    }
    n.group.rotation.y += angleDelta(n.group.rotation.y, n.heading) * 0.15;
    animateRig(n, t, sp * 0.7);
    keepLabelFacing(n.label);
    const pd = Math.hypot(n.group.position.x - px, n.group.position.z - pz);
    if (pd < bestD) { bestD = pd; nearNpc = n; }
  });

  // 방문객
  visitors.forEach((v) => {
    if (v.wait > 0) { v.wait -= dt; animateRig(v, t, 0); return; }
    const dx = v.target.x - v.group.position.x, dz = v.target.z - v.group.position.z;
    const dl = Math.hypot(dx, dz);
    if (dl < 0.4) { v.target = pickWander(); v.wait = 0.6 + Math.random(); animateRig(v, t, 0); return; }
    v.group.position.x += (dx / dl) * 2 * dt;
    v.group.position.z += (dz / dl) * 2 * dt;
    v.heading = Math.atan2(dx, dz);
    v.group.rotation.y += angleDelta(v.group.rotation.y, v.heading) * 0.15;
    animateRig(v, t, 1);
  });

  // 상호작용 힌트
  const hint = document.getElementById('interact-hint');
  if (nearNpc && !dlg.open) {
    hint.classList.remove('hidden');
    document.getElementById('interact-text').textContent = '대화 — ' + nearNpc.def.name;
  } else hint.classList.add('hidden');
}

function keepLabelFacing() { /* Sprite 는 항상 카메라를 향함 — 별도 처리 불필요 */ }
function angleDelta(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

let toastTimer = null;
function showToast(zid) {
  const z = ZONES[zid]; if (!z) return;
  const el = document.getElementById('toast');
  el.innerHTML = `${z.ko}<span class="sub">${z.hint || ''}</span>`;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// 모든 선언 이후 시작
init();

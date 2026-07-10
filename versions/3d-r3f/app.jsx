// ANIMALVERSE 노을 군도 — React Three Fiber
// 기존 3D 버전의 animals.js(three 그룹 빌더)를 <primitive>로 재사용. 노을빛 톤으로 차별화.
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildAnimal, animateRig, makeLabel, blobShadow } from '../3d/js/animals.js';

const CHARS = window.AV_CHARACTERS || [];
const NPCS = window.AV_NPCS || [];
const ZONES = {}; (window.AV_ZONES || []).forEach((z) => (ZONES[z.id] = z));
const ZONE_POS = {
  plaza: { x: 0, z: 0, r: 7 }, park: { x: -13, z: -9, r: 8 }, cafe: { x: 13, z: -9, r: 8 },
  lake: { x: -13, z: 11, r: 9 }, hotspring: { x: 13, z: 11, r: 8 },
};
const ISLAND_R = 25;

// ── 셀셰이딩(툰 + 외곽선) ──────────────────
const GMAP = (() => {
  const d = new Uint8Array([70, 70, 150, 150, 255, 255]); // 3톤 계단
  const t = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  t.needsUpdate = true; return t;
})();
const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x2b2030, side: THREE.BackSide });
function inkShell(o, k) {
  if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
  const r = (o.geometry.boundingSphere && o.geometry.boundingSphere.radius) || 0.3;
  if (r < 0.055) return; // 눈알 등 초소형 부위는 선 생략
  const shell = new THREE.Mesh(o.geometry, OUTLINE_MAT);
  // 부위 크기에 반비례한 상대 스케일 → 화면상 선 굵기를 비슷하게 유지
  shell.scale.setScalar(1 + Math.min(k / r, 0.14));
  shell.userData.isOutline = true;
  o.add(shell);
}
function toonify(group) {
  const meshes = [];
  group.traverse((o) => { if (o.isMesh && o.material && o.material.color && !o.userData.isOutline) meshes.push(o); });
  meshes.forEach((o) => {
    o.material = new THREE.MeshToonMaterial({ color: o.material.color.clone(), gradientMap: GMAP });
    inkShell(o, 0.026);
  });
}
// 월드 소품용: 이미 toon 재질인 메시에 잉크 외곽선만 추가
function addWorldOutlines(root) {
  root.traverse((o) => {
    if (!o.isMesh || o.userData.isOutline || o.userData.noOutline) return;
    if (!o.material || o.material.transparent) return;
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    const r = o.geometry.boundingSphere.radius;
    if (r < 0.14 || r > 12) return; // 잔풀 이하·지형급 이상은 생략
    inkShell(o, 0.05);
  });
}
function Outlined({ children }) {
  const ref = useRef();
  useEffect(() => { if (ref.current) addWorldOutlines(ref.current); }, []);
  return <group ref={ref}>{children}</group>;
}

const keys = {};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if (k === 'e') { e.preventDefault(); window.dispatchEvent(new CustomEvent('av-interact')); }
  if (k.indexOf('arrow') === 0) e.preventDefault();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function nearestZone(x, z) {
  let best = null, bd = 1e9;
  for (const id in ZONE_POS) { const p = ZONE_POS[id]; const d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = id; } }
  return { id: best, d: bd, r: ZONE_POS[best].r };
}
function angleDelta(from, to) { let d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }
function pickWander() { const a = Math.random() * Math.PI * 2, r = Math.random() * (ISLAND_R - 5); return { x: Math.cos(a) * r, z: Math.sin(a) * r }; }

// ── 월드 소품 (선언형) ─────────────────────
function Tree({ pos, tone = 0 }) {
  // 동화책 팬케이크 나무 — tone 0: 세이지 / 1: 황금 노을 / 2: 더스티 로즈
  const cols = [['#8fbf6a', '#6ea854'], ['#eab84e', '#d1963a'], ['#e2909e', '#c97786']][tone % 3];
  const tiers = [[1.4, 2.05], [1.06, 2.75], [0.68, 3.32]];
  return (
    <group position={pos}>
      <mesh position={[0, 1.0, 0]}><cylinderGeometry args={[0.22, 0.36, 2.0, 7]} /><meshToonMaterial color="#8a5a3c" gradientMap={GMAP} /></mesh>
      {tiers.map((tr, i) => (
        <mesh key={i} position={[0, tr[1], 0]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[tr[0], 9, 7]} />
          <meshToonMaterial color={cols[i % 2]} gradientMap={GMAP} />
        </mesh>
      ))}
    </group>
  );
}
function Shop({ pos, roof }) {
  return (
    <group position={pos}>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[3, 2.4, 3]} /><meshToonMaterial color="#fdf0dc" gradientMap={GMAP} /></mesh>
      <mesh position={[0, 3.1, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[2.6, 1.4, 4]} /><meshToonMaterial color={roof} gradientMap={GMAP} /></mesh>
      <mesh position={[0, 0.65, 1.52]}><boxGeometry args={[0.8, 1.3, 0.1]} /><meshToonMaterial color="#7a5a44" gradientMap={GMAP} /></mesh>
    </group>
  );
}
function Fountain({ pos }) {
  const drops = useRef();
  useFrame(({ clock }) => {
    if (!drops.current) return;
    drops.current.children.forEach((d, i) => {
      const ph = ((clock.elapsedTime * 0.8 + i * 0.13) % 1);
      d.position.y = 2.8 + Math.sin(ph * Math.PI) * 1.2;
      const a = (i / 12) * Math.PI * 2;
      d.position.x = Math.cos(a) * ph * 0.6; d.position.z = Math.sin(a) * ph * 0.6;
    });
  });
  return (
    <group position={pos}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[3, 3.4, 0.5, 20]} /><meshToonMaterial color="#efe0cd" gradientMap={GMAP} /></mesh>
      <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[2, 1.4, 0.5, 20]} /><meshToonMaterial color="#e2cdb2" gradientMap={GMAP} /></mesh>
      <mesh position={[0, 1.9, 0]}><cylinderGeometry args={[0.3, 0.3, 1.2, 10]} /><meshToonMaterial color="#e2cdb2" gradientMap={GMAP} /></mesh>
      <group ref={drops}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} userData={{ noOutline: true }}><sphereGeometry args={[0.09, 6, 5]} /><meshBasicMaterial color="#bfe6ff" /></mesh>
        ))}
      </group>
    </group>
  );
}
function Onsen({ pos }) {
  const steam = useRef();
  useFrame(({ clock }) => {
    if (!steam.current) return;
    steam.current.children.forEach((s, i) => {
      const ph = ((clock.elapsedTime * 0.4 + i * 0.2) % 1);
      s.position.y = 1.2 + ph * 3; s.material.opacity = 0.4 * (1 - ph); s.scale.setScalar(1 + ph * 1.6);
    });
  });
  return (
    <group position={pos}>
      <mesh position={[0, 0.8, 0]}><cylinderGeometry args={[3.2, 3.4, 0.6, 20]} /><meshToonMaterial color="#b7936a" gradientMap={GMAP} /></mesh>
      <mesh position={[0, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noOutline: true }}><circleGeometry args={[2.7, 24]} /><meshBasicMaterial color="#d8f1ef" transparent opacity={0.95} /></mesh>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return <mesh key={i} position={[Math.cos(a) * 3, 0.7, Math.sin(a) * 3]}><sphereGeometry args={[0.5, 6, 5]} /><meshToonMaterial color="#8a7a6a" gradientMap={GMAP} /></mesh>;
      })}
      <group ref={steam}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * 4, 1.2, (Math.random() - 0.5) * 4]}>
            <sphereGeometry args={[0.8, 7, 6]} /><meshStandardMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// ── 동화책 배경: 계단식 바다·수평선 태양·실루엣 군도·종이 구름 ──
function SunsetSea() {
  // 연속 그라데이션 대신 뚝뚝 끊기는 색 띠 = 그림책 바다
  const bands = [
    [ISLAND_R + 0.3, 33, '#f7a86e'], [33, 44, '#ee8f63'],
    [44, 57, '#dd7568'], [57, 74, '#c06178'],
  ];
  return (
    <group>
      {bands.map((b, i) => (
        <mesh key={i} position={[0, -0.36 - i * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noOutline: true }}>
          <ringGeometry args={[b[0], b[1], 48]} /><meshBasicMaterial color={b[2]} />
        </mesh>
      ))}
      {/* 수평선의 큰 태양 (안개 무시 → 또렷한 그림책 태양) */}
      <mesh position={[0, 8, -82]} userData={{ noOutline: true }}><circleGeometry args={[9.5, 40]} /><meshBasicMaterial color="#ffd075" fog={false} /></mesh>
      <mesh position={[0, 8, -82.6]} userData={{ noOutline: true }}><circleGeometry args={[12.5, 40]} /><meshBasicMaterial color="#ffab72" transparent opacity={0.5} fog={false} /></mesh>
    </group>
  );
}
function DistantIsles() {
  // '군도'라는 이름값 — 멀리 떠 있는 보랏빛 실루엣 섬들
  const isles = [
    [-38, -52, 7, 3.4], [16, -60, 10, 4.6], [46, -34, 6, 2.8],
    [-55, 8, 8, 3.6], [52, 26, 7, 3.0],
  ];
  return (
    <group>
      {isles.map((s, i) => (
        <group key={i} position={[s[0], -0.3, s[1]]}>
          <mesh scale={[1, 0.55, 1]} userData={{ noOutline: true }}><sphereGeometry args={[s[2], 10, 8]} /><meshBasicMaterial color="#96627e" /></mesh>
          <mesh position={[0, s[3] * 0.66, 0]} scale={[1, 0.7, 1]} userData={{ noOutline: true }}><coneGeometry args={[s[2] * 0.45, s[3], 8]} /><meshBasicMaterial color="#7d5070" /></mesh>
        </group>
      ))}
    </group>
  );
}
function Clouds() {
  const ref = useRef();
  const puffs = useMemo(() => Array.from({ length: 8 }, (_, i) => ({
    x: (Math.random() - 0.5) * 100, y: 11 + Math.random() * 8, z: (Math.random() - 0.5) * 100,
    s: 1.5 + Math.random() * 1.9, sp: 0.4 + Math.random() * 0.6,
  })), []);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.children.forEach((c, i) => { c.position.x += puffs[i].sp * dt; if (c.position.x > 58) c.position.x = -58; });
  });
  return (
    <group ref={ref}>
      {puffs.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} scale={p.s}>
          {[[-1, 0, 0, 0.8], [0, 0.34, 0, 1.05], [1.05, 0.04, 0, 0.75], [0.35, -0.12, 0.4, 0.68]].map((b, j) => (
            <mesh key={j} position={[b[0], b[1], b[2]]} scale={[1, 0.7, 1]} userData={{ noOutline: true }}>
              <sphereGeometry args={[b[3], 8, 6]} /><meshBasicMaterial color={i % 2 ? '#fff3e2' : '#ffd9d2'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Island() {
  const grass = useMemo(() => {
    const out = [];
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * (ISLAND_R - 3);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (nearestZone(x, z).d < 3.5) continue;
      out.push([x, 0.72, z, i % 2 ? '#7fb85e' : '#e8c34e']);
    }
    return out;
  }, []);
  return (
    <group>
      <SunsetSea />
      <DistantIsles />
      <Clouds />
      <Outlined>
        <mesh position={[0, -0.2, 0]} userData={{ noOutline: true }}><cylinderGeometry args={[ISLAND_R, ISLAND_R - 1.5, 1.4, 40]} /><meshToonMaterial color="#a8cd6e" gradientMap={GMAP} /></mesh>
        <mesh position={[0, 0.53, 0]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noOutline: true }}><ringGeometry args={[ISLAND_R - 2.4, ISLAND_R + 0.4, 40]} /><meshToonMaterial color="#f2d493" gradientMap={GMAP} /></mesh>
        <Fountain pos={[0, 0, 0]} />
        {[[-3, -2, 1], [3, -3, 0], [0, 3, 2], [4, 1, 1], [-4, 2, 0]].map((o, i) => <Tree key={'pt' + i} pos={[ZONE_POS.park.x + o[0], 0.5, ZONE_POS.park.z + o[1]]} tone={o[2]} />)}
        <Shop pos={[ZONE_POS.cafe.x - 3, 0.5, ZONE_POS.cafe.z - 2]} roof="#e2698c" />
        <Shop pos={[ZONE_POS.cafe.x + 3, 0.5, ZONE_POS.cafe.z - 2]} roof="#4caf6d" />
        <Shop pos={[ZONE_POS.cafe.x, 0.5, ZONE_POS.cafe.z + 3]} roof="#e59a2a" />
        {/* 호수 — 종이 오려붙인 듯한 노을빛 물 + 흰 테두리 */}
        <mesh position={[ZONE_POS.lake.x, 0.525, ZONE_POS.lake.z]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noOutline: true }}><circleGeometry args={[5.4, 28]} /><meshBasicMaterial color="#fff0da" /></mesh>
        <mesh position={[ZONE_POS.lake.x, 0.535, ZONE_POS.lake.z]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noOutline: true }}><circleGeometry args={[5, 28]} /><meshBasicMaterial color="#f5a05e" /></mesh>
        <mesh position={[ZONE_POS.lake.x, 0.545, ZONE_POS.lake.z + 1]} rotation={[-Math.PI / 2, 0, 0]} userData={{ noOutline: true }}><circleGeometry args={[2.6, 22]} /><meshBasicMaterial color="#ffc27e" /></mesh>
        <mesh position={[ZONE_POS.lake.x, 0.62, ZONE_POS.lake.z - 4.5]}><boxGeometry args={[1.2, 0.2, 4]} /><meshToonMaterial color="#b98a52" gradientMap={GMAP} /></mesh>
        <Tree pos={[ZONE_POS.lake.x - 3, 0.5, ZONE_POS.lake.z - 1]} tone={2} />
        <Onsen pos={[ZONE_POS.hotspring.x, 0, ZONE_POS.hotspring.z]} />
        {grass.map((g, i) => <mesh key={'g' + i} position={[g[0], g[1], g[2]]}><coneGeometry args={[0.18, 0.5, 5]} /><meshToonMaterial color={g[3]} gradientMap={GMAP} /></mesh>)}
      </Outlined>
    </group>
  );
}

// ── 캐릭터 엔티티 (three 그룹 재사용) ─────────
function makeEntity(def, isPlayer) {
  const rig = buildAnimal(def);
  toonify(rig.group); // 셰이딩·외곽선 (그림자/라벨 추가 전에)
  rig.group.add(blobShadow(isPlayer ? 0.5 : 0.45));
  const label = makeLabel(isPlayer ? def.ko : def.name, isPlayer ? null : def.role);
  label.position.y = (rig.labelY || 1.5) + 0.6;
  rig.group.add(label);
  rig.def = def; rig.heading = 0;
  return rig;
}

// 카메라 기준 이동을 위한 재사용 임시 벡터 (프레임마다 새로 할당하지 않음)
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _moveDir = new THREE.Vector3();

function GameWorld({ selectedDef, onZone, onNear }) {
  const { camera } = useThree();
  const state = useMemo(() => {
    const player = makeEntity(selectedDef, true);
    player.group.position.set(0, 0.5, 5); player.heading = Math.PI;
    const npcs = NPCS.map((nd, i) => {
      const zp = ZONE_POS[nd.zone] || ZONE_POS.plaza;
      const a = (i / NPCS.length) * Math.PI * 2;
      const e = makeEntity(nd, false);
      e.group.position.set(zp.x + Math.cos(a) * 2.5, 0.5, zp.z + Math.sin(a) * 2.5);
      e.anchor = { x: zp.x + Math.cos(a) * 2.5, z: zp.z + Math.sin(a) * 2.5 }; e.seed = i * 1.7;
      return e;
    });
    const pool = CHARS.filter((c) => c.id !== selectedDef.id);
    const visitors = [];
    for (let k = 0; k < 6 && k < pool.length; k++) {
      const e = makeEntity(pool[(k * 3 + 1) % pool.length], false);
      // 방문객은 라벨 제거(혼잡 방지)
      e.group.remove(e.group.children[e.group.children.length - 1]);
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 12;
      e.group.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
      e.target = pickWander(); e.wait = 0;
      visitors.push(e);
    }
    return { player, npcs, visitors };
  }, [selectedDef]);

  const curZone = useRef(null);

  useFrame(({ clock }, dt) => {
    dt = Math.min(0.05, dt);
    const t = clock.elapsedTime;
    const { player, npcs, visitors } = state;
    const dlgOpen = window.__avDialogOpen;

    let f = 0, r = 0;
    if (!dlgOpen) {
      if (keys['w'] || keys['arrowup']) f += 1;
      if (keys['s'] || keys['arrowdown']) f -= 1;
      if (keys['a'] || keys['arrowleft']) r -= 1;
      if (keys['d'] || keys['arrowright']) r += 1;
    }
    // 카메라 정면(XZ 평면)과 오른쪽 벡터
    camera.getWorldDirection(_fwd); _fwd.y = 0; _fwd.normalize();
    // right = cross(fwd, up): fwd=(0,0,-1)일 때 (0,0,-1)x(0,1,0) = (1,0,0) = +X = 화면상 오른쪽 → negate 불필요
    _right.crossVectors(_fwd, _up);
    _moveDir.set(0, 0, 0).addScaledVector(_fwd, f).addScaledVector(_right, r);
    const mag = _moveDir.length(); let speed = 0;
    if (mag > 0.0001) {
      _moveDir.normalize(); speed = 1;
      const nx = player.group.position.x + _moveDir.x * 6 * dt, nz = player.group.position.z + _moveDir.z * 6 * dt;
      if (Math.hypot(nx, nz) < ISLAND_R - 2) { player.group.position.x = nx; player.group.position.z = nz; }
      player.heading = Math.atan2(_moveDir.x, _moveDir.z);
    }
    player.group.rotation.y += angleDelta(player.group.rotation.y, player.heading) * 0.2;
    animateRig(player, t, speed);

    const px = player.group.position.x, pz = player.group.position.z;
    const desired = new THREE.Vector3(px - Math.sin(player.heading) * 9, 6, pz - Math.cos(player.heading) * 9);
    camera.position.lerp(desired, 0.07);
    camera.lookAt(px, 1.4, pz);

    const nz2 = nearestZone(px, pz); const inZone = nz2.d < nz2.r ? nz2.id : null;
    if (inZone && inZone !== curZone.current) { curZone.current = inZone; onZone(inZone); }

    let near = null, bestD = 3.2;
    npcs.forEach((nn) => {
      const tx = nn.anchor.x + Math.cos(nn.seed + t * 0.3) * 1.6, tz = nn.anchor.z + Math.sin(nn.seed * 1.3 + t * 0.26) * 1.6;
      const dx = tx - nn.group.position.x, dz = tz - nn.group.position.z, dl = Math.hypot(dx, dz); let sp = 0;
      if (dl > 0.15) { sp = 1; nn.group.position.x += (dx / dl) * 1.4 * dt; nn.group.position.z += (dz / dl) * 1.4 * dt; nn.heading = Math.atan2(dx, dz); }
      nn.group.rotation.y += angleDelta(nn.group.rotation.y, nn.heading) * 0.15;
      animateRig(nn, t, sp * 0.7);
      const pd = Math.hypot(nn.group.position.x - px, nn.group.position.z - pz);
      if (pd < bestD) { bestD = pd; near = nn; }
    });
    visitors.forEach((v) => {
      if (v.wait > 0) { v.wait -= dt; animateRig(v, t, 0); return; }
      const dx = v.target.x - v.group.position.x, dz = v.target.z - v.group.position.z, dl = Math.hypot(dx, dz);
      if (dl < 0.4) { v.target = pickWander(); v.wait = 0.6 + Math.random(); animateRig(v, t, 0); return; }
      v.group.position.x += (dx / dl) * 2 * dt; v.group.position.z += (dz / dl) * 2 * dt;
      v.heading = Math.atan2(dx, dz); v.group.rotation.y += angleDelta(v.group.rotation.y, v.heading) * 0.15;
      animateRig(v, t, 1);
    });

    window.__avNearNpc = near ? near.def : null;
    onNear(near ? near.def : null);
  });

  return (
    <group>
      <Island />
      <primitive object={state.player.group} />
      {state.npcs.map((n, i) => <primitive key={'n' + i} object={n.group} />)}
      {state.visitors.map((v, i) => <primitive key={'v' + i} object={v.group} />)}
    </group>
  );
}

// ── 선택 무대 ─────────────────────────────
function Turntable({ def }) {
  const { camera } = useThree();
  const grp = useRef();
  const rig = useMemo(() => { const r = buildAnimal(def); toonify(r.group); return r; }, [def]);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime;
    if (grp.current) grp.current.rotation.y += dt * 0.7;
    animateRig(rig, t, 0);
    camera.position.lerp(new THREE.Vector3(0, 2.4, 7), 0.08);
    camera.lookAt(0, 1.2, 0);
  });
  return (
    <group>
      <mesh position={[0, 0.25, 0]}><cylinderGeometry args={[2.4, 2.8, 0.5, 20]} /><meshToonMaterial color="#f0975f" gradientMap={GMAP} /></mesh>
      <group ref={grp} position={[0, 0.75, 0]} scale={1.4}><primitive object={rig.group} /></group>
    </group>
  );
}

function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffe9cd', '#a98878', 0.55]} />
      <directionalLight position={[-14, 9, -6]} intensity={1.9} color="#ffe6c2" />
      <ambientLight intensity={0.3} color="#ffd9c4" />
    </>
  );
}

// ── 앱 ────────────────────────────────────
function App() {
  const [screen, setScreen] = useState('select');
  const [selectedDef, setSelectedDef] = useState(CHARS[0]);
  const [stageDef, setStageDef] = useState(CHARS[0]);
  const [zone, setZone] = useState(null);
  const [near, setNear] = useState(null);
  const [dialog, setDialog] = useState({ open: false, npc: null, i: 0 });
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();

  useEffect(() => { window.__avDialogOpen = dialog.open; }, [dialog.open]);

  useEffect(() => {
    const onInteract = () => {
      setDialog((d) => {
        if (d.open) {
          const ni = d.i + 1;
          if (ni >= d.npc.dialogue.length) { window.__avDialogOpen = false; return { open: false, npc: null, i: 0 }; }
          return { ...d, i: ni };
        }
        const npc = window.__avNearNpc;
        if (npc) { window.__avDialogOpen = true; return { open: true, npc, i: 0 }; }
        return d;
      });
    };
    window.addEventListener('av-interact', onInteract);
    return () => window.removeEventListener('av-interact', onInteract);
  }, []);

  const showZone = (zid) => {
    setZone(zid);
    setToast(ZONES[zid]);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    const l = document.getElementById('loading');
    if (l) { l.style.opacity = '0'; setTimeout(() => l.classList.add('hidden'), 420); }
  }, []);

  const enter = () => { setSelectedDef(stageDef); setScreen('world'); };

  return (
    <>
      <Canvas camera={{ position: [0, 8, 12], fov: 52 }} onCreated={({ scene }) => {
        scene.background = new THREE.Color('#ffd9b6');
        scene.fog = new THREE.Fog('#ffd9c0', 55, 110);
      }}>
        <Lights />
        {screen === 'select' ? <Turntable def={stageDef} /> : <GameWorld selectedDef={selectedDef} onZone={showZone} onNear={setNear} />}
      </Canvas>

      {screen === 'select' && (
        <>
          <div id="sel-title"><h1>ANIMALVERSE</h1><p>노을 군도 (React Three Fiber) · 동화책 셀셰이딩 — 함께할 동물을 골라 주세요</p></div>
          <div id="char-panel">
            <h2>동물 친구 20종</h2>
            <div id="char-grid">
              {CHARS.map((def) => (
                <div key={def.id} className={'ccard' + (def.id === stageDef.id ? ' sel' : '')} onClick={() => setStageDef(def)}>
                  <div className="ce">{def.emoji || '🐾'}</div><div className="cn">{def.ko}</div>
                </div>
              ))}
            </div>
          </div>
          <div id="info-card">
            <div id="info-name" dangerouslySetInnerHTML={{ __html: stageDef.ko + '<span class="en">' + stageDef.en + '</span>' }} />
            <div id="info-intro">{stageDef.intro}</div>
            <button id="enter-btn" onClick={enter}>입 장</button>
          </div>
        </>
      )}

      {screen === 'world' && (
        <>
          <div id="zone-chip">{zone ? ZONES[zone].ko : '섬 어딘가'}</div>
          <div id="controls-hint">이동 <b>WASD / 방향키</b><br />대화 <b>E</b></div>
          {near && !dialog.open && (
            <div id="interact-hint"><span className="key">E</span>대화 — {near.name}</div>
          )}
          {dialog.open && (
            <div id="dialogue">
              <div id="dlg-name">{dialog.npc.name}<span className="role">{dialog.npc.role}</span></div>
              <div id="dlg-text">{dialog.npc.dialogue[dialog.i]}</div>
              <div id="dlg-next"><span className="key">E</span> 다음</div>
            </div>
          )}
          {toast && (
            <div id="toast" className="show">{toast.ko}<span className="sub">{toast.hint}</span></div>
          )}
        </>
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);

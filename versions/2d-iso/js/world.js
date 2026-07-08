// ANIMALVERSE 2d-iso — 디오라마 섬: 타일맵, 절벽 단면, 존 소품, 충돌
(function () {
  'use strict';
  var HW = ISO.HW, HH = ISO.HH, TAU = Math.PI * 2;
  var SIZE = 48, CX = 24, CY = 24;

  // 타일 타입
  var T = { VOID: 0, GRASS: 1, PLAZA: 2, PATH: 3, WATER: 4, SAND: 5, DOCK: 6, SPRING_ST: 7, SPRING_W: 8, PAVE: 9 };
  var WALKABLE = {}; // 타입별 통행 가능
  WALKABLE[T.GRASS] = WALKABLE[T.PLAZA] = WALKABLE[T.PATH] = WALKABLE[T.SAND] =
    WALKABLE[T.DOCK] = WALKABLE[T.SPRING_ST] = WALKABLE[T.PAVE] = true;

  // 존 배치 (앵무새 대사와 일치: 북=공원, 동=카페, 서=호수)
  var ZONE_POS = {
    plaza: { x: 24, y: 24, r: 7.5 },
    park: { x: 15, y: 15, r: 8.5 },
    cafe: { x: 32.5, y: 15, r: 8.5 },
    lake: { x: 14.5, y: 33, r: 9.5 },
    hotspring: { x: 33, y: 33.5, r: 7.5 },
  };

  var grid = new Uint8Array(SIZE * SIZE);
  var blocked = new Uint8Array(SIZE * SIZE); // 건물 발자국
  var props = [];      // {x,y,r,sortY,draw}
  var buildings = [];

  function idx(x, y) { return y * SIZE + x; }
  function inRange(x, y) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE; }
  function typeAt(x, y) { return inRange(x, y) ? grid[idx(x, y)] : T.VOID; }
  function setT(x, y, t) { if (inRange(x, y)) grid[idx(x, y)] = t; }

  function isIsland(x, y) {
    var dx = x - CX, dy = y - CY;
    var ang = Math.atan2(dy, dx);
    var rr = 21.2 + Math.sin(ang * 4.7 + 2.1) * 1.1 + Math.sin(ang * 9.3 + 0.7) * 0.7;
    return dx * dx + dy * dy <= rr * rr;
  }

  // ── 맵 생성 ─────────────────────────
  function buildMap() {
    var x, y, i, t;
    for (y = 0; y < SIZE; y++) for (x = 0; x < SIZE; x++)
      grid[idx(x, y)] = isIsland(x, y) ? T.GRASS : T.VOID;

    // 광장 → 각 존 길
    ['park', 'cafe', 'lake', 'hotspring'].forEach(function (z) {
      var p = ZONE_POS[z];
      var steps = 90;
      for (i = 0; i <= steps; i++) {
        t = i / steps;
        var px = ISO.lerp(24, p.x, t), py = ISO.lerp(24, p.y, t);
        for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
          var gx = Math.round(px + ox * 0.6), gy = Math.round(py + oy * 0.6);
          if (typeAt(gx, gy) === T.GRASS) setT(gx, gy, T.PATH);
        }
      }
    });

    // 중앙 광장 (돌바닥 원형)
    for (y = 0; y < SIZE; y++) for (x = 0; x < SIZE; x++) {
      var d = Math.hypot(x - 24, y - 24);
      if (d < 5.6 && typeAt(x, y) !== T.VOID) setT(x, y, T.PLAZA);
    }

    // 반짝 호수 (물 + 모래사장)
    for (y = 0; y < SIZE; y++) for (x = 0; x < SIZE; x++) {
      t = typeAt(x, y); if (t === T.VOID) continue;
      var ex = (x - 14) / 6.6, ey = (y - 33) / 5.2;
      var dd = ex * ex + ey * ey;
      if (dd < 1) setT(x, y, T.WATER);
      else if (dd < 1.65 && (t === T.GRASS || t === T.PATH)) setT(x, y, T.SAND);
    }
    // 나무 부두 (호수 안으로)
    for (x = 11; x <= 18; x++) if (typeAt(x, 33) === T.WATER || typeAt(x, 33) === T.SAND) setT(x, 33, T.DOCK);

    // 온천 마을 (돌바닥 + 노천탕)
    for (y = 0; y < SIZE; y++) for (x = 0; x < SIZE; x++) {
      t = typeAt(x, y); if (t === T.VOID) continue;
      if (Math.hypot(x - 33, y - 33.5) < 5.6 && (t === T.GRASS || t === T.PATH || t === T.SAND)) setT(x, y, T.SPRING_ST);
      var sx = (x - 33) / 3.3, sy2 = (y - 34) / 2.5;
      if (sx * sx + sy2 * sy2 < 1) setT(x, y, T.SPRING_W);
    }

    // 카페 거리 (포장 도로)
    for (y = 13; y <= 17; y++) for (x = 26; x <= 39; x++) {
      t = typeAt(x, y);
      if (t === T.GRASS || t === T.PATH) setT(x, y, T.PAVE);
    }
  }

  // ── 소품 등록 ─────────────────────────
  function addProp(x, y, r, draw, sortBias) {
    var s = ISO.toScreen(x, y);
    props.push({ x: x, y: y, r: r, sx: s.x, sy: s.y, sortY: s.y + (sortBias || 0), draw: draw });
  }

  function addBuilding(b) {
    buildings.push(b);
    for (var y = b.y; y < b.y + b.d; y++) for (var x = b.x; x < b.x + b.w; x++)
      if (inRange(x, y)) blocked[idx(x, y)] = 1;
    var front = ISO.toScreen(b.x + b.w - 0.5, b.y + b.d - 0.5);
    props.push({ x: b.x, y: b.y, r: 0, sx: front.x, sy: front.y, sortY: front.y, draw: function (c, t) { drawBuilding(c, b, t); } });
  }

  // ── 소품 드로잉 ─────────────────────────
  function drawShadowE(c, sx, sy, rx, ry) {
    c.fillStyle = 'rgba(60,45,55,0.16)';
    c.beginPath(); c.ellipse(sx, sy, rx, ry, 0, 0, TAU); c.fill();
  }

  function drawFountain(c, t) {
    var s = ISO.toScreen(24, 24), x = s.x, y = s.y;
    // 하단 수반
    c.fillStyle = '#CBBFA8'; c.beginPath(); c.ellipse(x, y + 2, 56, 28, 0, 0, TAU); c.fill();
    c.fillStyle = '#B8AB92'; c.beginPath(); c.ellipse(x, y - 1, 52, 25, 0, 0, TAU); c.fill();
    c.fillStyle = '#DED3BC'; c.beginPath(); c.ellipse(x, y - 4, 50, 24, 0, 0, TAU); c.fill();
    // 물
    c.fillStyle = '#79C6E3'; c.beginPath(); c.ellipse(x, y - 4, 43, 20, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for (var i = 0; i < 6; i++) {
      var a = t * 0.7 + i * (TAU / 6);
      c.beginPath(); c.ellipse(x + Math.cos(a) * 26, y - 4 + Math.sin(a) * 11, 5, 2, 0, 0, TAU); c.fill();
    }
    // 기둥 + 상단 수반
    c.fillStyle = '#C9BCA2'; c.fillRect(x - 5, y - 34, 10, 30);
    c.fillStyle = '#DED3BC'; c.beginPath(); c.ellipse(x, y - 34, 22, 10, 0, 0, TAU); c.fill();
    c.fillStyle = '#8FD0E8'; c.beginPath(); c.ellipse(x, y - 35, 17, 7, 0, 0, TAU); c.fill();
    c.fillStyle = '#C9BCA2'; c.fillRect(x - 2.5, y - 52, 5, 18);
    // 분수 물줄기
    c.strokeStyle = 'rgba(160,220,245,0.85)'; c.lineWidth = 2.4; c.lineCap = 'round';
    for (i = 0; i < 5; i++) {
      var ph = (t * 1.4 + i / 5) % 1;
      var dir = (i % 2 ? 1 : -1) * (0.5 + (i % 3) * 0.35);
      c.beginPath(); c.moveTo(x, y - 52);
      c.quadraticCurveTo(x + dir * 14, y - 60, x + dir * 22, y - 38 + ph * 4);
      c.stroke();
    }
    // 물방울
    c.fillStyle = 'rgba(200,235,250,0.9)';
    for (i = 0; i < 7; i++) {
      var pp = (t * 1.1 + i / 7) % 1;
      var dx = Math.sin(i * 2.4) * 30 * pp;
      c.beginPath(); c.arc(x + dx, y - 50 + pp * pp * 46, 1.8 * (1 - pp * 0.5), 0, TAU); c.fill();
    }
  }

  function drawBoard(c, t, sx, sy) {
    drawShadowE(c, sx, sy, 20, 7);
    c.fillStyle = '#8A6844';
    c.fillRect(sx - 17, sy - 40, 4.5, 40); c.fillRect(sx + 12.5, sy - 40, 4.5, 40);
    c.fillStyle = '#A5804F'; c.beginPath();
    if (c.roundRect) c.roundRect(sx - 24, sy - 62, 48, 30, 4); else c.rect(sx - 24, sy - 62, 48, 30);
    c.fill();
    c.fillStyle = '#E8D9B8'; c.fillRect(sx - 20, sy - 58, 40, 22);
    c.fillStyle = '#F7F1DF'; c.fillRect(sx - 16, sy - 55, 12, 14);
    c.fillStyle = '#F2E3E8'; c.fillRect(sx - 1, sy - 54, 14, 10);
    c.strokeStyle = '#B5A585'; c.lineWidth = 1;
    c.strokeRect(sx - 16, sy - 55, 12, 14); c.strokeRect(sx - 1, sy - 54, 14, 10);
    c.fillStyle = '#C9707E'; c.beginPath(); c.arc(sx - 10, sy - 53.5, 1.5, 0, TAU); c.fill();
    c.beginPath(); c.arc(sx + 6, sy - 52.5, 1.5, 0, TAU); c.fill();
  }

  function drawLamp(c, t, sx, sy) {
    drawShadowE(c, sx, sy, 8, 3.5);
    c.strokeStyle = '#5F6B70'; c.lineWidth = 3.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 46); c.stroke();
    c.fillStyle = '#5F6B70'; c.beginPath(); c.ellipse(sx, sy, 5, 2.4, 0, 0, TAU); c.fill();
    var glow = 0.55 + Math.sin(t * 2.3 + sx) * 0.1;
    var g = c.createRadialGradient(sx, sy - 50, 1, sx, sy - 50, 14);
    g.addColorStop(0, 'rgba(255,225,150,' + glow + ')'); g.addColorStop(1, 'rgba(255,225,150,0)');
    c.fillStyle = g; c.beginPath(); c.arc(sx, sy - 50, 14, 0, TAU); c.fill();
    c.fillStyle = '#FFE59C'; c.beginPath(); c.arc(sx, sy - 50, 5, 0, TAU); c.fill();
    c.strokeStyle = '#5F6B70'; c.lineWidth = 1.6;
    c.beginPath(); c.arc(sx, sy - 50, 6.2, 0, TAU); c.stroke();
  }

  function drawCherry(c, t, sx, sy, seed) {
    var sw = Math.sin(t * 1.1 + seed * 7) * 2;
    drawShadowE(c, sx, sy, 24, 9);
    // 줄기
    c.fillStyle = '#7A5A40';
    c.beginPath();
    c.moveTo(sx - 4.5, sy); c.lineTo(sx + 4.5, sy);
    c.lineTo(sx + 2.5 + sw * 0.3, sy - 34); c.lineTo(sx - 2.5 + sw * 0.3, sy - 34);
    c.closePath(); c.fill();
    c.strokeStyle = '#7A5A40'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(sx + sw * 0.3, sy - 26); c.lineTo(sx + 12 + sw, sy - 40); c.stroke();
    // 벚꽃 캐노피
    var petals = ['#F7C6DA', '#FADCE8', '#F2AECB'];
    var blobs = [[0, -52, 20], [-16, -44, 14], [16, -45, 15], [-8, -60, 13], [10, -58, 12]];
    for (var i = 0; i < blobs.length; i++) {
      c.fillStyle = petals[i % 3];
      c.beginPath(); c.arc(sx + blobs[i][0] + sw, sy + blobs[i][1], blobs[i][2], 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,0.5)';
    for (i = 0; i < 6; i++) {
      var h = ISO.hash(seed * 31 + i, i);
      c.beginPath(); c.arc(sx + (h - 0.5) * 46 + sw, sy - 42 - h * 20, 2, 0, TAU); c.fill();
    }
  }

  function drawBench(c, t, sx, sy) {
    drawShadowE(c, sx, sy + 2, 24, 8);
    // 아이소 방향 벤치 (x축 방향)
    var ax = HW * 0.72, ay = HH * 0.72; // 절반 길이 벡터 (x축)
    var bx = -HW * 0.2, by = HH * 0.2;  // 폭 벡터 (y축)
    var h = 12;
    function quad(ox, oy, col) {
      c.fillStyle = col; c.beginPath();
      c.moveTo(sx - ax + bx + ox, sy - ay + by + oy);
      c.lineTo(sx + ax + bx + ox, sy + ay + by + oy);
      c.lineTo(sx + ax - bx + ox, sy + ay - by + oy);
      c.lineTo(sx - ax - bx + ox, sy - ay - by + oy);
      c.closePath(); c.fill();
    }
    c.strokeStyle = '#6E5138'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(sx - ax * 0.7, sy - ay * 0.7 - h); c.lineTo(sx - ax * 0.7, sy - ay * 0.7); c.stroke();
    c.beginPath(); c.moveTo(sx + ax * 0.7, sy + ay * 0.7 - h); c.lineTo(sx + ax * 0.7, sy + ay * 0.7); c.stroke();
    quad(0, -h, '#B98E5C');
    c.strokeStyle = 'rgba(110,81,56,0.5)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(sx - ax + bx * 0.2, sy - ay + by * 0.2 - h); c.lineTo(sx + ax + bx * 0.2, sy + ay + by * 0.2 - h); c.stroke();
    // 등받이
    c.fillStyle = '#A57D4E';
    c.beginPath();
    c.moveTo(sx - ax - bx, sy - ay - by - h);
    c.lineTo(sx + ax - bx, sy + ay - by - h);
    c.lineTo(sx + ax - bx, sy + ay - by - h - 12);
    c.lineTo(sx - ax - bx, sy - ay - by - h - 12);
    c.closePath(); c.fill();
  }

  function drawFlowerbed(c, t, sx, sy, seed) {
    c.fillStyle = '#8A6A48'; c.beginPath(); c.ellipse(sx, sy, 20, 9, 0, 0, TAU); c.fill();
    c.fillStyle = '#77B85C'; c.beginPath(); c.ellipse(sx, sy - 1.5, 18, 7.5, 0, 0, TAU); c.fill();
    var cols = ['#F2688C', '#F5C542', '#F08A5C', '#C77DD9', '#FFFFFF'];
    for (var i = 0; i < 9; i++) {
      var h1 = ISO.hash(seed + i, i * 3), h2 = ISO.hash(i, seed * 5 + i);
      var fx = sx + (h1 - 0.5) * 30, fy = sy - 2 + (h2 - 0.5) * 10;
      c.fillStyle = cols[i % cols.length];
      c.beginPath(); c.arc(fx, fy - 3, 2.4, 0, TAU); c.fill();
      c.fillStyle = '#5E9C48'; c.fillRect(fx - 0.6, fy - 2, 1.2, 4);
    }
  }

  function drawRock(c, t, sx, sy, s) {
    drawShadowE(c, sx, sy + 1, 12 * s, 5 * s);
    c.fillStyle = '#9AA0A4';
    c.beginPath();
    c.moveTo(sx - 11 * s, sy - 1);
    c.lineTo(sx - 6 * s, sy - 12 * s); c.lineTo(sx + 3 * s, sy - 15 * s);
    c.lineTo(sx + 11 * s, sy - 5 * s); c.lineTo(sx + 8 * s, sy + 2 * s);
    c.lineTo(sx - 7 * s, sy + 2.5 * s);
    c.closePath(); c.fill();
    c.fillStyle = '#B7BDC0';
    c.beginPath(); c.moveTo(sx - 6 * s, sy - 12 * s); c.lineTo(sx + 3 * s, sy - 15 * s); c.lineTo(sx + 5 * s, sy - 6 * s); c.lineTo(sx - 4 * s, sy - 4 * s); c.closePath(); c.fill();
  }

  function drawOnsenPool(c, t) {
    var s = ISO.toScreen(33, 34), x = s.x, y = s.y;
    // 돌 테두리
    for (var i = 0; i < 14; i++) {
      var a = (i / 14) * TAU;
      var rx = Math.cos(a) * 112, ry = Math.sin(a) * 44;
      c.fillStyle = i % 2 ? '#A8A099' : '#948C85';
      c.beginPath(); c.ellipse(x + rx, y + ry * 0.62 - 3, 10, 6.5, 0, 0, TAU); c.fill();
      c.fillStyle = i % 2 ? '#C4BCB4' : '#B2AAA2';
      c.beginPath(); c.ellipse(x + rx, y + ry * 0.62 - 5.5, 9, 5.5, 0, 0, TAU); c.fill();
    }
    // 김 파티클
    for (i = 0; i < 8; i++) {
      var p = (t * 0.16 + i / 8) % 1;
      var ox = Math.sin(i * 2.7) * 58 + Math.sin(t * 0.8 + i) * 7;
      var al = Math.sin(p * Math.PI) * 0.34;
      c.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
      c.beginPath(); c.arc(x + ox, y - 8 - p * 52, 7 + p * 9, 0, TAU); c.fill();
    }
  }

  function drawLantern(c, t, sx, sy) {
    drawShadowE(c, sx, sy, 9, 4);
    c.fillStyle = '#8E8A84';
    c.fillRect(sx - 3, sy - 20, 6, 20);
    c.beginPath(); c.ellipse(sx, sy - 20, 8, 3.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#A5A19B'; c.fillRect(sx - 5.5, sy - 30, 11, 10);
    c.fillStyle = '#FFD98C'; c.fillRect(sx - 3.2, sy - 28.5, 6.4, 7);
    c.fillStyle = '#8E8A84';
    c.beginPath(); c.moveTo(sx - 9, sy - 30); c.lineTo(sx + 9, sy - 30); c.lineTo(sx, sy - 38); c.closePath(); c.fill();
  }

  function drawFence(c, t, sx, sy) {
    // 대나무 울타리 한 칸 (x축 방향)
    var ax = HW * 0.9, ay = HH * 0.9;
    c.strokeStyle = '#B0894E'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx - ax, sy - ay); c.lineTo(sx - ax, sy - ay - 22); c.stroke();
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 22); c.stroke();
    c.beginPath(); c.moveTo(sx + ax, sy + ay); c.lineTo(sx + ax, sy + ay - 22); c.stroke();
    c.strokeStyle = '#C79A5B'; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(sx - ax, sy - ay - 18); c.lineTo(sx + ax, sy + ay - 18); c.stroke();
    c.beginPath(); c.moveTo(sx - ax, sy - ay - 9); c.lineTo(sx + ax, sy + ay - 9); c.stroke();
  }

  function drawReed(c, t, sx, sy, seed) {
    var sw = Math.sin(t * 1.6 + seed * 9) * 2.5;
    c.strokeStyle = '#5E8C4A'; c.lineWidth = 1.8; c.lineCap = 'round';
    for (var i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(sx + i * 4, sy);
      c.quadraticCurveTo(sx + i * 5, sy - 12, sx + i * 6 + sw, sy - 24 - Math.abs(i) * -4);
      c.stroke();
    }
    c.fillStyle = '#8A6842';
    c.beginPath(); c.ellipse(sx + sw, sy - 26, 2.4, 6, 0.1, 0, TAU); c.fill();
  }

  function drawBoat(c, t) {
    var s = ISO.toScreen(11.5, 36.2);
    var bo = Math.sin(t * 1.3) * 2;
    var x = s.x, y = s.y + bo;
    c.fillStyle = 'rgba(40,80,110,0.2)';
    c.beginPath(); c.ellipse(x, s.y + 4, 26, 9, 0, 0, TAU); c.fill();
    // 백조 보트
    c.fillStyle = '#F7F4EE';
    c.beginPath(); c.ellipse(x, y - 8, 22, 11, 0, 0, TAU); c.fill();
    c.fillStyle = '#E8E2D6';
    c.beginPath(); c.ellipse(x - 2, y - 14, 13, 7, 0, 0, TAU); c.fill();
    c.strokeStyle = '#F7F4EE'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x + 16, y - 12); c.quadraticCurveTo(x + 26, y - 24, x + 22, y - 30); c.stroke();
    c.fillStyle = '#F7F4EE'; c.beginPath(); c.arc(x + 22, y - 31, 5, 0, TAU); c.fill();
    c.fillStyle = '#F0A030';
    c.beginPath(); c.moveTo(x + 26, y - 32); c.lineTo(x + 32, y - 30); c.lineTo(x + 26, y - 28.5); c.closePath(); c.fill();
    c.fillStyle = '#33302C'; c.beginPath(); c.arc(x + 23.5, y - 32, 1.2, 0, TAU); c.fill();
  }

  function drawSign(c, t, sx, sy, label) {
    drawShadowE(c, sx, sy, 10, 4);
    c.strokeStyle = '#8A6844'; c.lineWidth = 3.4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx, sy - 26); c.stroke();
    c.fillStyle = '#B98E5C';
    c.beginPath();
    if (c.roundRect) c.roundRect(sx - 15, sy - 40, 30, 17, 3); else c.rect(sx - 15, sy - 40, 30, 17);
    c.fill();
    c.fillStyle = '#5C4630'; c.font = '11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, sx, sy - 31.5);
  }

  function drawParasol(c, t, sx, sy) {
    drawShadowE(c, sx, sy, 16, 6);
    // 테이블
    c.fillStyle = '#8A7050'; c.fillRect(sx - 2, sy - 14, 4, 14);
    c.fillStyle = '#D9C9A8'; c.beginPath(); c.ellipse(sx, sy - 14, 13, 6, 0, 0, TAU); c.fill();
    // 파라솔
    c.strokeStyle = '#9C8258'; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(sx, sy - 14); c.lineTo(sx, sy - 42); c.stroke();
    for (var i = 0; i < 6; i++) {
      c.fillStyle = i % 2 ? '#F2708E' : '#FFF4E8';
      var a0 = Math.PI + (i / 6) * Math.PI, a1 = Math.PI + ((i + 1) / 6) * Math.PI;
      c.beginPath(); c.moveTo(sx, sy - 42);
      c.lineTo(sx + Math.cos(a0) * 22, sy - 36 + Math.sin(a0) * 8);
      c.lineTo(sx + Math.cos(a1) * 22, sy - 36 + Math.sin(a1) * 8);
      c.closePath(); c.fill();
    }
  }

  function drawBush(c, t, sx, sy, seed) {
    drawShadowE(c, sx, sy + 1, 13, 5);
    c.fillStyle = '#6FA854'; c.beginPath(); c.arc(sx - 6, sy - 6, 8, 0, TAU); c.fill();
    c.fillStyle = '#7FB863'; c.beginPath(); c.arc(sx + 5, sy - 7, 8.5, 0, TAU); c.fill();
    c.fillStyle = '#8CC470'; c.beginPath(); c.arc(sx - 1, sy - 11, 7.5, 0, TAU); c.fill();
    if (ISO.hash(seed, 3) > 0.5) {
      c.fillStyle = '#E86A80';
      c.beginPath(); c.arc(sx + 3, sy - 12, 1.8, 0, TAU); c.fill();
      c.beginPath(); c.arc(sx - 6, sy - 8, 1.8, 0, TAU); c.fill();
    }
  }

  // 카페 건물 (아이소 박스 + 차양)
  function drawBuilding(c, b, t) {
    var A = ISO.toScreen(b.x - 0.5, b.y - 0.5);          // 북(위) 꼭짓점
    var B = ISO.toScreen(b.x + b.w - 0.5, b.y - 0.5);    // 동
    var C2 = ISO.toScreen(b.x + b.w - 0.5, b.y + b.d - 0.5); // 남(앞)
    var D = ISO.toScreen(b.x - 0.5, b.y + b.d - 0.5);    // 서
    var h = b.h;
    function face(p1, p2, col) {
      c.fillStyle = col; c.beginPath();
      c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y);
      c.lineTo(p2.x, p2.y - h); c.lineTo(p1.x, p1.y - h);
      c.closePath(); c.fill();
    }
    // 벽: 앞(남서) 면 = D→C2, 옆(남동) 면 = C2→B
    face(D, C2, b.wall);
    face(C2, B, ISO.shade(b.wall, -0.16));
    // 지붕 (살짝 돌출)
    var ov = 1.12;
    var mx = (A.x + C2.x) / 2, my = (A.y + C2.y) / 2 - h;
    c.fillStyle = b.roof;
    c.beginPath();
    c.moveTo(mx + (A.x - mx) * ov, my + (A.y - (my + h)) * ov);
    c.lineTo(mx + (B.x - mx) * ov, my + (B.y - (my + h)) * ov);
    c.lineTo(mx + (C2.x - mx) * ov, my + (C2.y - (my + h)) * ov);
    c.lineTo(mx + (D.x - mx) * ov, my + (D.y - (my + h)) * ov);
    c.closePath(); c.fill();
    // 지붕 캡
    c.fillStyle = ISO.shade(b.roof, 0.18);
    c.beginPath();
    c.moveTo(mx + (A.x - mx) * 0.55, my - 7 + (A.y - (my + h)) * 0.55);
    c.lineTo(mx + (B.x - mx) * 0.55, my - 7 + (B.y - (my + h)) * 0.55);
    c.lineTo(mx + (C2.x - mx) * 0.55, my - 7 + (C2.y - (my + h)) * 0.55);
    c.lineTo(mx + (D.x - mx) * 0.55, my - 7 + (D.y - (my + h)) * 0.55);
    c.closePath(); c.fill();
    // 굴뚝 (온기)
    if (b.chimney) {
      c.fillStyle = ISO.shade(b.wall, -0.28);
      c.fillRect(mx + 10, my - 22, 8, 16);
      c.fillStyle = 'rgba(255,255,255,0.35)';
      var p = (t * 0.3) % 1;
      c.beginPath(); c.arc(mx + 14 + Math.sin(t) * 3, my - 26 - p * 16, 4 + p * 3, 0, TAU); c.fill();
    }
    // 앞면(남서)에 문/창/차양
    var fx = (D.x + C2.x) / 2, fy = (D.y + C2.y) / 2;
    // 문
    c.fillStyle = ISO.shade(b.wall, -0.35);
    c.beginPath();
    if (c.roundRect) c.roundRect(fx - 7, fy - 24, 14, 22, [7, 7, 0, 0]); else c.rect(fx - 7, fy - 24, 14, 22);
    c.fill();
    c.fillStyle = '#FFE9B0'; c.beginPath(); c.arc(fx + 4, fy - 13, 1.6, 0, TAU); c.fill();
    // 창 (옆면)
    var wx2 = (C2.x + B.x) / 2, wy2 = (C2.y + B.y) / 2;
    c.fillStyle = '#FFEFC2';
    c.beginPath();
    if (c.roundRect) c.roundRect(wx2 - 8, wy2 - h * 0.62, 16, 13, 3); else c.rect(wx2 - 8, wy2 - h * 0.62, 16, 13);
    c.fill();
    c.strokeStyle = ISO.shade(b.wall, -0.3); c.lineWidth = 1.4;
    c.strokeRect(wx2 - 8, wy2 - h * 0.62, 16, 13);
    c.beginPath(); c.moveTo(wx2, wy2 - h * 0.62); c.lineTo(wx2, wy2 - h * 0.62 + 13); c.stroke();
    // 줄무늬 차양 (앞면 위)
    var n = 6;
    for (var i = 0; i < n; i++) {
      var t0 = i / n, t1 = (i + 1) / n;
      var x0 = D.x + (C2.x - D.x) * t0, y0 = D.y + (C2.y - D.y) * t0 - h + 10;
      var x1 = D.x + (C2.x - D.x) * t1, y1 = D.y + (C2.y - D.y) * t1 - h + 10;
      c.fillStyle = i % 2 ? b.awning : '#FFF8EC';
      c.beginPath();
      c.moveTo(x0, y0); c.lineTo(x1, y1);
      c.lineTo(x1 - 9, y1 + 9); c.lineTo(x0 - 9, y0 + 9);
      c.closePath(); c.fill();
      c.beginPath(); c.arc((x0 + x1) / 2 - 9, (y0 + y1) / 2 + 9, 4.5, 0, Math.PI); c.fill();
    }
    // 간판 (이모지는 작은 악센트)
    c.fillStyle = 'rgba(255,253,246,0.95)';
    c.beginPath(); c.arc(fx, fy - h + 2, 9, 0, TAU); c.fill();
    c.strokeStyle = ISO.shade(b.wall, -0.3); c.lineWidth = 1.5;
    c.beginPath(); c.arc(fx, fy - h + 2, 9, 0, TAU); c.stroke();
    c.font = '10px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(b.icon, fx, fy - h + 3);
  }

  function drawDockPosts(c, t) {
    for (var x = 11; x <= 17; x += 2) {
      var s1 = ISO.toScreen(x, 32.45), s2 = ISO.toScreen(x, 33.55);
      [s1, s2].forEach(function (s) {
        c.fillStyle = '#8A6640';
        c.fillRect(s.x - 2.2, s.y - 10, 4.4, 12);
        c.fillStyle = '#A57C4E';
        c.beginPath(); c.ellipse(s.x, s.y - 10, 2.2, 1.2, 0, 0, TAU); c.fill();
      });
    }
  }

  // ── 소품 배치 ─────────────────────────
  function buildProps() {
    // 광장
    addProp(24, 24, 2.6, drawFountain, 26);
    addProp(21, 21.2, 0.8, function (c, t, sx, sy) { drawBoard(c, t, sx, sy); });
    addProp(27.5, 20.5, 0.5, function (c, t, sx, sy) { drawLamp(c, t, sx, sy); });
    addProp(20.5, 27.5, 0.5, function (c, t, sx, sy) { drawLamp(c, t, sx, sy); });
    addProp(27.5, 27.5, 0.5, function (c, t, sx, sy) { drawLamp(c, t, sx, sy); });
    addProp(20.5, 20, 0.5, function (c, t, sx, sy) { drawLamp(c, t, sx, sy); });
    addProp(26.8, 22.2, 0.9, function (c, t, sx, sy) { drawFlowerbed(c, t, sx, sy, 1); });
    addProp(21.5, 25.8, 0.9, function (c, t, sx, sy) { drawFlowerbed(c, t, sx, sy, 2); });

    // 벚꽃 공원
    var trees = [[11.5, 12], [16, 10.5], [19.5, 13], [10.5, 17.5], [13, 19.5], [18.5, 18], [15, 15.8], [9.5, 14]];
    trees.forEach(function (pt, i) {
      addProp(pt[0], pt[1], 0.7, function (c, t, sx, sy) { drawCherry(c, t, sx, sy, i + 1); });
    });
    addProp(17, 13.2, 0.9, function (c, t, sx, sy) { drawBench(c, t, sx, sy); });
    addProp(12.5, 16, 0.9, function (c, t, sx, sy) { drawBench(c, t, sx, sy); });
    addProp(14.5, 12.6, 0.8, function (c, t, sx, sy) { drawFlowerbed(c, t, sx, sy, 3); });

    // 반짝 호수
    addProp(18.6, 30.6, 0.4, function (c, t, sx, sy) { drawReed(c, t, sx, sy, 1); });
    addProp(10.2, 29.2, 0.4, function (c, t, sx, sy) { drawReed(c, t, sx, sy, 2); });
    addProp(18.8, 35.8, 0.4, function (c, t, sx, sy) { drawReed(c, t, sx, sy, 3); });
    addProp(19.6, 33.2, 0.5, function (c, t, sx, sy) { drawSign(c, t, sx, sy, '낚시터'); });
    addProp(11.5, 36.2, 0, function (c, t) { drawBoat(c, t); }, 0);
    props.push({ x: 14, y: 33, r: 0, sx: ISO.toScreen(14, 33).x, sy: ISO.toScreen(14, 33).y, sortY: ISO.toScreen(14, 33).y - 14, draw: function (c, t) { drawDockPosts(c, t); } });

    // 카페 거리 — 건물 3채 (거리 북쪽)
    addBuilding({ x: 28, y: 11, w: 3, d: 2, h: 52, wall: '#F5E3D0', roof: '#D9736E', awning: '#E88A9E', icon: '☕', chimney: true, name: '보송 카페' });
    addBuilding({ x: 33, y: 11, w: 3, d: 2, h: 46, wall: '#CFE0D2', roof: '#6E8C74', awning: '#7FA886', icon: '🛒', name: '너굴 상점' });
    addBuilding({ x: 37, y: 12, w: 2, d: 2, h: 42, wall: '#F5EBCE', roof: '#D9A253', awning: '#E8B86A', icon: '🥐', name: '빵집' });
    addProp(30, 15.6, 0.8, function (c, t, sx, sy) { drawParasol(c, t, sx, sy); });
    addProp(35.5, 15.8, 0.8, function (c, t, sx, sy) { drawParasol(c, t, sx, sy); });
    addProp(26.2, 16.8, 0.6, function (c, t, sx, sy) { drawBush(c, t, sx, sy, 4); });
    addProp(39.5, 15.5, 0.6, function (c, t, sx, sy) { drawBush(c, t, sx, sy, 5); });

    // 온천 마을
    props.push({ x: 33, y: 34, r: 0, sx: ISO.toScreen(33, 34).x, sy: ISO.toScreen(33, 34).y, sortY: ISO.toScreen(33, 34).y - 30, draw: function (c, t) { drawOnsenPool(c, t); } });
    addProp(29.2, 30.4, 0.5, function (c, t, sx, sy) { drawLantern(c, t, sx, sy); });
    addProp(36.8, 30.6, 0.5, function (c, t, sx, sy) { drawLantern(c, t, sx, sy); });
    addProp(31, 38.2, 0.7, function (c, t, sx, sy) { drawRock(c, t, sx, sy, 1); });
    addProp(36.5, 37.6, 0.7, function (c, t, sx, sy) { drawRock(c, t, sx, sy, 0.75); });
    addProp(33.5, 29.2, 0.8, function (c, t, sx, sy) { drawFence(c, t, sx, sy); });
    addProp(35.7, 30.3, 0.8, function (c, t, sx, sy) { drawFence(c, t, sx, sy); });
    addProp(38.5, 34.5, 0.5, function (c, t, sx, sy) { drawSign(c, t, sx, sy, '온천'); });

    // 들판 곳곳 부시/바위
    var deco = [[22, 12], [24, 36.5], [40, 22], [8, 22], [22, 40], [40.5, 27], [7.5, 26], [24, 8.5], [30, 40.5]];
    deco.forEach(function (pt, i) {
      if (typeAt(Math.round(pt[0]), Math.round(pt[1])) !== T.GRASS) return;
      if (i % 3 === 2) addProp(pt[0], pt[1], 0.6, function (c, t, sx, sy) { drawRock(c, t, sx, sy, 0.8); });
      else addProp(pt[0], pt[1], 0.55, function (c, t, sx, sy) { drawBush(c, t, sx, sy, i + 10); });
    });
  }

  // ── 타일 렌더 ─────────────────────────
  var TILE_BASE = {};
  TILE_BASE[T.GRASS] = '#8CC96B';
  TILE_BASE[T.PLAZA] = '#DCCFB6';
  TILE_BASE[T.PATH] = '#E3C globalThis'; // placeholder(아래에서 재설정)
  TILE_BASE[T.PATH] = '#E0C28C';
  TILE_BASE[T.WATER] = '#57B4DC';
  TILE_BASE[T.SAND] = '#EDDCA6';
  TILE_BASE[T.DOCK] = '#BE8E5B';
  TILE_BASE[T.SPRING_ST] = '#CFC6B6';
  TILE_BASE[T.SPRING_W] = '#8FD8CC';
  TILE_BASE[T.PAVE] = '#DDBD9C';

  function nearZone(x, y, z, r) {
    var p = ZONE_POS[z]; return Math.hypot(x - p.x, y - p.y) < r;
  }

  function drawTile(c, x, y, t) {
    var tp = grid[idx(x, y)];
    if (tp === T.VOID) return;
    var s = ISO.toScreen(x, y);
    var h = ISO.hash(x, y);
    var col = TILE_BASE[tp];
    var v = (h - 0.5) * 0.09;
    if (tp === T.PLAZA || tp === T.PAVE) v = ((x + y) % 2 ? 0.045 : -0.03) + (h - 0.5) * 0.03;
    if (tp === T.GRASS && nearZone(x, y, 'park', 9)) col = '#97CE79'; // 공원 잔디 톤
    ISO.diamondPath(c, s.x, s.y, HW, HH);
    c.fillStyle = ISO.shade(col, v);
    c.fill();

    if (tp === T.WATER || tp === T.SPRING_W) {
      // 물 깊이감 + 반짝임
      ISO.diamondPath(c, s.x, s.y, HW * 0.94, HH * 0.94);
      c.fillStyle = ISO.shade(col, -0.06 + Math.sin(t * 1.2 + x * 1.7 + y * 2.3) * 0.05);
      c.fill();
      if (h > 0.55) {
        var tw = 0.5 + Math.sin(t * 2.2 + h * 40) * 0.5;
        c.fillStyle = 'rgba(255,255,255,' + (tw * (tp === T.WATER ? 0.55 : 0.4)).toFixed(3) + ')';
        var ox = (h - 0.5) * 40, oy = (ISO.hash(y, x) - 0.5) * 16;
        c.beginPath(); c.ellipse(s.x + ox, s.y + oy, 3.2, 1.1, 0, 0, TAU); c.fill();
      }
      if (tp === T.SPRING_W && h > 0.72) {
        c.fillStyle = 'rgba(255,255,255,0.25)';
        c.beginPath(); c.ellipse(s.x + (h - 0.5) * 30, s.y, 6, 2.4, 0, 0, TAU); c.fill();
      }
    } else if (tp === T.GRASS) {
      if (h > 0.82) { // 풀잎
        c.strokeStyle = 'rgba(70,130,60,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(s.x + (h - 0.9) * 30, s.y + 2); c.lineTo(s.x + (h - 0.9) * 30 - 1.5, s.y - 3); c.stroke();
        c.beginPath(); c.moveTo(s.x + (h - 0.9) * 30 + 2.5, s.y + 2); c.lineTo(s.x + (h - 0.9) * 30 + 3.5, s.y - 2.5); c.stroke();
      }
      // 공원 근처 떨어진 꽃잎
      if (nearZone(x, y, 'park', 8.5) && h > 0.55) {
        c.fillStyle = 'rgba(247,198,218,0.9)';
        c.beginPath(); c.ellipse(s.x + (h - 0.7) * 40, s.y + (ISO.hash(y * 3, x) - 0.5) * 12, 2, 1.1, h * 6, 0, TAU); c.fill();
      }
    } else if (tp === T.DOCK) {
      c.strokeStyle = 'rgba(120,80,45,0.55)'; c.lineWidth = 1.2;
      for (var k = -2; k <= 2; k++) {
        c.beginPath();
        c.moveTo(s.x + k * 11 - HW * 0.28, s.y + k * 5.5 + HH * 0.28 - 8 * 0);
        c.lineTo(s.x + k * 11 + HW * 0.28, s.y + k * 5.5 - HH * 0.28);
        c.stroke();
      }
    } else if (tp === T.SAND && h > 0.75) {
      c.fillStyle = 'rgba(200,170,110,0.6)';
      c.beginPath(); c.arc(s.x + (h - 0.85) * 30, s.y, 1.4, 0, TAU); c.fill();
    } else if (tp === T.PATH && h > 0.7) {
      c.fillStyle = 'rgba(160,125,80,0.4)';
      c.beginPath(); c.ellipse(s.x + (h - 0.85) * 30, s.y + (h - 0.75) * 10, 2.6, 1.3, 0, 0, TAU); c.fill();
    }
  }

  // 섬 가장자리 흙 단면
  function drawCliff(c, x, y) {
    var tp = grid[idx(x, y)];
    if (tp === T.VOID) return;
    var s = ISO.toScreen(x, y);
    var D = 34 + ISO.hash(x, y) * 10;
    var seR = typeAt(x + 1, y) === T.VOID; // 남동면 노출
    var swR = typeAt(x, y + 1) === T.VOID; // 남서면 노출
    if (!seR && !swR) return;
    var topCol = tp === T.WATER ? '#8A7048' : '#96714C';
    if (swR) { // 왼쪽(남서) 면: (-HW,0) → (0,HH)
      c.fillStyle = '#8A6845';
      c.beginPath();
      c.moveTo(s.x - HW, s.y); c.lineTo(s.x, s.y + HH);
      c.lineTo(s.x, s.y + HH + D); c.lineTo(s.x - HW, s.y + D);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(60,40,25,0.28)';
      c.beginPath();
      c.moveTo(s.x - HW, s.y + D * 0.55); c.lineTo(s.x, s.y + HH + D * 0.55);
      c.lineTo(s.x, s.y + HH + D); c.lineTo(s.x - HW, s.y + D);
      c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,235,190,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(s.x - HW, s.y + 3); c.lineTo(s.x, s.y + HH + 3); c.stroke();
      c.fillStyle = topCol;
      c.beginPath(); c.moveTo(s.x - HW, s.y); c.lineTo(s.x, s.y + HH);
      c.lineTo(s.x, s.y + HH + 5); c.lineTo(s.x - HW, s.y + 5); c.closePath(); c.fill();
    }
    if (seR) { // 오른쪽(남동) 면: (0,HH) → (HW,0)
      c.fillStyle = '#7A5A3B';
      c.beginPath();
      c.moveTo(s.x, s.y + HH); c.lineTo(s.x + HW, s.y);
      c.lineTo(s.x + HW, s.y + D); c.lineTo(s.x, s.y + HH + D);
      c.closePath(); c.fill();
      c.fillStyle = 'rgba(50,32,20,0.3)';
      c.beginPath();
      c.moveTo(s.x, s.y + HH + D * 0.55); c.lineTo(s.x + HW, s.y + D * 0.55);
      c.lineTo(s.x + HW, s.y + D); c.lineTo(s.x, s.y + HH + D);
      c.closePath(); c.fill();
      c.fillStyle = ISO.shade(topCol, -0.15);
      c.beginPath(); c.moveTo(s.x, s.y + HH); c.lineTo(s.x + HW, s.y);
      c.lineTo(s.x + HW, s.y + 5); c.lineTo(s.x, s.y + HH + 5); c.closePath(); c.fill();
    }
  }

  // ── 이동 가능 판정 ─────────────────────────
  function walkable(x, y) {
    var gx = Math.round(x), gy = Math.round(y);
    var tp = typeAt(gx, gy);
    if (!WALKABLE[tp]) return false;
    if (blocked[idx(gx, gy)]) return false;
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      if (p.r > 0) {
        var dx = x - p.x, dy = y - p.y;
        if (dx * dx + dy * dy < (p.r + 0.28) * (p.r + 0.28)) return false;
      }
    }
    return true;
  }

  function zoneAt(x, y) {
    var best = null, bd = 1e9;
    for (var id in ZONE_POS) {
      var p = ZONE_POS[id];
      var d = Math.hypot(x - p.x, y - p.y);
      if (d < p.r && d < bd) { bd = d; best = id; }
    }
    return best;
  }

  buildMap();
  buildProps();

  window.AVWorld = {
    T: T, SIZE: SIZE, ZONE_POS: ZONE_POS,
    typeAt: typeAt, walkable: walkable, zoneAt: zoneAt,
    props: props,
    drawTile: drawTile, drawCliff: drawCliff,
  };
})();

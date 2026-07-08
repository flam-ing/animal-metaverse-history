// ANIMALVERSE 2d-iso — 동물 미니 피규어 (3/4 시점, 발밑 원점, 위가 -y)
// 플레이어 20종 + NPC 8종 전부 코드로 그린다. 외부 에셋 없음.
(function () {
  'use strict';
  var TAU = Math.PI * 2;

  // ── 프리미티브 헬퍼 ─────────────────────────
  function C(c, x, y, r, f) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = f; c.fill(); }
  function E(c, x, y, rx, ry, f, rot) {
    c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); c.fillStyle = f; c.fill();
  }
  function L(c, x0, y0, x1, y1, w, col) {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  }
  function P(c, pts, f) {
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath(); c.fillStyle = f; c.fill();
  }
  function arc(c, x, y, r, a0, a1, w, col) {
    c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y, r, a0, a1); c.stroke();
  }
  // 눈 (주기적 깜빡임)
  function eye(c, x, y, r, col, o, seed) {
    var b = ((o.t * 0.55 + (seed || 0)) % 3.7);
    if (b < 0.09) L(c, x - r - 0.5, y, x + r + 0.5, y, 1.5, col);
    else { C(c, x, y, r, col); C(c, x + r * 0.35, y - r * 0.35, r * 0.32, '#ffffff'); }
  }
  function eyes2(c, dx, y, r, col, o) { eye(c, -dx, y, r, col, o, 0); eye(c, dx, y, r, col, o, 0); }

  // 걷기 스윙/바운스
  function swing(o) { return Math.sin(o.ph) * o.walk; }
  function bobOf(o) { return -Math.abs(Math.sin(o.ph)) * 1.8 * o.walk + Math.sin(o.t * 2.4) * 0.6; }

  // 표준 2족 다리
  function legs(c, o, col, opt) {
    opt = opt || {};
    var x = opt.x != null ? opt.x : 4.5, top = opt.top != null ? opt.top : -13;
    var w = opt.w != null ? opt.w : 5;
    var s = swing(o) * (opt.stride != null ? opt.stride : 4);
    var lift1 = Math.max(0, Math.sin(o.ph)) * 3 * o.walk;
    var lift2 = Math.max(0, -Math.sin(o.ph)) * 3 * o.walk;
    L(c, -x, top, -x - s, -1.5 - lift1, w, col);
    L(c, x, top, x + s, -1.5 - lift2, w, col);
    if (opt.foot) {
      E(c, -x - s, -1.2 - lift1, w * 0.85, w * 0.5, opt.foot);
      E(c, x + s, -1.2 - lift2, w * 0.85, w * 0.5, opt.foot);
    }
  }
  // 표준 팔 (다리와 반대 위상)
  function arms(c, o, col, opt) {
    opt = opt || {};
    var x = opt.x != null ? opt.x : 11, y = opt.y != null ? opt.y : -26;
    var w = opt.w != null ? opt.w : 4.5, len = opt.len != null ? opt.len : 9;
    var s = -swing(o) * 2.5;
    L(c, -x, y, -x - 2.2 - s, y + len, w, col);
    L(c, x, y, x + 2.2 + s, y + len, w, col);
  }

  var SP = {}; // id → draw(c, palette, o)

  // ══════════════ 마스코트: 플라밍고 ══════════════
  SP.flamingo = function (c, p, o) {
    var bob = bobOf(o), sway = Math.sin(o.t * 1.6) * 1.2;
    var hipY = -28;
    // 다리 — 길고 가늘게, idle 시 한 다리로 서기(오른 다리 접음)
    var legCol = ISO.shade(p.primary, -0.25);
    if (o.walk < 0.08) {
      L(c, -2.5, hipY, -2.5, -1.5, 2.6, legCol);                       // 지지 다리
      E(c, -2.5, -1, 4, 2, legCol);                                     // 발
      // 접은 다리: 허벅지 앞으로, 정강이 뒤로
      L(c, 3, hipY, 7.5, hipY + 8, 2.6, legCol);
      L(c, 7.5, hipY + 8, 3.5, hipY + 3, 2.4, legCol);
    } else {
      var s = swing(o) * 5;
      var l1 = Math.max(0, Math.sin(o.ph)) * 4 * o.walk;
      var l2 = Math.max(0, -Math.sin(o.ph)) * 4 * o.walk;
      // 무릎이 뒤로 꺾이는 새 다리
      L(c, -3, hipY, -3 - s * 0.4, hipY + 14, 2.6, legCol);
      L(c, -3 - s * 0.4, hipY + 14, -3 - s, -1.5 - l1, 2.4, legCol);
      E(c, -3 - s, -1, 3.6, 1.8, legCol);
      L(c, 3, hipY, 3 + s * 0.4, hipY + 14, 2.6, legCol);
      L(c, 3 + s * 0.4, hipY + 14, 3 + s, -1.5 - l2, 2.4, legCol);
      E(c, 3 + s, -1, 3.6, 1.8, legCol);
    }
    c.save(); c.translate(0, bob);
    // 꼬리 깃
    E(c, -11, hipY - 9, 6, 4.5, ISO.shade(p.primary, -0.12), -0.6);
    E(c, -13, hipY - 7, 4, 3, p.accent, -0.5);
    // 몸통(달걀형)
    E(c, 0, hipY - 9, 13, 10, p.primary);
    E(c, -2, hipY - 6, 9, 6, p.secondary, 0.15);
    // 날개 (스캘럽 깃)
    E(c, 4, hipY - 9, 8.5, 6.5, p.accent, -0.35);
    arc(c, 6, hipY - 8, 6, 0.4, 2.2, 1.4, ISO.shade(p.accent, -0.18));
    arc(c, 4, hipY - 6, 5, 0.4, 2.2, 1.4, ISO.shade(p.accent, -0.18));
    // 목 — 우아한 S 커브
    var hx = 8 + sway, hy = hipY - 34;
    c.strokeStyle = p.primary; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(5, hipY - 14);
    c.bezierCurveTo(15, hipY - 20, -1 + sway, hipY - 26, hx - 1, hy + 4);
    c.stroke();
    // 머리
    C(c, hx, hy, 6.5, p.primary);
    // 굽은 부리(끝 검정)
    c.fillStyle = p.secondary;
    c.beginPath(); c.moveTo(hx + 3, hy - 3);
    c.quadraticCurveTo(hx + 13, hy - 2, hx + 12, hy + 6);
    c.quadraticCurveTo(hx + 10.5, hy + 7.5, hx + 9, hy + 6);
    c.quadraticCurveTo(hx + 9.5, hy + 2, hx + 3, hy + 2);
    c.closePath(); c.fill();
    c.fillStyle = p.dark;
    c.beginPath(); c.moveTo(hx + 11.6, hy + 1.5);
    c.quadraticCurveTo(hx + 12.4, hy + 4, hx + 12, hy + 6);
    c.quadraticCurveTo(hx + 10.5, hy + 7.5, hx + 9, hy + 6);
    c.quadraticCurveTo(hx + 9.6, hy + 4, hx + 9.8, hy + 2.2);
    c.closePath(); c.fill();
    eye(c, hx + 1.5, hy - 1.5, 1.7, p.dark, o, 0.4);
    C(c, hx - 2.5, hy + 2, 1.8, p.accent); // 볼터치
    c.restore();
  };

  // ══════════════ 토끼 ══════════════
  SP.rabbit = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { foot: ISO.shade(p.primary, 0.15) });
    c.save(); c.translate(0, bob);
    E(c, 10, -15, 4.5, 4, p.secondary); // 꼬리 퍼프
    E(c, 0, -21, 11, 11.5, p.primary);
    E(c, 0, -18, 7, 7.5, p.secondary);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    C(c, 0, -41, 14, p.primary);
    // 긴 귀
    var flop = Math.sin(o.t * 2.1) * 0.06;
    E(c, -6.5, -62, 4.6, 13, p.primary, -0.18 + flop);
    E(c, 6.5, -62, 4.6, 13, p.primary, 0.18 - flop);
    E(c, -6.5, -60, 2.3, 9, p.accent, -0.18 + flop);
    E(c, 6.5, -60, 2.3, 9, p.accent, 0.18 - flop);
    eyes2(c, 5.5, -43, 2.1, p.dark, o);
    P(c, [[-1.6, -37.5], [1.6, -37.5], [0, -35.5]], p.accent); // 코
    L(c, 0, -35.5, 0, -33.5, 1.2, p.dark);
    C(c, -8.5, -36, 2, p.accent); C(c, 8.5, -36, 2, p.accent);
    c.restore();
  };

  // ══════════════ 여우 ══════════════
  SP.fox = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, ISO.shade(p.primary, -0.28));
    c.save(); c.translate(0, bob);
    // 풍성한 꼬리 (흰 끝)
    var wag = Math.sin(o.t * 3) * 0.12;
    E(c, -13, -18, 10, 5.5, p.primary, -0.7 + wag);
    E(c, -17.5, -24, 4.5, 3.5, p.secondary, -0.7 + wag);
    E(c, 0, -21, 11, 12, p.primary);
    E(c, 0, -17.5, 6.5, 7.5, p.secondary);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    C(c, 0, -41, 14, p.primary);
    // 뾰족 귀 (안쪽 밝게, 끝 어둡게)
    P(c, [[-14, -47], [-4, -51], [-11, -62]], p.primary);
    P(c, [[14, -47], [4, -51], [11, -62]], p.primary);
    P(c, [[-12.4, -55], [-8, -55.5], [-11, -62]], p.dark);
    P(c, [[12.4, -55], [8, -55.5], [11, -62]], p.dark);
    // 뾰족 주둥이
    E(c, 0, -35, 7.5, 5.5, p.secondary);
    eyes2(c, 6, -44, 2.1, p.dark, o);
    P(c, [[-2, -37.5], [2, -37.5], [0, -35]], p.dark);
    L(c, -9, -47, -5, -45.6, 1.3, p.accent);
    L(c, 9, -47, 5, -45.6, 1.3, p.accent);
    c.restore();
  };

  // ══════════════ 판다 ══════════════
  SP.panda = function (c, p, o) {
    var bob = bobOf(o), dk = p.accent;
    legs(c, o, dk, { w: 5.5, x: 5 });
    c.save(); c.translate(0, bob);
    E(c, 0, -21, 12.5, 12.5, p.primary);
    arms(c, o, dk, { x: 11, y: -26, len: 9, w: 5 });
    C(c, 0, -41, 14.5, p.primary);
    C(c, -11, -52, 5.5, dk); C(c, 11, -52, 5.5, dk); // 귀
    // 눈 패치
    E(c, -6, -43, 4.6, 5.6, dk, -0.35);
    E(c, 6, -43, 4.6, 5.6, dk, 0.35);
    eye(c, -5.5, -43, 1.7, '#ffffff', o, 0); eye(c, 5.5, -43, 1.7, '#ffffff', o, 0);
    E(c, 0, -35.5, 2.4, 1.8, dk);
    arc(c, 0, -33.5, 2.2, 0.3, Math.PI - 0.3, 1.3, dk);
    c.restore();
  };

  // ══════════════ 치즈 고양이 ══════════════
  SP.cat = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary);
    c.save(); c.translate(0, bob);
    // 말린 꼬리
    c.strokeStyle = p.primary; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(9, -16);
    c.bezierCurveTo(18, -18, 20, -28 + Math.sin(o.t * 2.5) * 1.5, 14, -30);
    c.stroke();
    L(c, 17.6, -23, 19.6, -21, 4, p.accent);
    E(c, 0, -20.5, 10.5, 11.5, p.primary);
    E(c, 0, -17.5, 6.5, 7, p.secondary);
    arms(c, o, p.primary, { x: 9.5, y: -25, len: 8 });
    C(c, 0, -40, 13.5, p.primary);
    // 삼각 귀
    P(c, [[-13, -46], [-4, -51.5], [-11.5, -59]], p.primary);
    P(c, [[13, -46], [4, -51.5], [11.5, -59]], p.primary);
    P(c, [[-10.8, -50], [-7, -51.5], [-10.3, -56]], p.accent);
    P(c, [[10.8, -50], [7, -51.5], [10.3, -56]], p.accent);
    // 이마 줄무늬
    L(c, -4, -52, -3, -47, 2, p.accent); L(c, 0, -53.5, 0, -48, 2, p.accent); L(c, 4, -52, 3, -47, 2, p.accent);
    E(c, 0, -34.5, 6, 4.5, p.secondary);
    eyes2(c, 5.5, -42, 2, p.dark, o);
    P(c, [[-1.5, -37], [1.5, -37], [0, -35.4]], '#E8837E');
    L(c, -12, -36.5, -7, -36, 1, p.dark); L(c, 12, -36.5, 7, -36, 1, p.dark);
    L(c, -12, -33.5, -7, -34.5, 1, p.dark); L(c, 12, -33.5, 7, -34.5, 1, p.dark);
    c.restore();
  };

  // ══════════════ 시바견 ══════════════
  SP.dog = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { foot: p.secondary });
    c.save(); c.translate(0, bob);
    // 위로 말린 꼬리
    var wag = Math.sin(o.t * 6) * 2 * (0.4 + o.walk);
    E(c, -10, -30 + wag * 0.3, 6, 5, p.primary, -0.9);
    E(c, -12, -31 + wag * 0.3, 3, 2.5, p.secondary, -0.9);
    E(c, 0, -20.5, 11.5, 11.5, p.primary);
    E(c, 0, -17, 7, 7.5, p.secondary);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    C(c, 0, -40, 14, p.primary);
    P(c, [[-14, -45], [-5, -51], [-12, -60]], p.primary);
    P(c, [[14, -45], [5, -51], [12, -60]], p.primary);
    P(c, [[-11.7, -49.5], [-7.5, -51], [-10.7, -56]], p.secondary);
    P(c, [[11.7, -49.5], [7.5, -51], [10.7, -56]], p.secondary);
    E(c, 0, -34.5, 7.5, 6, p.secondary); // 흰 주둥이
    E(c, -6.5, -44, 3.4, 3.8, p.secondary); E(c, 6.5, -44, 3.4, 3.8, p.secondary); // 눈썹 반점
    eyes2(c, 6, -43, 2, p.dark, o);
    E(c, 0, -37, 2.4, 1.9, p.dark);
    arc(c, 0, -34.6, 2.4, 0.35, Math.PI - 0.35, 1.3, p.dark);
    C(c, -9.5, -34, 2, '#F2A9A0'); C(c, 9.5, -34, 2, '#F2A9A0');
    c.restore();
  };

  // ══════════════ 펭귄 ══════════════
  SP.penguin = function (c, p, o) {
    var waddle = Math.sin(o.ph) * 0.09 * o.walk;
    // 발
    var s = swing(o) * 3;
    E(c, -5 - s, -1.2, 5, 2.4, p.accent);
    E(c, 5 + s, -1.2, 5, 2.4, p.accent);
    c.save(); c.translate(0, bobOf(o) * 0.6); c.rotate(waddle);
    E(c, 0, -26, 15, 23, p.primary); // 달걀 몸통
    E(c, 0, -22, 10.5, 16.5, p.secondary);
    // 플리퍼
    var flap = Math.sin(o.ph + Math.PI) * 0.25 * o.walk + Math.sin(o.t * 1.8) * 0.05;
    E(c, -14.5, -28, 4, 10, p.primary, 0.35 + flap);
    E(c, 14.5, -28, 4, 10, p.primary, -0.35 - flap);
    // 얼굴
    E(c, -5.5, -40, 4.6, 5.2, p.secondary); E(c, 5.5, -40, 4.6, 5.2, p.secondary);
    eyes2(c, 5, -40.5, 1.9, p.dark, o);
    P(c, [[-3, -36], [3, -36], [0, -31.8]], p.accent);
    c.restore();
  };

  // ══════════════ 부엉이 ══════════════
  SP.owl = function (c, p, o) {
    legs(c, o, p.accent, { x: 4, top: -8, w: 3, foot: p.accent, stride: 3 });
    c.save(); c.translate(0, bobOf(o));
    E(c, 0, -27, 15, 20, p.primary);
    E(c, 0, -21, 10, 12.5, p.secondary);
    // 가슴 갈매기 무늬
    arc(c, -4, -25, 3, 0.3, Math.PI - 0.3, 1.4, ISO.shade(p.primary, -0.1));
    arc(c, 4, -25, 3, 0.3, Math.PI - 0.3, 1.4, ISO.shade(p.primary, -0.1));
    arc(c, 0, -19, 3, 0.3, Math.PI - 0.3, 1.4, ISO.shade(p.primary, -0.1));
    // 날개
    E(c, -14, -27, 4.5, 12, ISO.shade(p.primary, -0.18), 0.25);
    E(c, 14, -27, 4.5, 12, ISO.shade(p.primary, -0.18), -0.25);
    // 귀깃
    P(c, [[-13, -40], [-5, -44], [-13, -52]], p.primary);
    P(c, [[13, -40], [5, -44], [13, -52]], p.primary);
    // 큰 눈
    C(c, -6.5, -37, 6.2, p.secondary); C(c, 6.5, -37, 6.2, p.secondary);
    arc(c, -6.5, -37, 6.2, 0, TAU, 1.4, p.accent); arc(c, 6.5, -37, 6.2, 0, TAU, 1.4, p.accent);
    eye(c, -6.5, -37, 3, p.dark, o, 0); eye(c, 6.5, -37, 3, p.dark, o, 0);
    P(c, [[-2.5, -33], [2.5, -33], [0, -28.5]], p.accent);
    c.restore();
  };

  // ══════════════ 사자 ══════════════
  SP.lion = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary);
    c.save(); c.translate(0, bob);
    // 술 달린 꼬리
    c.strokeStyle = p.primary; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(9, -16); c.quadraticCurveTo(18, -14, 19, -24 + Math.sin(o.t * 2) * 1.5); c.stroke();
    E(c, 19, -26 + Math.sin(o.t * 2) * 1.5, 3, 4, p.accent);
    E(c, 0, -21, 11.5, 12, p.primary);
    E(c, 0, -17.5, 7, 7.5, p.secondary);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    // 갈기 (스캘럽 원)
    var m = p.accent;
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * TAU + Math.sin(o.t * 1.4) * 0.04;
      C(c, Math.cos(a) * 15, -41 + Math.sin(a) * 15, 7, i % 2 ? m : ISO.shade(m, -0.12));
    }
    C(c, 0, -41, 13.5, p.primary);
    C(c, -12, -50, 4, p.primary); C(c, 12, -50, 4, p.primary);
    E(c, 0, -35, 6.5, 5, p.secondary);
    eyes2(c, 5.5, -43, 2.1, p.dark, o);
    P(c, [[-2, -38], [2, -38], [0, -36]], p.dark);
    arc(c, -2, -34.5, 2, 0.2, Math.PI - 0.5, 1.2, p.dark);
    arc(c, 2, -34.5, 2, 0.5, Math.PI - 0.2, 1.2, p.dark);
    c.restore();
  };

  // ══════════════ 호랑이 ══════════════
  SP.tiger = function (c, p, o) {
    var bob = bobOf(o), st = p.accent;
    legs(c, o, p.primary);
    c.save(); c.translate(0, bob);
    // 줄무늬 꼬리
    c.strokeStyle = p.primary; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(9, -16); c.quadraticCurveTo(19, -15, 20, -26); c.stroke();
    L(c, 17.3, -18.5, 20.3, -17.5, 3, st); L(c, 18.9, -23, 21.7, -22.5, 3, st);
    E(c, 0, -21, 11.5, 12, p.primary);
    E(c, 0, -17.5, 7, 7.5, p.secondary);
    // 옆구리 줄무늬
    L(c, -10.5, -25, -8, -22, 2.2, st); L(c, -11, -20, -8.5, -18, 2.2, st);
    L(c, 10.5, -25, 8, -22, 2.2, st); L(c, 11, -20, 8.5, -18, 2.2, st);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    C(c, 0, -41, 14, p.primary);
    C(c, -11, -51, 5, p.primary); C(c, 11, -51, 5, p.primary);
    C(c, -11, -51, 2.5, p.secondary); C(c, 11, -51, 2.5, p.secondary);
    // 이마/뺨 줄무늬
    L(c, 0, -54.5, 0, -49, 2.2, st); L(c, -4.5, -53.5, -3.5, -49, 2, st); L(c, 4.5, -53.5, 3.5, -49, 2, st);
    L(c, -13.5, -41, -9.5, -40, 2, st); L(c, 13.5, -41, 9.5, -40, 2, st);
    E(c, 0, -34.5, 6.5, 5, p.secondary);
    eyes2(c, 5.5, -43, 2.1, p.dark, o);
    P(c, [[-2, -37.5], [2, -37.5], [0, -35.6]], p.dark);
    arc(c, 0, -33.8, 2.2, 0.3, Math.PI - 0.3, 1.3, p.dark);
    c.restore();
  };

  // ══════════════ 코끼리 ══════════════
  SP.elephant = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { w: 6, x: 5.5 });
    c.save(); c.translate(0, bob);
    E(c, 0, -21, 13.5, 12.5, p.primary);
    E(c, 0, -17.5, 8, 7.5, p.secondary);
    arms(c, o, p.primary, { x: 12, y: -25, len: 8, w: 5 });
    // 큰 귀 (머리 뒤)
    var flapE = Math.sin(o.t * 1.5) * 0.05;
    E(c, -16, -42, 9, 11, p.primary, -0.25 + flapE);
    E(c, 16, -42, 9, 11, p.primary, 0.25 - flapE);
    E(c, -16, -42, 5.5, 7.5, p.accent, -0.25 + flapE);
    E(c, 16, -42, 5.5, 7.5, p.accent, 0.25 - flapE);
    C(c, 0, -42, 14, p.primary);
    eyes2(c, 6, -45, 2, p.dark, o);
    // 코 (살랑살랑)
    var tsw = Math.sin(o.t * 2 + 1) * 2.5;
    c.strokeStyle = p.primary; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -39);
    c.quadraticCurveTo(1 + tsw * 0.4, -30, tsw, -24); c.stroke();
    c.strokeStyle = ISO.shade(p.primary, -0.12); c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(-2, -34); c.lineTo(2.5, -34); c.stroke();
    C(c, -9, -37, 2, p.accent); C(c, 9, -37, 2, p.accent);
    c.restore();
  };

  // ══════════════ 기린 ══════════════
  SP.giraffe = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { top: -20, x: 4.5, w: 4.5, stride: 5 });
    c.save(); c.translate(0, bob);
    E(c, 0, -28, 11, 10.5, p.primary);
    E(c, 0, -25.5, 6.5, 6, p.secondary);
    // 반점 (몸)
    C(c, -7, -32, 2.5, p.accent); C(c, 7.5, -30, 2.3, p.accent); C(c, -3, -22.5, 2, p.accent);
    arms(c, o, p.primary, { x: 9.5, y: -32, len: 7, w: 4 });
    // 긴 목
    var nsw = Math.sin(o.t * 1.3) * 1.2;
    c.strokeStyle = p.primary; c.lineWidth = 8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(nsw * 0.5, -48, nsw, -60); c.stroke();
    C(c, nsw * 0.6 + 2, -44, 2, p.accent); C(c, nsw * 0.9 - 2, -53, 1.8, p.accent);
    // 갈기
    L(c, nsw * 0.4 - 3.5, -46, nsw - 4, -58, 2.5, p.accent);
    // 머리
    C(c, nsw, -64, 10, p.primary);
    E(c, nsw, -59.5, 6, 4.5, p.secondary);
    // 뿔(오시콘)
    L(c, nsw - 4, -72, nsw - 5, -77, 2, p.primary); C(c, nsw - 5, -78, 2.2, p.accent);
    L(c, nsw + 4, -72, nsw + 5, -77, 2, p.primary); C(c, nsw + 5, -78, 2.2, p.accent);
    E(c, nsw - 11, -66, 4, 2.6, p.primary, -0.5); E(c, nsw + 11, -66, 4, 2.6, p.primary, 0.5);
    eyes2 && eye(c, nsw - 4.5, -66, 1.9, p.dark, o, 0); eye(c, nsw + 4.5, -66, 1.9, p.dark, o, 0);
    C(c, nsw - 2.5, -59.5, 1, p.dark); C(c, nsw + 2.5, -59.5, 1, p.dark);
    c.restore();
  };

  // ══════════════ 원숭이 ══════════════
  SP.monkey = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary);
    c.save(); c.translate(0, bob);
    // 긴 말린 꼬리
    c.strokeStyle = p.primary; c.lineWidth = 3.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(9, -16);
    c.bezierCurveTo(20, -16, 22, -30, 15, -32 + Math.sin(o.t * 2.2) * 1.5);
    c.stroke();
    E(c, 0, -21, 10.5, 11.5, p.primary);
    E(c, 0, -18, 6.5, 7, p.secondary);
    arms(c, o, p.primary, { x: 9.5, y: -26, len: 10 });
    C(c, 0, -40, 13.5, p.primary);
    // 옆 귀
    C(c, -14, -40, 5, p.primary); C(c, 14, -40, 5, p.primary);
    C(c, -14, -40, 2.6, p.secondary); C(c, 14, -40, 2.6, p.secondary);
    // 얼굴 패치 (하트형)
    E(c, -4.5, -43, 5.5, 6, p.secondary); E(c, 4.5, -43, 5.5, 6, p.secondary);
    E(c, 0, -37.5, 8, 6, p.secondary);
    eyes2(c, 4.5, -43, 2, p.dark, o);
    C(c, -1.6, -37.5, 1, p.dark); C(c, 1.6, -37.5, 1, p.dark);
    arc(c, 0, -35.8, 2.6, 0.3, Math.PI - 0.3, 1.3, p.dark);
    c.restore();
  };

  // ══════════════ 개구리 ══════════════
  SP.frog = function (c, p, o) {
    var bob = bobOf(o);
    // 넓은 개구리 다리
    var s = swing(o) * 3.5;
    E(c, -8 - s, -3, 6.5, 3.5, p.primary, 0.15);
    E(c, 8 + s, -3, 6.5, 3.5, p.primary, -0.15);
    E(c, -10 - s, -1.5, 4.5, 2, ISO.shade(p.primary, 0.18));
    E(c, 10 + s, -1.5, 4.5, 2, ISO.shade(p.primary, 0.18));
    c.save(); c.translate(0, bob * 1.4);
    E(c, 0, -19, 14, 14.5, p.primary); // 머리=몸
    E(c, 0, -13.5, 9.5, 8.5, p.secondary);
    arms(c, o, p.primary, { x: 11.5, y: -18, len: 8, w: 3.8 });
    // 튀어나온 눈
    C(c, -7.5, -33.5, 5.8, p.primary);
    C(c, 7.5, -33.5, 5.8, p.primary);
    eye(c, -7.5, -34, 2.6, p.dark, o, 0); eye(c, 7.5, -34, 2.6, p.dark, o, 0);
    // 넓은 입
    arc(c, 0, -22, 6.5, 0.25, Math.PI - 0.25, 1.6, p.dark);
    C(c, -10.5, -20, 2.2, p.accent); C(c, 10.5, -20, 2.2, p.accent);
    C(c, -3, -25.5, 0.9, p.dark); C(c, 3, -25.5, 0.9, p.dark);
    c.restore();
  };

  // ══════════════ 거북이 ══════════════
  SP.turtle = function (c, p, o) {
    var bob = bobOf(o) * 0.6;
    legs(c, o, p.primary, { x: 6.5, top: -9, w: 5, stride: 2.5 });
    c.save(); c.translate(0, bob);
    // 등껍질
    E(c, 0, -21, 14.5, 13, p.accent);
    arc(c, 0, -21, 14.5, 0, TAU, 2, ISO.shade(p.accent, -0.2));
    // 껍질 판 무늬
    E(c, 0, -23, 6, 5, ISO.shade(p.accent, 0.12));
    arc(c, 0, -23, 6, 0, TAU, 1.2, ISO.shade(p.accent, -0.2));
    L(c, -5, -20, -11, -16.5, 1.2, ISO.shade(p.accent, -0.2));
    L(c, 5, -20, 11, -16.5, 1.2, ISO.shade(p.accent, -0.2));
    L(c, -4.5, -26, -9, -30.5, 1.2, ISO.shade(p.accent, -0.2));
    L(c, 4.5, -26, 9, -30.5, 1.2, ISO.shade(p.accent, -0.2));
    // 배 테두리
    E(c, 0, -11.5, 12.5, 3.5, p.secondary);
    // 머리 (천천히 갸웃)
    var hx = Math.sin(o.t * 0.9) * 1.5;
    C(c, hx, -38, 9.5, p.primary);
    E(c, hx, -34.5, 5.5, 4, p.secondary);
    eye(c, hx - 4, -39.5, 1.9, p.dark, o, 0); eye(c, hx + 4, -39.5, 1.9, p.dark, o, 0);
    arc(c, hx, -34.5, 2.4, 0.3, Math.PI - 0.3, 1.2, p.dark);
    C(c, hx - 6.5, -35, 1.7, '#F2B7A5'); C(c, hx + 6.5, -35, 1.7, '#F2B7A5');
    c.restore();
  };

  // ══════════════ 곰 ══════════════
  SP.bear = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { w: 6, x: 5.5, foot: p.secondary });
    c.save(); c.translate(0, bob);
    E(c, 0, -21, 13.5, 13, p.primary);
    E(c, 0, -17.5, 8.5, 8, p.secondary);
    arms(c, o, p.primary, { x: 12, y: -26, len: 9, w: 5.5 });
    C(c, 0, -41, 14.5, p.primary);
    C(c, -11, -51.5, 5.2, p.primary); C(c, 11, -51.5, 5.2, p.primary);
    C(c, -11, -51.5, 2.6, p.secondary); C(c, 11, -51.5, 2.6, p.secondary);
    E(c, 0, -35, 7, 5.5, p.secondary);
    eyes2(c, 5.8, -43, 2, p.dark, o);
    E(c, 0, -37.5, 2.6, 2, p.accent);
    arc(c, 0, -34.5, 2.2, 0.3, Math.PI - 0.3, 1.3, p.dark);
    c.restore();
  };

  // ══════════════ 돼지 ══════════════
  SP.pig = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary);
    c.save(); c.translate(0, bob);
    // 꼬불 꼬리
    c.strokeStyle = p.accent; c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(10, -18);
    c.bezierCurveTo(15, -20, 15, -15, 12.5, -16.5);
    c.stroke();
    E(c, 0, -20.5, 11.5, 11.5, p.primary);
    E(c, 0, -17.5, 7, 7, p.secondary);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    C(c, 0, -40, 14, p.primary);
    // 늘어진 귀
    P(c, [[-13.5, -46], [-4.5, -51], [-13, -55]], p.accent);
    P(c, [[13.5, -46], [4.5, -51], [13, -55]], p.accent);
    // 콧구멍 있는 코
    E(c, 0, -38, 5.5, 4.2, p.accent);
    C(c, -2, -38, 1.1, p.dark); C(c, 2, -38, 1.1, p.dark);
    eyes2(c, 6.5, -43, 2, p.dark, o);
    C(c, -10, -36, 2, ISO.shade(p.accent, 0.25)); C(c, 10, -36, 2, ISO.shade(p.accent, 0.25));
    c.restore();
  };

  // ══════════════ 병아리 ══════════════
  SP.chick = function (c, p, o) {
    var s = swing(o) * 2.5;
    L(c, -3, -6, -3 - s, -1, 2.2, p.accent);
    L(c, 3, -6, 3 + s, -1, 2.2, p.accent);
    c.save(); c.translate(0, bobOf(o));
    C(c, 0, -18, 13, p.primary); // 머리=몸
    E(c, 0, -13, 8, 6.5, p.secondary);
    // 짧은 날개
    var flap = Math.sin(o.t * 5) * 0.2 * (0.3 + o.walk);
    E(c, -12.5, -18, 4, 6, p.primary, 0.4 + flap);
    E(c, 12.5, -18, 4, 6, p.primary, -0.4 - flap);
    // 머리 위 삐죽 깃털
    L(c, 0, -30.5, -1.5, -35, 1.6, p.accent);
    L(c, 0.5, -30.5, 2, -34.5, 1.6, p.accent);
    eyes2(c, 4.5, -21, 1.9, p.dark, o);
    P(c, [[-2.4, -17], [2.4, -17], [0, -13.8]], p.accent);
    C(c, -7.5, -15.5, 1.8, '#F7B7A3'); C(c, 7.5, -15.5, 1.8, '#F7B7A3');
    c.restore();
  };

  // ══════════════ 고슴도치 ══════════════
  SP.hedgehog = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.accent, { x: 4, top: -9, w: 3.5, stride: 3 });
    c.save(); c.translate(0, bob);
    // 가시 (등 전체 부채꼴)
    var sc = p.accent, sc2 = ISO.shade(p.primary, -0.15);
    for (var i = 0; i < 11; i++) {
      var a = Math.PI * 0.08 + (i / 10) * Math.PI * 0.84;
      var cx = -Math.cos(a) * 13, cy = -24 - Math.sin(a) * 12;
      var tx = -Math.cos(a) * 23, ty = -24 - Math.sin(a) * 21;
      P(c, [[cx - 3, cy], [cx + 3, cy], [tx, ty]], i % 2 ? sc : sc2);
    }
    E(c, 0, -22, 13.5, 12.5, p.primary);
    // 크림색 얼굴 (아래쪽)
    E(c, 0, -18, 10, 9, p.secondary);
    eyes2(c, 4.8, -22, 1.9, p.dark, o);
    // 뾰족 코
    P(c, [[-2.5, -17], [2.5, -17], [0, -12.5]], p.secondary);
    C(c, 0, -13, 1.7, p.dark);
    C(c, -8, -16, 1.8, '#E8A79A'); C(c, 8, -16, 1.8, '#E8A79A');
    // 작은 귀
    C(c, -8.5, -29, 2.6, p.primary); C(c, 8.5, -29, 2.6, p.primary);
    c.restore();
  };

  // ══════════════ 수달 ══════════════
  SP.otter = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { x: 4, top: -10, w: 4.5, stride: 3 });
    c.save(); c.translate(0, bob);
    // 굵은 꼬리
    E(c, -9, -8, 9, 4, ISO.shade(p.primary, -0.1), 0.5);
    // 길쭉한 몸
    E(c, 0, -22, 10, 15, p.primary);
    E(c, 0, -19, 6.5, 10, p.secondary);
    // 조개를 안은 손
    E(c, 0, -25, 4.5, 4, '#9FA8AE');
    L(c, 0, -25, 0, -21.5, 1, '#7C858B');
    L(c, -7, -28, -2.5, -24, 3.6, p.primary);
    L(c, 7, -28, 2.5, -24, 3.6, p.primary);
    C(c, 0, -43, 12.5, p.primary);
    C(c, -10, -51, 3.4, p.primary); C(c, 10, -51, 3.4, p.primary);
    // 넓은 주둥이
    E(c, 0, -38.5, 7, 5, p.secondary);
    eyes2(c, 5.2, -45, 1.9, p.dark, o);
    E(c, 0, -41, 2.4, 1.8, p.dark);
    arc(c, 0, -38.6, 2, 0.3, Math.PI - 0.3, 1.2, p.dark);
    L(c, -11, -40, -6.5, -39.5, 0.9, p.dark); L(c, 11, -40, 6.5, -39.5, 0.9, p.dark);
    L(c, -11, -37.5, -6.5, -38, 0.9, p.dark); L(c, 11, -37.5, 6.5, -38, 0.9, p.dark);
    c.restore();
  };

  // ══════════════ NPC: 카피바라 ══════════════
  SP.capybara = function (c, p, o) {
    var bob = bobOf(o) * 0.6;
    legs(c, o, p.primary, { x: 5.5, top: -10, w: 5, stride: 2.5 });
    c.save(); c.translate(0, bob);
    // 각진 덩치 몸
    c.fillStyle = p.primary;
    c.beginPath();
    if (c.roundRect) c.roundRect(-13, -34, 26, 25, 9); else c.rect(-13, -34, 26, 25);
    c.fill();
    E(c, 0, -14, 9, 6, p.secondary);
    // 각진 머리
    c.fillStyle = p.primary;
    c.beginPath();
    if (c.roundRect) c.roundRect(-11.5, -54, 23, 22, 8); else c.rect(-11.5, -54, 23, 22);
    c.fill();
    E(c, 0, -37, 7.5, 5, p.secondary); // 뭉툭한 주둥이
    C(c, -8.5, -54, 3.2, p.primary); C(c, 8.5, -54, 3.2, p.primary); // 작은 귀
    // 지그시 감은 편안한 눈
    arc(c, -5.5, -47, 2.4, 0.15, Math.PI - 0.15, 1.6, p.dark);
    arc(c, 5.5, -47, 2.4, 0.15, Math.PI - 0.15, 1.6, p.dark);
    C(c, -2, -38.5, 1.1, p.dark); C(c, 2, -38.5, 1.1, p.dark);
    // 머리 위 귤
    C(c, 0, -60, 4.5, '#F0983E');
    E(c, 1.5, -64, 2.2, 1.3, '#6FA054', 0.5);
    c.restore();
  };

  // ══════════════ NPC: 비둘기 ══════════════
  SP.pigeon = function (c, p, o) {
    var s = swing(o) * 2.5;
    L(c, -3, -6, -3 - s, -1, 2, '#C96B4A');
    L(c, 3, -6, 3 + s, -1, 2, '#C96B4A');
    var bobHead = Math.sin(o.ph * 2) * 1.6 * o.walk; // 구구 고갯짓
    c.save(); c.translate(0, bobOf(o) * 0.6);
    E(c, -1, -16, 12, 10, p.primary); // 몸
    E(c, -3, -13.5, 7.5, 5.5, p.secondary);
    // 접은 날개
    E(c, -8, -18, 7.5, 4.5, ISO.shade(p.primary, -0.15), -0.5);
    // 우편 가방
    E(c, 8, -12, 5, 4.5, '#B08954');
    L(c, 3, -22, 8, -14, 1.8, '#8A6A3E');
    P(c, [[4.5, -14.5], [11.5, -14.5], [8, -10]], '#C99A60');
    // 목/머리
    C(c, 5, -28 + bobHead, 6.5, p.primary);
    E(c, 4, -23 + bobHead, 4.5, 3.5, p.accent); // 목덜미 광택
    eye(c, 7, -29.5 + bobHead, 1.7, p.dark, o, 1.1);
    P(c, [[10.5, -28 + bobHead], [15, -26.5 + bobHead], [10.5, -25.5 + bobHead]], '#5A5148');
    c.restore();
  };

  // ══════════════ NPC: 알파카 ══════════════
  SP.alpaca = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.secondary, { top: -14, w: 4.5, stride: 4 });
    c.save(); c.translate(0, bob);
    // 복슬복슬 몸 (구름 스캘럽)
    var i, a;
    for (i = 0; i < 8; i++) {
      a = (i / 8) * TAU;
      C(c, Math.cos(a) * 10, -24 + Math.sin(a) * 9, 6, p.primary);
    }
    E(c, 0, -24, 11, 10, p.primary);
    // 긴 복슬 목
    L(c, 3, -30, 3, -50, 9, p.primary);
    C(c, 1, -38, 6, p.primary); C(c, 5, -46, 6, p.primary);
    // 머리
    C(c, 3, -56, 9.5, p.secondary);
    // 정수리 뭉게 털
    C(c, 0, -64, 5, p.primary); C(c, 6, -64.5, 4.4, p.primary); C(c, 3, -66.5, 4.6, p.primary);
    E(c, -4.5, -62, 2.6, 4.5, p.primary, -0.4); E(c, 10.5, -62, 2.6, 4.5, p.primary, 0.4); // 귀
    eye(c, -0.5, -57, 1.8, p.dark, o, 0.6); eye(c, 7, -57, 1.8, p.dark, o, 0.6);
    E(c, 3.3, -52.5, 3.2, 2.4, p.accent);
    C(c, 2.3, -53, 0.8, p.dark); C(c, 4.3, -53, 0.8, p.dark);
    C(c, -3.5, -53, 1.7, '#F2B7B0'); C(c, 10, -53, 1.7, '#F2B7B0');
    c.restore();
  };

  // ══════════════ NPC: 라쿤 ══════════════
  SP.raccoon = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, ISO.shade(p.primary, -0.2));
    c.save(); c.translate(0, bob);
    // 고리 꼬리
    c.strokeStyle = p.primary; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(9, -15); c.quadraticCurveTo(18, -14, 19, -27); c.stroke();
    L(c, 15.2, -17, 20, -16, 4.5, p.accent);
    L(c, 17.7, -22.5, 21.7, -22, 4.5, p.accent);
    E(c, 0, -21, 11, 11.5, p.primary);
    E(c, 0, -17.5, 7, 7, p.secondary);
    arms(c, o, ISO.shade(p.primary, -0.15), { x: 10, y: -25, len: 8 });
    C(c, 0, -40, 13.5, p.primary);
    P(c, [[-13, -46], [-4, -50.5], [-11.5, -58]], p.primary);
    P(c, [[13, -46], [4, -50.5], [11.5, -58]], p.primary);
    // 도둑 눈 마스크
    E(c, -6, -42, 5.5, 4, p.accent, -0.22);
    E(c, 6, -42, 5.5, 4, p.accent, 0.22);
    eye(c, -5.5, -42, 1.8, '#ffffff', o, 0); eye(c, 5.5, -42, 1.8, '#ffffff', o, 0);
    E(c, 0, -34.5, 5.5, 4.2, p.secondary);
    E(c, 0, -36.8, 2.2, 1.8, p.dark);
    c.restore();
  };

  // ══════════════ NPC: 염소 ══════════════
  SP.goat = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.secondary, { foot: '#9C8A70' });
    c.save(); c.translate(0, bob);
    E(c, 0, -21, 11, 11.5, p.primary);
    E(c, 0, -17.5, 7, 7, p.secondary);
    arms(c, o, p.primary, { x: 10, y: -25, len: 8 });
    C(c, 0, -40, 13.5, p.primary);
    // 뒤로 굽은 뿔
    c.strokeStyle = p.accent; c.lineWidth = 3.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-7, -50); c.quadraticCurveTo(-11, -60, -17, -60); c.stroke();
    c.beginPath(); c.moveTo(7, -50); c.quadraticCurveTo(11, -60, 17, -60); c.stroke();
    // 옆으로 처진 귀
    E(c, -14.5, -42, 5.5, 3, p.primary, -0.35); E(c, 14.5, -42, 5.5, 3, p.primary, 0.35);
    E(c, 0, -34, 6, 4.8, p.secondary);
    // 턱수염
    P(c, [[-3, -31], [3, -31], [0, -24.5]], p.accent);
    eyes2(c, 5.5, -42.5, 1.9, p.dark, o);
    C(c, -1.8, -35.5, 1, p.dark); C(c, 1.8, -35.5, 1, p.dark);
    c.restore();
  };

  // ══════════════ NPC: 앵무새 ══════════════
  SP.parrot = function (c, p, o) {
    var s = swing(o) * 2.5;
    L(c, -3.5, -7, -3.5 - s, -1, 2.2, '#8C8578');
    L(c, 3.5, -7, 3.5 + s, -1, 2.2, '#8C8578');
    c.save(); c.translate(0, bobOf(o) * 0.7);
    // 긴 꼬리깃
    E(c, -9, -10, 4, 10, ISO.shade(p.primary, -0.2), 0.7);
    E(c, -11, -9, 3, 8, p.accent, 0.8);
    E(c, 0, -20, 12, 15, p.primary); // 몸
    E(c, 0, -16, 8, 10, p.secondary);
    // 날개
    var flap = Math.sin(o.t * 2) * 0.06;
    E(c, -11, -22, 4.5, 10, ISO.shade(p.primary, -0.18), 0.3 + flap);
    E(c, 11, -22, 4.5, 10, ISO.shade(p.primary, -0.18), -0.3 - flap);
    C(c, 2, -38, 10, p.primary); // 머리
    // 볏 깃털
    L(c, 0, -47, -3, -55, 2.6, p.accent);
    L(c, 3, -47.5, 3, -56, 2.6, p.accent);
    L(c, 6, -47, 9, -54, 2.6, p.accent);
    // 굽은 부리
    c.fillStyle = p.accent;
    c.beginPath(); c.moveTo(8, -41);
    c.quadraticCurveTo(17, -40, 14, -32);
    c.quadraticCurveTo(12, -31, 10.5, -32.5);
    c.quadraticCurveTo(11.5, -36, 8, -37);
    c.closePath(); c.fill();
    C(c, 4.5, -40.5, 4, '#ffffff');
    eye(c, 4.5, -40.5, 1.9, p.dark, o, 0.9);
    c.restore();
  };

  // ══════════════ NPC: 나무늘보 ══════════════
  SP.sloth = function (c, p, o) {
    var bob = Math.sin(o.t * 1.1) * 1; // 아주 느린 흔들림
    legs(c, o, p.primary, { stride: 2 });
    c.save(); c.translate(0, bob);
    E(c, 0, -20, 11, 11.5, p.primary);
    E(c, 0, -17, 7, 7, p.secondary);
    // 아주 긴 팔
    var sway = Math.sin(o.t * 0.9) * 1.5;
    L(c, -9, -25, -12 - sway, -6, 4.5, p.primary);
    L(c, 9, -25, 12 + sway, -6, 4.5, p.primary);
    L(c, -12 - sway, -6, -13.5 - sway, -3, 2, p.accent);
    L(c, 12 + sway, -6, 13.5 + sway, -3, 2, p.accent);
    C(c, 0, -38, 13.5, p.primary);
    E(c, 0, -37, 10, 9, p.secondary);
    // 눈 줄무늬
    E(c, -5.5, -40, 4.2, 2.6, p.accent, -0.3);
    E(c, 5.5, -40, 4.2, 2.6, p.accent, 0.3);
    // 반쯤 감긴 눈
    arc(c, -5.5, -40, 2, 0.1, Math.PI - 0.1, 1.5, p.dark);
    arc(c, 5.5, -40, 2, 0.1, Math.PI - 0.1, 1.5, p.dark);
    E(c, 0, -35.5, 2.2, 1.7, p.dark);
    // 흐뭇한 미소
    arc(c, 0, -33.5, 3.5, 0.25, Math.PI - 0.25, 1.5, p.dark);
    c.restore();
  };

  // ══════════════ NPC: 우파루파 ══════════════
  SP.axolotl = function (c, p, o) {
    var bob = bobOf(o);
    legs(c, o, p.primary, { x: 4, top: -9, w: 3.6, stride: 3 });
    c.save(); c.translate(0, bob);
    // 지느러미 꼬리
    E(c, -10, -12, 8, 4.5, p.accent, 0.5);
    E(c, 0, -20, 10.5, 12, p.primary);
    E(c, 0, -17, 7, 7.5, p.secondary);
    arms(c, o, p.primary, { x: 9, y: -23, len: 7, w: 3.6 });
    C(c, 0, -38, 13, p.primary);
    // 프릴 아가미 3쌍
    var g = p.accent, wig = Math.sin(o.t * 2.6) * 0.1;
    E(c, -14, -46, 6, 2.6, g, -0.75 + wig); C(c, -17.5, -50, 2.6, g);
    E(c, -15.5, -40, 6, 2.6, g, -0.25 + wig); C(c, -20, -41.5, 2.6, g);
    E(c, -14.5, -34, 6, 2.6, g, 0.25 + wig); C(c, -19, -32, 2.6, g);
    E(c, 14, -46, 6, 2.6, g, 0.75 - wig); C(c, 17.5, -50, 2.6, g);
    E(c, 15.5, -40, 6, 2.6, g, 0.25 - wig); C(c, 20, -41.5, 2.6, g);
    E(c, 14.5, -34, 6, 2.6, g, -0.25 - wig); C(c, 19, -32, 2.6, g);
    eyes2(c, 5.5, -40, 1.9, p.dark, o);
    // 함박 미소
    arc(c, 0, -36, 4.5, 0.25, Math.PI - 0.25, 1.6, p.dark);
    C(c, -9, -34.5, 2, ISO.shade(p.accent, 0.2)); C(c, 9, -34.5, 2, ISO.shade(p.accent, 0.2));
    c.restore();
  };

  // 폴백
  function generic(c, p, o) {
    legs(c, o, p.primary);
    c.save(); c.translate(0, bobOf(o));
    E(c, 0, -21, 11, 12, p.primary);
    E(c, 0, -18, 7, 7.5, p.secondary);
    C(c, 0, -40, 14, p.primary);
    eyes2(c, 5.5, -42, 2, p.dark, o);
    c.restore();
  }

  // ── 공개 API ─────────────────────────
  // spec: {id, palette, ...}, o: {x, y, scale, face(1|-1), t, walk(0..1), ph}
  window.AVSprites = {
    heights: { flamingo: 82, giraffe: 84, alpaca: 72, penguin: 52, chick: 38, frog: 44, hedgehog: 40, pigeon: 38, capybara: 68, turtle: 50 },
    draw: function (ctx, spec, o) {
      ctx.save();
      ctx.translate(o.x || 0, o.y || 0);
      var s = o.scale || 1;
      ctx.scale(s * (o.face || 1), s);
      var fn = SP[spec.id] || generic;
      fn(ctx, spec.palette, { t: o.t || 0, walk: o.walk || 0, ph: o.ph || 0 });
      ctx.restore();
    },
    headY: function (id) {
      // 라벨 배치용 대략 키
      var h = window.AVSprites.heights[id];
      return h != null ? h : 62;
    },
  };
})();

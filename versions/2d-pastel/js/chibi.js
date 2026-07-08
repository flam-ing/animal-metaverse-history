// ANIMALVERSE · 파스텔 파크 — 치비 캐릭터 벡터 드로잉
// 플레이어 20종 + NPC 8종 전부를 코드로 그린다. (외부 에셋 없음)
// 좌표계: 발밑이 (0,0), 위쪽이 -y. 캐릭터 전체 높이 약 60~130 유닛.
window.Chibi = (function () {
  'use strict';
  const TAU = Math.PI * 2;

  /* ================= 저수준 헬퍼 ================= */
  function shape(ctx, fill, strokeCol, lw, fn) {
    ctx.beginPath();
    fn(ctx);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (strokeCol) {
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = lw || 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  function stroke(ctx, col, lw, fn) { shape(ctx, null, col, lw, fn); }
  function ell(ctx, x, y, rx, ry, fill, dark, lw, rot) {
    shape(ctx, fill, dark, lw, c => c.ellipse(x, y, rx, ry, rot || 0, 0, TAU));
  }
  function rrect(ctx, x, y, w, h, r, fill, dark, lw) {
    shape(ctx, fill, dark, lw, c => c.roundRect(x, y, w, h, r));
  }
  function tri(ctx, x1, y1, x2, y2, x3, y3, fill, dark, lw) {
    shape(ctx, fill, dark, lw, c => { c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); });
  }
  // 두꺼운 윤곽선이 있는 튜브(목·꼬리·다리 등)
  function tube(ctx, dark, fill, lw, fn) {
    stroke(ctx, dark, lw + 4, fn);
    stroke(ctx, fill, lw, fn);
  }
  function mirror(fn) { fn(1); fn(-1); }
  // 몽글몽글 실루엣(갈기·양털 등): 어두운 외곽 원들 먼저 → 본체 원들
  function fluff(ctx, cx, cy, pts, fill, dark) {
    pts.forEach(q => ell(ctx, cx + q.x, cy + q.y, q.r + 2.6, q.r + 2.6, dark));
    pts.forEach(q => ell(ctx, cx + q.x, cy + q.y, q.r, q.r, fill));
  }
  function ringPts(R, r, n, a0, a1) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / (n - 1)) * (a1 - a0);
      pts.push({ x: Math.cos(a) * R, y: Math.sin(a) * R, r });
    }
    return pts;
  }

  /* ================= 얼굴 파츠 ================= */
  function eye(ctx, x, y, r, dark, blink) {
    if (blink) {
      stroke(ctx, dark, 3, c => { c.moveTo(x - r, y); c.quadraticCurveTo(x, y + r * 0.9, x + r, y); });
      return;
    }
    ell(ctx, x, y, r, r * 1.1, dark);
    ell(ctx, x - r * 0.32, y - r * 0.35, r * 0.36, r * 0.36, '#FFFFFF');
    ell(ctx, x + r * 0.3, y + r * 0.32, r * 0.17, r * 0.17, 'rgba(255,255,255,0.9)');
  }
  // 어두운 패치 위에 그리는 흰 눈(판다·라쿤)
  function whiteEye(ctx, x, y, r, dark, blink) {
    if (blink) {
      stroke(ctx, '#FFFFFF', 3, c => { c.moveTo(x - r, y); c.quadraticCurveTo(x, y + r * 0.9, x + r, y); });
      return;
    }
    ell(ctx, x, y, r, r * 1.05, '#FFFFFF');
    ell(ctx, x + r * 0.05, y + r * 0.1, r * 0.55, r * 0.6, dark);
    ell(ctx, x - r * 0.25, y - r * 0.25, r * 0.22, r * 0.22, '#FFFFFF');
  }
  function smile(ctx, dark, x, y, w) {
    stroke(ctx, dark, 2.8, c => { c.moveTo(x - w, y); c.quadraticCurveTo(x, y + w * 1.1, x + w, y); });
  }
  function catMouth(ctx, dark, x, y, w) {
    stroke(ctx, dark, 2.6, c => {
      c.moveTo(x - w, y);
      c.quadraticCurveTo(x - w / 2, y + w * 1.1, x, y);
      c.quadraticCurveTo(x + w / 2, y + w * 1.1, x + w, y);
    });
  }
  function blushPair(ctx, dx, y, r, col) {
    const c = col || 'rgba(246,140,168,0.42)';
    ell(ctx, -dx, y, r, r * 0.62, c);
    ell(ctx, dx, y, r, r * 0.62, c);
  }
  function face(ctx, p, t, o) {
    o = o || {};
    const y = o.y != null ? o.y : -70;
    const dx = o.dx != null ? o.dx : 10;
    const r = o.r != null ? o.r : 4.5;
    eye(ctx, -dx, y, r, p.dark, t.blink);
    eye(ctx, dx, y, r, p.dark, t.blink);
    if (o.blush !== false) blushPair(ctx, o.bx != null ? o.bx : dx + 8, y + (o.byOff != null ? o.byOff : 8), 4.8, o.blushCol);
    if (o.mouth === 'cat') catMouth(ctx, p.dark, 0, y + (o.myOff != null ? o.myOff : 8), o.mw || 4);
    else if (o.mouth !== false) smile(ctx, p.dark, o.mx || 0, y + (o.myOff != null ? o.myOff : 9), o.mw || 4);
  }

  /* ================= 몸통 파츠 ================= */
  function legs(ctx, p, t, o) {
    o = o || {};
    const sp = o.spread != null ? o.spread : 12;
    const r = o.r != null ? o.r : 7;
    const h = o.h != null ? o.h : 13;
    const fill = o.fill || p.primary;
    const lift = Math.sin(t.phase) * 5.5 * t.walk;
    mirror(s => {
      const up = Math.max(0, s > 0 ? lift : -lift);
      rrect(ctx, s * sp - r, -h - up, r * 2, h + 2, r, fill, p.dark);
    });
  }
  function arms(ctx, p, t, o) {
    o = o || {};
    const x = o.x != null ? o.x : 20;
    const y = o.y != null ? o.y : -36;
    const rx = o.rx != null ? o.rx : 6.5;
    const ry = o.ry != null ? o.ry : 10;
    const sw = Math.sin(t.phase) * 0.35 * t.walk;
    ell(ctx, -x, y, rx, ry, o.fill || p.primary, p.dark, 3.5, 0.5 + sw);
    ell(ctx, x, y, rx, ry, o.fill || p.primary, p.dark, 3.5, -0.5 - sw);
  }
  function body(ctx, p, o) {
    o = o || {};
    const y = o.y != null ? o.y : -31;
    const rx = o.rx != null ? o.rx : 22;
    const ry = o.ry != null ? o.ry : 20;
    ell(ctx, 0, y, rx, ry, o.fill || p.primary, p.dark);
    if (o.belly !== false) ell(ctx, 0, y + 3, rx * 0.55, ry * 0.55, o.bellyFill || p.secondary);
  }
  function head(ctx, p, o) {
    o = o || {};
    ell(ctx, o.x || 0, o.y != null ? o.y : -70, o.rx != null ? o.rx : 28, o.ry != null ? o.ry : 26, o.fill || p.primary, p.dark);
  }

  /* ================= 종별 드로잉 ================= */
  const SPECIES = {};

  // ---- 마스코트: 플라밍고 ----
  SPECIES.flamingo = function (ctx, p, t) {
    const legCol = '#E0789B';
    const bodyY = -58;
    if (t.walk > 0.05) {
      mirror(s => {
        const ph = t.phase + (s > 0 ? 0 : Math.PI);
        const lift = Math.max(0, Math.sin(ph)) * 10 * t.walk;
        const xo = s * 6 + Math.cos(ph) * 3 * t.walk;
        tube(ctx, p.dark, legCol, 3.2, c => { c.moveTo(s * 5, bodyY + 8); c.lineTo(xo, -15 - lift); c.lineTo(xo + 1, -3 - lift); });
        ell(ctx, xo + 2.5, -2.5 - lift, 6, 2.8, legCol, p.dark, 2.4);
      });
    } else {
      // 시그니처 한 다리 서기
      tube(ctx, p.dark, legCol, 3.2, c => { c.moveTo(4, bodyY + 8); c.lineTo(4, -16); c.lineTo(5, -3); });
      ell(ctx, 7, -2.5, 6.5, 2.8, legCol, p.dark, 2.4);
      tube(ctx, p.dark, legCol, 3.2, c => { c.moveTo(-4, bodyY + 8); c.lineTo(-13, -32); c.lineTo(-4, -40); });
    }
    // 꼬리 깃
    fluff(ctx, -20, bodyY - 5, [{ x: 0, y: 2, r: 6 }, { x: -5, y: -4, r: 5.2 }, { x: 0, y: -9, r: 4.4 }], p.accent, p.dark);
    // 몸통(달걀형)
    ell(ctx, 0, bodyY, 21, 16, p.primary, p.dark);
    // 접힌 날개
    ell(ctx, 1, bodyY + 1, 12, 7.5, p.accent, p.dark, 3, 0.18);
    stroke(ctx, p.dark, 2, c => { c.moveTo(-6, bodyY + 4); c.quadraticCurveTo(1, bodyY + 7, 9, bodyY + 3); });
    // S커브 목
    tube(ctx, p.dark, p.primary, 9, c => {
      c.moveTo(4, bodyY - 6);
      c.bezierCurveTo(16, -82, -10, -88, 1, -98);
    });
    // 머리
    ell(ctx, 2, -104, 22, 20, p.primary, p.dark);
    // 굽은 부리(아래로 매달린 물방울꼴)
    shape(ctx, p.secondary, p.dark, 3.4, c => {
      c.moveTo(-6.5, -97);
      c.quadraticCurveTo(-8.5, -82, 0, -75);
      c.quadraticCurveTo(8.5, -82, 6.5, -97);
      c.quadraticCurveTo(0, -101, -6.5, -97);
      c.closePath();
    });
    // 부리 끝 검정
    shape(ctx, '#3A2730', null, 0, c => {
      c.moveTo(-5.6, -85);
      c.quadraticCurveTo(0, -89, 5.6, -85);
      c.quadraticCurveTo(4, -77.5, 0, -75.5);
      c.quadraticCurveTo(-4, -77.5, -5.6, -85);
      c.closePath();
    });
    // 머리 깃 한 가닥
    tube(ctx, p.dark, p.accent, 2.4, c => { c.moveTo(4, -122); c.quadraticCurveTo(9, -131, 16, -129); });
    ell(ctx, 17, -129, 3, 3, p.accent, p.dark, 2.2);
    // 얼굴
    eye(ctx, -8.5, -108, 4.6, p.dark, t.blink);
    eye(ctx, 12.5, -108, 4.6, p.dark, t.blink);
    blushPair(ctx, 18, -99, 4.6, 'rgba(255,255,255,0.5)');
  };

  SPECIES.rabbit = function (ctx, p, t) {
    const wig = Math.sin(t.t * 3 + t.phase) * 0.06;
    ell(ctx, -12, -100, 7.5, 20, p.primary, p.dark, 3.6, -0.18 + wig);
    ell(ctx, 12, -100, 7.5, 20, p.primary, p.dark, 3.6, 0.18 - wig);
    ell(ctx, -12, -99, 3.6, 13, p.accent, null, 0, -0.18 + wig);
    ell(ctx, 12, -99, 3.6, 13, p.accent, null, 0, 0.18 - wig);
    ell(ctx, -23, -30, 7, 7, p.secondary, p.dark, 3); // 복슬 꼬리
    legs(ctx, p, t);
    body(ctx, p, { rx: 20, ry: 19 });
    head(ctx, p, { y: -68, rx: 27, ry: 25 });
    ell(ctx, 0, -60, 3.4, 2.4, p.accent); // 코
    rrect(ctx, -3.2, -58, 6.4, 6.5, 2.5, '#FFFFFF', p.dark, 2.2); // 앞니
    face(ctx, p, t, { y: -70, dx: 10.5, mouth: false });
  };

  SPECIES.fox = function (ctx, p, t) {
    // 복슬 꼬리
    ell(ctx, 24, -26, 16, 9.5, p.primary, p.dark, 3.6, 0.55);
    ell(ctx, 33, -17, 6.5, 5.5, p.secondary, p.dark, 3);
    mirror(s => {
      tri(ctx, s * 25, -80, s * 15, -104, s * 4, -86, p.primary, p.dark, 3.8);
      tri(ctx, s * 20, -84, s * 14, -98, s * 8, -86, p.accent, null, 0);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 21, ry: 19 });
    head(ctx, p, { y: -68, rx: 29, ry: 25 });
    ell(ctx, 0, -59, 12, 8.5, p.secondary); // 주둥이 패치
    ell(ctx, 0, -62, 3.4, 2.6, p.dark); // 코
    face(ctx, p, t, { y: -71, dx: 11.5, myOff: 6, mw: 3.6 });
  };

  SPECIES.panda = function (ctx, p, t) {
    mirror(s => ell(ctx, s * 19, -90, 9.5, 9, p.accent, p.dark, 3.4));
    legs(ctx, p, t, { fill: p.accent });
    body(ctx, p, { fill: p.secondary, rx: 22, ry: 20, belly: false });
    arms(ctx, p, t, { fill: p.accent, x: 20, y: -37 });
    head(ctx, p, { y: -68, rx: 28, ry: 25, fill: p.secondary });
    // 눈 패치
    ell(ctx, -10.5, -68, 7.5, 9.5, p.accent, null, 0, -0.28);
    ell(ctx, 10.5, -68, 7.5, 9.5, p.accent, null, 0, 0.28);
    whiteEye(ctx, -10, -68, 3.6, p.dark, t.blink);
    whiteEye(ctx, 11, -68, 3.6, p.dark, t.blink);
    ell(ctx, 0, -58, 3.6, 2.6, p.dark);
    smile(ctx, p.dark, 0, -55, 3.6);
    blushPair(ctx, 20, -58, 4.4);
  };

  SPECIES.cat = function (ctx, p, t) {
    // 말린 꼬리
    tube(ctx, p.dark, p.primary, 5.5, c => { c.moveTo(20, -26); c.quadraticCurveTo(36, -38, 32, -52); c.quadraticCurveTo(29, -59, 23, -56); });
    mirror(s => {
      tri(ctx, s * 24, -82, s * 15, -103, s * 4, -87, p.primary, p.dark, 3.8);
      tri(ctx, s * 19, -85, s * 14, -97, s * 8, -87, p.secondary, null, 0);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 20, ry: 19 });
    // 몸 줄무늬
    stroke(ctx, p.accent, 3, c => { c.moveTo(-16, -38); c.quadraticCurveTo(-12, -34, -14, -28); });
    stroke(ctx, p.accent, 3, c => { c.moveTo(16, -38); c.quadraticCurveTo(12, -34, 14, -28); });
    head(ctx, p, { y: -68, rx: 28, ry: 25 });
    // 이마 줄무늬
    [-8, 0, 8].forEach(x => stroke(ctx, p.accent, 3.2, c => { c.moveTo(x, -90); c.lineTo(x * 0.85, -82); }));
    ell(ctx, 0, -58, 10.5, 7.5, p.secondary);
    ell(ctx, 0, -61, 2.9, 2.2, p.accent);
    // 수염
    mirror(s => {
      stroke(ctx, 'rgba(60,47,35,0.55)', 1.6, c => { c.moveTo(s * 22, -63); c.lineTo(s * 32, -65); });
      stroke(ctx, 'rgba(60,47,35,0.55)', 1.6, c => { c.moveTo(s * 22, -58); c.lineTo(s * 32, -57); });
    });
    face(ctx, p, t, { y: -70, dx: 11, mouth: 'cat', myOff: 12, mw: 3.4, bx: 19 });
  };

  SPECIES.dog = function (ctx, p, t) {
    // 위로 말린 꼬리
    tube(ctx, p.dark, p.primary, 6.5, c => { c.moveTo(18, -32); c.quadraticCurveTo(30, -44, 22, -50); });
    ell(ctx, 23, -48, 4.5, 4, p.secondary);
    mirror(s => {
      tri(ctx, s * 23, -83, s * 16, -102, s * 5, -88, p.primary, p.dark, 3.8);
      tri(ctx, s * 18, -86, s * 15, -96, s * 9, -88, p.secondary, null, 0);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 21, ry: 19.5 });
    head(ctx, p, { y: -68, rx: 28.5, ry: 25.5 });
    ell(ctx, 0, -58, 13, 9.5, p.secondary); // 주둥이
    ell(ctx, 0, -62, 3.5, 2.7, p.dark);
    mirror(s => ell(ctx, s * 10.5, -80, 3.4, 2.2, p.secondary)); // 시바 눈썹점
    face(ctx, p, t, { y: -71, dx: 11, myOff: 6.5, mw: 4 });
  };

  SPECIES.penguin = function (ctx, p, t) {
    ctx.save();
    ctx.translate(0, -40);
    ctx.rotate(Math.sin(t.phase) * 0.09 * t.walk); // 뒤뚱뒤뚱
    ctx.translate(0, 40);
    mirror(s => ell(ctx, s * 10, -4, 8.5, 4, p.accent, p.dark, 3)); // 발
    ell(ctx, 0, -42, 29, 38, p.primary, p.dark); // 달걀 몸
    ell(ctx, 0, -34, 19, 26, p.secondary); // 배+얼굴 패치
    ell(ctx, 0, -58, 17, 13, p.secondary);
    mirror(s => ell(ctx, s * 28, -42, 7, 15, p.primary, p.dark, 3.4, s * -0.35)); // 플리퍼
    tri(ctx, -5, -55, 5, -55, 0, -48, p.accent, p.dark, 2.8); // 부리
    face(ctx, p, t, { y: -61, dx: 9.5, mouth: false, bx: 16, byOff: 7 });
    ctx.restore();
  };

  SPECIES.owl = function (ctx, p, t) {
    mirror(s => ell(ctx, s * 9, -4, 6.5, 3.4, p.accent, p.dark, 2.8));
    ell(ctx, 0, -32, 23, 23, p.primary, p.dark);
    ell(ctx, 0, -28, 14.5, 16, p.secondary);
    // 배 무늬
    [-20, -13].forEach((y, i) => {
      [-6 + i * 3, 6 - i * 3].forEach(x => stroke(ctx, '#C9A87C', 2.2, c => { c.moveTo(x - 3.5, y); c.lineTo(x, y + 3.5); c.lineTo(x + 3.5, y); }));
    });
    mirror(s => ell(ctx, s * 22, -34, 7, 14, p.primary, p.dark, 3.4, s * -0.3));
    mirror(s => tri(ctx, s * 24, -84, s * 17, -102, s * 8, -90, p.primary, p.dark, 3.6)); // 귀깃
    head(ctx, p, { y: -70, rx: 29, ry: 26 });
    mirror(s => ell(ctx, s * 11, -72, 10, 10, p.secondary)); // 눈 링
    eye(ctx, -11, -72, 5.6, p.dark, t.blink);
    eye(ctx, 11, -72, 5.6, p.dark, t.blink);
    tri(ctx, -4, -66, 4, -66, 0, -59, p.accent, p.dark, 2.6);
    blushPair(ctx, 21, -62, 4.4);
  };

  SPECIES.lion = function (ctx, p, t) {
    tube(ctx, p.dark, p.primary, 4.5, c => { c.moveTo(20, -28); c.quadraticCurveTo(32, -32, 33, -44); });
    ell(ctx, 33, -47, 5, 6, p.accent, p.dark, 2.8); // 꼬리 술
    legs(ctx, p, t);
    body(ctx, p, { rx: 21, ry: 19.5 });
    // 갈기(몽글 링)
    fluff(ctx, 0, -70, ringPts(31, 11, 12, 0, TAU * (11 / 12)), p.accent, p.dark);
    mirror(s => ell(ctx, s * 21, -92, 7, 7, p.primary, p.dark, 3));
    head(ctx, p, { y: -70, rx: 26, ry: 24 });
    ell(ctx, 0, -60, 11, 8, p.secondary);
    ell(ctx, 0, -63, 3.4, 2.6, '#8A5A30');
    face(ctx, p, t, { y: -72, dx: 10.5, myOff: 7, mw: 3.6, bx: 18 });
  };

  SPECIES.tiger = function (ctx, p, t) {
    // 줄무늬 꼬리
    tube(ctx, p.dark, p.primary, 5.5, c => { c.moveTo(20, -26); c.quadraticCurveTo(34, -34, 32, -48); });
    [[27.5, -33.5], [31, -41.5]].forEach(q => stroke(ctx, p.accent, 3, c => { c.moveTo(q[0] - 2.5, q[1] + 2.5); c.lineTo(q[0] + 2.5, q[1] - 1.5); }));
    mirror(s => {
      ell(ctx, s * 19, -90, 9, 8.5, p.primary, p.dark, 3.4);
      ell(ctx, s * 19, -89, 4.5, 4.2, p.secondary);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 21, ry: 19.5 });
    stroke(ctx, p.accent, 3.2, c => { c.moveTo(-17, -37); c.quadraticCurveTo(-13, -32, -15, -26); });
    stroke(ctx, p.accent, 3.2, c => { c.moveTo(17, -37); c.quadraticCurveTo(13, -32, 15, -26); });
    head(ctx, p, { y: -68, rx: 28.5, ry: 25.5 });
    // 이마·볼 줄무늬
    [-7, 0, 7].forEach(x => tri(ctx, x - 2.6, -92, x + 2.6, -92, x * 0.85, -83, p.accent, null, 0));
    mirror(s => {
      tri(ctx, s * 27, -74, s * 27, -68, s * 18, -71, p.accent, null, 0);
      tri(ctx, s * 26, -63, s * 25, -57, s * 17, -61, p.accent, null, 0);
    });
    ell(ctx, 0, -58, 10.5, 7.5, p.secondary);
    ell(ctx, 0, -61, 3, 2.3, p.accent);
    face(ctx, p, t, { y: -71, dx: 10.5, mouth: 'cat', myOff: 12, mw: 3.2, bx: 19, byOff: 5 });
  };

  SPECIES.elephant = function (ctx, p, t) {
    // 큰 귀 (머리 뒤)
    mirror(s => {
      ell(ctx, s * 29, -72, 15, 19, p.primary, p.dark, 3.8, s * 0.15);
      ell(ctx, s * 29, -72, 9.5, 13, p.accent, null, 0, s * 0.15);
    });
    legs(ctx, p, t, { spread: 13, r: 8 });
    body(ctx, p, { rx: 24, ry: 21 });
    head(ctx, p, { y: -70, rx: 27, ry: 24.5 });
    // 코
    tube(ctx, p.dark, p.primary, 8.5, c => { c.moveTo(0, -62); c.quadraticCurveTo(-2, -46, 3, -40); c.quadraticCurveTo(8, -36, 12, -40); });
    ell(ctx, 13, -41, 2.2, 2.2, p.dark);
    face(ctx, p, t, { y: -73, dx: 11, mouth: false, bx: 20, byOff: 6, blushCol: 'rgba(240,167,180,0.65)' });
  };

  SPECIES.giraffe = function (ctx, p, t) {
    legs(ctx, p, t, { h: 17, spread: 12 });
    body(ctx, p, { y: -36, rx: 22, ry: 18 });
    mirror(s => ell(ctx, s * 12, -36, 4.2, 4.2, p.accent)); // 몸 반점
    // 긴 목
    tube(ctx, p.dark, p.primary, 12.5, c => { c.moveTo(0, -44); c.quadraticCurveTo(3, -70, 1, -88); });
    ell(ctx, -3, -60, 3.6, 3.6, p.accent);
    ell(ctx, 4, -74, 3.4, 3.4, p.accent);
    // 오시콘 뿔
    mirror(s => {
      stroke(ctx, p.dark, 3.4, c => { c.moveTo(s * 7, -112); c.lineTo(s * 9, -122); });
      ell(ctx, s * 9.5, -124, 4, 4, p.accent, p.dark, 2.6);
    });
    mirror(s => ell(ctx, s * 21, -100, 7.5, 5, p.primary, p.dark, 3, s * 0.5)); // 귀
    head(ctx, p, { y: -98, rx: 22, ry: 19 });
    ell(ctx, 0, -90, 11, 7.5, p.secondary);
    mirror(s => ell(ctx, s * 3.4, -91, 1.6, 2.2, p.dark)); // 콧구멍
    face(ctx, p, t, { y: -101, dx: 9.5, mouth: false, bx: 17, byOff: 6 });
    smile(ctx, p.dark, 0, -87, 3.2);
  };

  SPECIES.monkey = function (ctx, p, t) {
    // 긴 말린 꼬리
    tube(ctx, p.dark, p.primary, 4.5, c => { c.moveTo(18, -24); c.quadraticCurveTo(36, -28, 36, -46); c.quadraticCurveTo(35, -55, 28, -53); });
    mirror(s => {
      ell(ctx, s * 26, -70, 8.5, 8.5, p.primary, p.dark, 3.4);
      ell(ctx, s * 26, -70, 4.6, 4.6, p.secondary);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 20, ry: 19 });
    arms(ctx, p, t, { x: 19, y: -36 });
    head(ctx, p, { y: -68, rx: 26, ry: 24 });
    // 얼굴 패치(하트 느낌)
    ell(ctx, -8, -73, 9.5, 10.5, p.secondary);
    ell(ctx, 8, -73, 9.5, 10.5, p.secondary);
    ell(ctx, 0, -62, 13, 10, p.secondary);
    stroke(ctx, p.dark, 2.4, c => { c.moveTo(-3, -92); c.quadraticCurveTo(0, -98, 5, -95); }); // 머리털
    ell(ctx, 0, -62, 3, 2.2, p.accent);
    face(ctx, p, t, { y: -72, dx: 9, myOff: 14, mw: 4, bx: 18, byOff: 6 });
  };

  SPECIES.frog = function (ctx, p, t) {
    legs(ctx, p, t, { spread: 15, r: 7.5, h: 10 });
    // 머리+몸 한 덩어리
    ell(ctx, 0, -48, 28, 33, p.primary, p.dark);
    ell(ctx, 0, -32, 16.5, 15, p.secondary);
    // 위로 볼록 눈
    mirror(s => {
      ell(ctx, s * 14, -82, 9, 9, p.primary, p.dark, 3.6);
      eye(ctx, s * 14, -82, 4.6, p.dark, t.blink);
    });
    blushPair(ctx, 21, -55, 5, 'rgba(242,232,99,0.75)');
    smile(ctx, p.dark, 0, -60, 10);
    mirror(s => ell(ctx, s * 4, -68, 1.5, 1.5, p.dark)); // 콧구멍
  };

  SPECIES.turtle = function (ctx, p, t) {
    legs(ctx, p, t, { spread: 17, r: 7, h: 9 });
    // 등껍질
    ell(ctx, 0, -38, 27, 24, p.accent, p.dark);
    shape(ctx, null, 'rgba(49,67,31,0.5)', 2.6, c => {
      c.moveTo(-14, -46); c.lineTo(-5, -52); c.lineTo(6, -50); c.lineTo(14, -42);
      c.moveTo(-5, -52); c.lineTo(-6, -38); c.moveTo(6, -50); c.lineTo(4, -37);
      c.moveTo(-16, -32); c.lineTo(-6, -38); c.lineTo(4, -37); c.lineTo(15, -30);
    });
    ell(ctx, 0, -20, 22, 7.5, p.secondary, p.dark, 3); // 껍질 테두리
    // 머리
    head(ctx, p, { y: -72, rx: 17.5, ry: 16 });
    face(ctx, p, t, { y: -74, dx: 7.5, r: 3.8, myOff: 7.5, mw: 3.2, bx: 13, byOff: 6 });
  };

  SPECIES.bear = function (ctx, p, t) {
    mirror(s => {
      ell(ctx, s * 18, -89, 9, 8.5, p.primary, p.dark, 3.4);
      ell(ctx, s * 18, -88, 4.6, 4.2, p.secondary);
    });
    legs(ctx, p, t, { spread: 13, r: 8 });
    body(ctx, p, { rx: 23, ry: 21 });
    arms(ctx, p, t, { x: 21, y: -37, rx: 7, ry: 11 });
    head(ctx, p, { y: -68, rx: 28, ry: 25 });
    ell(ctx, 0, -58, 12, 9, p.secondary);
    ell(ctx, 0, -62, 3.8, 2.9, p.dark);
    face(ctx, p, t, { y: -71, dx: 11, myOff: 7, mw: 3.6 });
  };

  SPECIES.pig = function (ctx, p, t) {
    // 나선 꼬리
    tube(ctx, p.dark, p.primary, 3.6, c => { c.moveTo(20, -30); c.quadraticCurveTo(28, -34, 26, -40); c.quadraticCurveTo(24, -44, 21, -41); });
    mirror(s => {
      tri(ctx, s * 10, -88, s * 26, -94, s * 24, -78, p.primary, p.dark, 3.6);
      tri(ctx, s * 14, -87, s * 23, -90, s * 22, -81, p.accent, null, 0);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 22, ry: 20 });
    head(ctx, p, { y: -66, rx: 28, ry: 25 });
    // 들창코
    ell(ctx, 0, -60, 9.5, 7, p.accent, p.dark, 3);
    mirror(s => ell(ctx, s * 3.6, -60, 1.7, 2.6, p.dark));
    face(ctx, p, t, { y: -70, dx: 11.5, mouth: false, bx: 20, byOff: 4 });
    smile(ctx, p.dark, 0, -50, 3.4);
  };

  SPECIES.chick = function (ctx, p, t) {
    mirror(s => ell(ctx, s * 7, -3, 5.5, 3, p.accent, p.dark, 2.6)); // 발
    ell(ctx, 0, -30, 24, 26, p.primary, p.dark); // 몸+머리 한 덩이
    ell(ctx, 0, -20, 13, 11, p.secondary);
    mirror(s => ell(ctx, s * 22, -30, 6, 10, p.primary, p.dark, 3, s * -0.3)); // 짧은 날개
    // 머리 위 삐죽 털
    tube(ctx, p.dark, p.primary, 2.6, c => { c.moveTo(0, -55); c.quadraticCurveTo(-2, -63, -7, -62); });
    tube(ctx, p.dark, p.primary, 2.6, c => { c.moveTo(1, -55); c.quadraticCurveTo(4, -64, 8, -62); });
    tri(ctx, -4, -37, 4, -37, 0, -31, p.accent, p.dark, 2.6); // 부리
    face(ctx, p, t, { y: -41, dx: 9, r: 4.2, mouth: false, bx: 16, byOff: 6 });
  };

  SPECIES.hedgehog = function (ctx, p, t) {
    // 가시 링(머리 위·옆만 덮는 부채꼴)
    shape(ctx, p.accent, p.dark, 3.4, c => {
      const cx = 0, cy = -56, R1 = 25, R2 = 41, n = 9;
      const a0 = Math.PI * 0.95, a1 = Math.PI * 2.05; // 왼쪽→위→오른쪽
      c.moveTo(cx + Math.cos(a0) * R1, cy + Math.sin(a0) * R1);
      for (let i = 0; i < n; i++) {
        const am = a0 + ((i + 0.5) / n) * (a1 - a0);
        const ab = a0 + ((i + 1) / n) * (a1 - a0);
        c.lineTo(cx + Math.cos(am) * R2, cy + Math.sin(am) * R2);
        c.lineTo(cx + Math.cos(ab) * R1, cy + Math.sin(ab) * R1);
      }
      c.closePath();
    });
    legs(ctx, p, t, { spread: 10, r: 6, h: 9, fill: p.primary });
    ell(ctx, 0, -46, 21, 23, p.secondary, p.dark); // 얼굴+배 한 덩이
    tri(ctx, -5, -45, 5, -45, 0, -35, p.secondary, p.dark, 3); // 뾰족 주둥이
    ell(ctx, 0, -36, 3.2, 2.6, p.dark); // 코
    face(ctx, p, t, { y: -56, dx: 9, r: 4, mouth: false, bx: 15, byOff: 7 });
    smile(ctx, p.dark, 0, -47, 3);
  };

  SPECIES.otter = function (ctx, p, t) {
    // 두툼한 꼬리
    ell(ctx, 20, -16, 15, 8, p.accent, p.dark, 3.6, 0.4);
    legs(ctx, p, t, { spread: 11, r: 6.5, h: 9 });
    body(ctx, p, { y: -34, rx: 19, ry: 24 }); // 길쭉한 몸
    // 조개
    ell(ctx, 0, -36, 7, 6, '#C9A0C9', p.dark, 2.8);
    stroke(ctx, p.dark, 1.8, c => { c.moveTo(-4, -36); c.lineTo(4, -36); });
    mirror(s => ell(ctx, s * 13, -38, 6, 8.5, p.primary, p.dark, 3.2, s * 0.7)); // 조개 잡은 손
    mirror(s => ell(ctx, s * 20, -86, 6, 6, p.primary, p.dark, 3)); // 작은 귀
    head(ctx, p, { y: -70, rx: 26, ry: 23 });
    ell(ctx, 0, -60, 13, 9.5, p.secondary);
    ell(ctx, 0, -64, 3.4, 2.6, p.dark);
    mirror(s => { ell(ctx, s * 7, -59, 1, 1, p.dark); ell(ctx, s * 10, -57, 1, 1, p.dark); }); // 수염 점
    face(ctx, p, t, { y: -73, dx: 10, myOff: 8, mw: 3.4 });
  };

  /* ---- NPC 8종 ---- */
  SPECIES.capybara = function (ctx, p, t) {
    legs(ctx, p, t, { spread: 14, r: 7, h: 10 });
    rrect(ctx, -24, -52, 48, 42, 16, p.primary, p.dark); // 각진 몸
    ell(ctx, 0, -30, 14, 11, p.secondary);
    mirror(s => ell(ctx, s * 15, -97, 6, 5.5, p.primary, p.dark, 3)); // 귀
    rrect(ctx, -23, -98, 46, 44, 17, p.primary, p.dark); // 각진 머리
    rrect(ctx, -13, -74, 26, 17, 8, p.secondary); // 뭉툭 주둥이
    mirror(s => ell(ctx, s * 5, -68, 1.8, 2.6, p.dark));
    // 반쯤 감긴 느긋한 눈
    mirror(s => {
      if (t.blink) { stroke(ctx, p.dark, 2.8, c => { c.moveTo(s * 12 - 3.5, -82); c.lineTo(s * 12 + 3.5, -82); }); }
      else {
        shape(ctx, p.dark, null, 0, c => c.ellipse(s * 12, -82, 3.6, 2.6, 0, 0, Math.PI));
        ell(ctx, s * 12 - 1, -82.5, 1, 1, '#FFFFFF');
      }
    });
    blushPair(ctx, 19, -74, 4.4);
    // 머리 위 귤
    ell(ctx, 8, -102, 6.5, 6, '#F5A03C', p.dark, 2.8);
    ell(ctx, 8, -105.5, 1.6, 1.6, '#C97B22');
    ell(ctx, 12, -107, 3.4, 2, '#7FB069', p.dark, 1.8, -0.5);
  };

  SPECIES.pigeon = function (ctx, p, t) {
    mirror(s => ell(ctx, s * 8, -3, 6, 3, '#D96D5A', p.dark, 2.6));
    ell(ctx, 0, -34, 22, 26, p.primary, p.dark);
    ell(ctx, 0, -26, 13, 15, p.secondary);
    mirror(s => ell(ctx, s * 20, -36, 6.5, 13, p.accent, p.dark, 3.2, s * -0.3)); // 날개
    // 목 링(무지개빛 느낌)
    ell(ctx, 0, -52, 12, 6.5, '#8FBF9F');
    const bob = Math.sin(t.phase * 2) * 2 * t.walk; // 고개 까딱
    ctx.save();
    ctx.translate(0, bob);
    ell(ctx, 0, -70, 19, 17, p.primary, p.dark);
    tri(ctx, -4, -66, 4, -66, 0, -59, '#E8A13C', p.dark, 2.6);
    face(ctx, p, t, { y: -73, dx: 8, r: 4, mouth: false, bx: 14, byOff: 6 });
    ctx.restore();
    // 우체부 가방
    stroke(ctx, '#8A6B4A', 3.6, c => { c.moveTo(-13, -52); c.lineTo(13, -30); });
    rrect(ctx, 7, -32, 15, 13, 4, '#A97E52', p.dark, 3);
    rrect(ctx, 7, -32, 15, 6, 3, '#C99B62', p.dark, 2.2);
  };

  SPECIES.alpaca = function (ctx, p, t) {
    legs(ctx, p, t, { spread: 12, r: 6, h: 14, fill: p.secondary });
    // 양털 구름 몸
    fluff(ctx, 0, -34, [
      { x: -14, y: 2, r: 11 }, { x: 14, y: 2, r: 11 }, { x: -10, y: -8, r: 10 },
      { x: 10, y: -8, r: 10 }, { x: 0, y: 4, r: 12 }, { x: 0, y: -10, r: 10 },
    ], p.primary, p.dark);
    // 긴 목
    tube(ctx, p.dark, p.primary, 12, c => { c.moveTo(0, -42); c.lineTo(0, -82); });
    mirror(s => ell(ctx, s * 13, -100, 5, 8, p.primary, p.dark, 3, s * 0.25)); // 귀
    head(ctx, p, { y: -90, rx: 17, ry: 15.5 });
    // 머리 위 뽀글 털
    fluff(ctx, 0, -103, [{ x: -8, y: 0, r: 5.5 }, { x: 0, y: -2.5, r: 6 }, { x: 8, y: 0, r: 5.5 }], p.secondary, p.dark);
    ell(ctx, 0, -83, 8.5, 6.5, p.secondary);
    mirror(s => ell(ctx, s * 2.8, -84, 1.2, 1.8, p.dark));
    face(ctx, p, t, { y: -92, dx: 7.5, r: 3.8, mouth: false, bx: 13, byOff: 5 });
    smile(ctx, p.dark, 0, -80, 2.8);
  };

  SPECIES.raccoon = function (ctx, p, t) {
    // 줄무늬 꼬리
    ell(ctx, 23, -24, 15, 9, p.primary, p.dark, 3.4, 0.5);
    stroke(ctx, p.accent, 5, c => { c.moveTo(19, -22); c.lineTo(24, -29); });
    stroke(ctx, p.accent, 5, c => { c.moveTo(27, -17); c.lineTo(32, -24); });
    mirror(s => {
      tri(ctx, s * 23, -82, s * 15, -101, s * 4, -86, p.primary, p.dark, 3.6);
      tri(ctx, s * 18, -85, s * 14, -95, s * 8, -86, p.secondary, null, 0);
    });
    legs(ctx, p, t);
    body(ctx, p, { rx: 21, ry: 19.5 });
    head(ctx, p, { y: -68, rx: 28, ry: 25 });
    // 도둑 마스크
    shape(ctx, p.accent, null, 0, c => {
      c.ellipse(-11, -70, 11, 7, -0.18, 0, TAU);
      c.ellipse(11, -70, 11, 7, 0.18, 0, TAU);
    });
    whiteEye(ctx, -10.5, -70, 3.8, p.dark, t.blink);
    whiteEye(ctx, 10.5, -70, 3.8, p.dark, t.blink);
    ell(ctx, 0, -58, 10, 7.5, p.secondary);
    ell(ctx, 0, -61, 3.2, 2.4, p.dark);
    smile(ctx, p.dark, 0, -56, 3.4);
    blushPair(ctx, 20, -58, 4.2);
  };

  SPECIES.goat = function (ctx, p, t) {
    // 뿔
    mirror(s => tube(ctx, p.dark, '#C9B896', 4.5, c => { c.moveTo(s * 10, -90); c.quadraticCurveTo(s * 16, -104, s * 24, -106); }));
    mirror(s => ell(ctx, s * 25, -78, 8, 4.6, p.primary, p.dark, 3, s * 0.35)); // 옆 귀
    legs(ctx, p, t, { h: 14 });
    body(ctx, p, { rx: 21, ry: 19 });
    head(ctx, p, { y: -68, rx: 26, ry: 24 });
    // 턱수염
    tri(ctx, -4.5, -47, 4.5, -47, 0, -35, p.secondary, p.dark, 2.8);
    ell(ctx, 0, -58, 9.5, 7, p.secondary);
    mirror(s => ell(ctx, s * 3, -59, 1.4, 2, p.dark));
    face(ctx, p, t, { y: -71, dx: 10, myOff: 6, mw: 3.2 });
  };

  SPECIES.parrot = function (ctx, p, t) {
    // 꼬리깃
    [[-6, '#4CAF6D'], [0, p.accent], [6, '#E86A5A']].forEach(q => {
      ell(ctx, 12 + q[0], -16, 5, 12, q[1], p.dark, 2.8, 0.5);
    });
    mirror(s => ell(ctx, s * 8, -3, 5.5, 3, '#8A8A8A', p.dark, 2.4));
    ell(ctx, 0, -34, 21, 24, p.primary, p.dark);
    ell(ctx, 0, -28, 12.5, 14, p.secondary);
    mirror(s => ell(ctx, s * 19, -36, 6.5, 13.5, '#3E9A5C', p.dark, 3.2, s * -0.3));
    // 볏
    tube(ctx, p.dark, p.accent, 3.6, c => { c.moveTo(0, -86); c.quadraticCurveTo(-4, -98, -12, -97); });
    tube(ctx, p.dark, '#E86A5A', 3.6, c => { c.moveTo(2, -86); c.quadraticCurveTo(2, -100, -4, -103); });
    head(ctx, p, { y: -68, rx: 23, ry: 21 });
    mirror(s => ell(ctx, s * 9, -70, 7.5, 8.5, p.secondary)); // 눈가 흰 패치
    // 갈고리 부리
    shape(ctx, p.accent, p.dark, 3, c => {
      c.moveTo(-6, -62); c.quadraticCurveTo(0, -66, 6, -62);
      c.quadraticCurveTo(5, -53, 0, -51); c.quadraticCurveTo(-5, -53, -6, -62);
      c.closePath();
    });
    face(ctx, p, t, { y: -70, dx: 9, r: 4.2, mouth: false, bx: 17, byOff: 6 });
  };

  SPECIES.sloth = function (ctx, p, t) {
    legs(ctx, p, t, { spread: 11, r: 6.5, h: 9 });
    body(ctx, p, { y: -30, rx: 22, ry: 20 });
    // 축 늘어진 팔 + 발톱
    mirror(s => {
      ell(ctx, s * 21, -28, 6.5, 13, p.primary, p.dark, 3.4, s * 0.12);
      stroke(ctx, p.dark, 2, c => { c.moveTo(s * 19, -16); c.lineTo(s * 19, -11); c.moveTo(s * 23, -16); c.lineTo(s * 23, -11); });
    });
    head(ctx, p, { y: -66, rx: 28, ry: 25 });
    ell(ctx, 0, -64, 20, 17, p.secondary);
    // 눈 그늘 패치
    ell(ctx, -11, -66, 8.5, 4.6, p.accent, null, 0, 0.45);
    ell(ctx, 11, -66, 8.5, 4.6, p.accent, null, 0, -0.45);
    eye(ctx, -10, -66, 3.2, p.dark, t.blink || Math.sin(t.t * 0.8) > 0.6); // 자주 조는 눈
    eye(ctx, 10, -66, 3.2, p.dark, t.blink || Math.sin(t.t * 0.8) > 0.6);
    ell(ctx, 0, -58, 3.2, 2.4, p.dark);
    smile(ctx, p.dark, 0, -54, 6.5); // 트레이드마크 미소
    blushPair(ctx, 20, -56, 4.2);
  };

  SPECIES.axolotl = function (ctx, p, t) {
    // 프릴 아가미 3쌍
    mirror(s => {
      [[-0.55, 13], [0, 15], [0.55, 13]].forEach((q, i) => {
        const wig = Math.sin(t.t * 2.4 + i) * 0.06;
        const a = q[0] + s * 0.0 + wig;
        const bx = s * 24, by = -72 + q[0] * 14;
        const tx = bx + s * q[1] * Math.cos(a * 0.6), ty = by + q[0] * 8 - 2;
        tube(ctx, p.dark, p.accent, 4.6, c => { c.moveTo(bx, by); c.lineTo(tx, ty); });
        ell(ctx, tx, ty, 3.6, 3.6, p.accent, p.dark, 2.4);
      });
    });
    // 지느러미 꼬리
    ell(ctx, 19, -22, 12, 8, p.secondary, p.dark, 3.2, 0.5);
    legs(ctx, p, t, { spread: 11, r: 6, h: 8 });
    body(ctx, p, { y: -30, rx: 19, ry: 17 });
    head(ctx, p, { y: -66, rx: 29, ry: 25 });
    face(ctx, p, t, { y: -68, dx: 11, r: 4.4, mouth: false, bx: 20, byOff: 6, blushCol: 'rgba(232,138,165,0.6)' });
    smile(ctx, p.dark, 0, -58, 8); // 항상 웃는 입
  };

  // 폴백(등록 안 된 종)
  function generic(ctx, p, t) {
    mirror(s => ell(ctx, s * 17, -88, 8, 8, p.primary, p.dark, 3.4));
    legs(ctx, p, t);
    body(ctx, p, {});
    head(ctx, p, {});
    face(ctx, p, t, {});
  }

  /* ================= 라벨용 머리 꼭대기 높이 ================= */
  const TOP = {
    flamingo: 134, giraffe: 130, chick: 66, penguin: 84, frog: 94, turtle: 92,
    owl: 106, hedgehog: 102, lion: 112, rabbit: 122, elephant: 100,
    capybara: 112, pigeon: 92, alpaca: 112, goat: 110, parrot: 106, sloth: 94, axolotl: 96, otter: 96,
  };

  /* ================= 공개 API ================= */
  function draw(ctx, ch, o) {
    const p = ch.palette;
    const fn = SPECIES[ch.id] || generic;
    const time = o.t || 0;
    const seed = o.seed || 0;
    const cyc = (time + seed * 1.7) % 3.8;
    const t = {
      t: time + seed,
      phase: o.phase || 0,
      walk: o.walk || 0,
      blink: cyc > 3.64,
    };
    ctx.save();
    ctx.translate(o.x, o.y);
    const s = o.scale || 1;
    ctx.scale(o.flip ? -s : s, s);
    // 바운스 + 스쿼시&스트레치 (발밑 기준)
    const bounce = Math.abs(Math.sin(t.phase)) * 6 * t.walk;
    const breath = Math.sin(t.t * 2.2) * 0.013;
    const sy = 1 + Math.sin(t.phase * 2) * 0.05 * t.walk + breath;
    ctx.translate(0, -bounce);
    ctx.scale(2 - sy, sy);
    fn(ctx, p, t);
    ctx.restore();
  }

  function shadow(ctx, x, y, scale, walk, phase) {
    const b = Math.abs(Math.sin(phase || 0)) * (walk || 0);
    const k = 1 - b * 0.18;
    ell(ctx, x, y + 3 * scale, 24 * scale * k, 8 * scale * k, 'rgba(105,80,110,0.18)');
  }

  function topOf(ch) { return TOP[ch.id] != null ? TOP[ch.id] : 100; }

  return { draw, shadow, topOf };
})();

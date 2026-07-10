// ANIMALVERSE 미연시 — 캔버스 초상화 페인터 (잉크 외곽선 + 플랫 셀 톤)
// window.DSPortraits.draw(canvas, castDef, mood)  mood: normal | happy | shy
// 팔레트는 window.AV_CHARACTERS 에서 castDef.id 로 찾아 사용.
(function () {
  'use strict';
  var INK = '#33222b';
  var W = 480, H = 580;

  function pal(id) {
    var c = (window.AV_CHARACTERS || []).find(function (x) { return x.id === id; });
    return c ? c.palette : { primary: '#e89ab8', secondary: '#f8d7e4', accent: '#d86a92', dark: '#7a4a5c' };
  }
  function shade(hex, f) { // f<1 어둡게, f>1 밝게
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f))); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }

  function ell(ctx, x, y, rx, ry, fill, lw) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (lw !== 0) { ctx.lineWidth = lw || 5; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  function rr(ctx, x, y, w, h, r, fill, lw) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill; ctx.fill();
    if (lw !== 0) { ctx.lineWidth = lw || 5; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  function petal(ctx, x, y, rx, ry, rot, fill, lw) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fill; ctx.fill();
    if (lw !== 0) { ctx.lineWidth = lw || 5; ctx.strokeStyle = INK; ctx.stroke(); }
    ctx.restore();
  }
  function tri(ctx, x1, y1, x2, y2, x3, y3, fill, lw) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
    if (lw !== 0) { ctx.lineWidth = lw || 5; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke(); }
  }

  // ── 눈/입/볼 (무드별) ────────────────────────
  function drawEyes(ctx, cx, cy, def, mood) {
    var ex = 58, ey = cy + 8, er = 21, look = mood === 'shy' ? 9 : 0;
    [-1, 1].forEach(function (s) {
      var x = cx + ex * s;
      if (mood === 'happy') {
        // 활짝 웃어 감은 눈 (∩)
        ctx.beginPath(); ctx.arc(x, ey + 8, er * 0.9, Math.PI * 1.08, Math.PI * 1.92);
        ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
        return;
      }
      ell(ctx, x, ey, er * 0.82, er, '#ffffff', 4);
      ctx.beginPath(); ctx.ellipse(x + look * s * 0.6 + (mood === 'shy' ? 5 * s : 0), ey + 3, er * 0.5, er * 0.66, 0, 0, Math.PI * 2);
      ctx.fillStyle = def.face.eye; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + look * s * 0.6 + (mood === 'shy' ? 5 * s : 0), ey + 3, er * 0.26, er * 0.36, 0, 0, Math.PI * 2);
      ctx.fillStyle = INK; ctx.fill();
      ell(ctx, x - 5 + (mood === 'shy' ? 5 * s : 0), ey - 5, 5, 6, '#ffffff', 0);
    });
    if (mood === 'shy') { // 처진 눈썹
      [-1, 1].forEach(function (s) {
        ctx.beginPath(); ctx.moveTo(cx + (ex - 16) * s, ey - er - 12); ctx.lineTo(cx + (ex + 14) * s, ey - er - 4);
        ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
      });
    }
  }
  function drawMouth(ctx, cx, my, mood, hasBeak) {
    if (hasBeak) return; // 부리 종은 부리가 입을 대신
    ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = INK;
    if (mood === 'happy') {
      ctx.beginPath(); ctx.arc(cx, my - 6, 22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, my - 6, 22, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.fillStyle = '#7a3a4a'; ctx.fill();
    } else if (mood === 'shy') {
      ctx.beginPath(); ctx.moveTo(cx - 14, my);
      ctx.quadraticCurveTo(cx - 5, my + 7, cx, my);
      ctx.quadraticCurveTo(cx + 5, my - 7, cx + 14, my);
      ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(cx, my - 4, 13, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    }
  }
  function drawBlush(ctx, cx, cy, mood) {
    if (mood === 'normal') return;
    var a = mood === 'shy' ? 0.5 : 0.28;
    [-1, 1].forEach(function (s) {
      ctx.beginPath(); ctx.ellipse(cx + 92 * s, cy + 42, 26, 15, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,110,140,' + a + ')'; ctx.fill();
      if (mood === 'shy') { // 사선 볼터치
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(200,70,100,.6)';
        for (var i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(cx + (92 + i * 9) * s - 6, cy + 32); ctx.lineTo(cx + (92 + i * 9) * s + 6, cy + 52); ctx.stroke();
        }
      }
    });
  }

  // ── 종별 특징 ────────────────────────────────
  var KINDS = {
    flamingo: {
      behind: function (ctx, cx, cy, r, p) { // 머리 깃털 세 장
        petal(ctx, cx - 20, cy - r + 6, 14, 34, -0.5, p.secondary);
        petal(ctx, cx + 14, cy - r + 2, 14, 38, 0.15, p.accent);
        petal(ctx, cx + 44, cy - r + 14, 12, 30, 0.65, p.secondary);
      },
      front: function (ctx, cx, cy, r, p) { // 아래로 늘어진 큰 부리 + 검은 끝
        ctx.beginPath();
        ctx.moveTo(cx - 28, cy + 50);
        ctx.quadraticCurveTo(cx, cy + 36, cx + 28, cy + 50);
        ctx.quadraticCurveTo(cx + 32, cy + 92, cx + 8, cy + 118);
        ctx.quadraticCurveTo(cx - 8, cy + 122, cx - 14, cy + 108);
        ctx.quadraticCurveTo(cx - 32, cy + 80, cx - 28, cy + 50);
        ctx.closePath();
        ctx.fillStyle = '#f8c8d8'; ctx.fill();
        ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
        ell(ctx, cx - 1, cy + 106, 17, 13, INK, 0); // 검은 부리 끝
      },
      beak: true,
    },
    rabbit: {
      behind: function (ctx, cx, cy, r, p) {
        [-1, 1].forEach(function (s) {
          petal(ctx, cx + 52 * s, cy - r - 52, 26, 82, s * 0.14, p.primary);
          petal(ctx, cx + 52 * s, cy - r - 44, 13, 56, s * 0.14, p.secondary, 0);
        });
      },
    },
    cat: {
      behind: function (ctx, cx, cy, r, p) {
        [-1, 1].forEach(function (s) {
          tri(ctx, cx + 40 * s, cy - r + 26, cx + 118 * s, cy - r - 8, cx + 96 * s, cy - r + 76, p.primary);
          tri(ctx, cx + 58 * s, cy - r + 32, cx + 102 * s, cy - r + 12, cx + 90 * s, cy - r + 60, '#f8b8c8', 0);
        });
      },
      front: function (ctx, cx, cy, r, p) { // 이마 줄무늬 + 수염
        ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.strokeStyle = p.accent;
        [-26, 0, 26].forEach(function (dx) {
          ctx.beginPath(); ctx.moveTo(cx + dx, cy - r + 18); ctx.lineTo(cx + dx * 1.25, cy - r + 52); ctx.stroke();
        });
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(51,34,43,.75)';
        [-1, 1].forEach(function (s) {
          for (var i = 0; i < 3; i++) {
            ctx.beginPath(); ctx.moveTo(cx + 96 * s, cy + 46 + i * 14 - 14);
            ctx.lineTo(cx + 158 * s, cy + 40 + i * 18 - 18); ctx.stroke();
          }
        });
      },
    },
    fox: {
      behind: function (ctx, cx, cy, r, p) {
        [-1, 1].forEach(function (s) {
          tri(ctx, cx + 34 * s, cy - r + 20, cx + 128 * s, cy - r - 30, cx + 100 * s, cy - r + 78, p.primary);
          tri(ctx, cx + 54 * s, cy - r + 22, cx + 110 * s, cy - r - 8, cx + 92 * s, cy - r + 58, p.dark, 0);
        });
      },
      front: function (ctx, cx, cy, r, p) { // 흰 주둥이 패치 + 코
        ell(ctx, cx, cy + 62, 66, 46, p.secondary, 0);
        ell(ctx, cx, cy + 46, 13, 10, INK, 0);
      },
    },
    lion: {
      behind: function (ctx, cx, cy, r, p) { // 갈기
        for (var i = 0; i < 12; i++) {
          var a = (i / 12) * Math.PI * 2;
          petal(ctx, cx + Math.cos(a) * (r + 26), cy + Math.sin(a) * (r + 26), 34, 52, a + Math.PI / 2, p.accent);
        }
        [-1, 1].forEach(function (s) { ell(ctx, cx + 86 * s, cy - r + 4, 26, 26, p.primary); });
      },
      front: function (ctx, cx, cy, r, p) {
        ell(ctx, cx, cy + 60, 52, 38, p.secondary, 0);
        ell(ctx, cx, cy + 44, 15, 11, '#6a4632', 0);
      },
    },
    penguin: {
      headColor: function (p) { return p.primary; },
      front: function (ctx, cx, cy, r, p) { // 흰 얼굴 패치 + 다이아 부리
        ell(ctx, cx, cy + 16, 96, 92, '#ffffff', 0);
        tri(ctx, cx - 22, cy + 44, cx + 22, cy + 44, cx, cy + 78, '#f5a623');
      },
      beak: true,
      redrawEyes: true, // 패치 위에 눈을 다시
    },
  };

  // ── 액세서리 ────────────────────────────────
  var ACC = {
    ribbon: function (ctx, cx, cy, r, p) {
      var x = cx - 92, y = cy - r + 44;
      petal(ctx, x - 22, y, 22, 14, -0.4, p.accent);
      petal(ctx, x + 22, y, 22, 14, 0.4, p.accent);
      ell(ctx, x, y, 10, 10, shade(p.accent, 0.8));
    },
    hairpin: function (ctx, cx, cy, r) { // 당근 핀
      ctx.save(); ctx.translate(cx - 84, cy - r + 40); ctx.rotate(-0.5);
      tri(ctx, -8, -6, 8, -6, 0, 26, '#f5883c');
      petal(ctx, 0, -12, 7, 10, 0, '#5aa848', 3);
      ctx.restore();
    },
    pen: function (ctx, cx) { // 가슴께 만년필
      ctx.save(); ctx.translate(cx + 86, 500); ctx.rotate(0.5);
      rr(ctx, -7, -34, 14, 58, 6, '#4a4458', 4);
      tri(ctx, -7, 24, 7, 24, 0, 40, '#d8b86a');
      ctx.restore();
    },
    apron: function (ctx, cx, cy, r, p, outfit) { // 앞치마 어깨끈 + 주머니
      ctx.lineWidth = 5; ctx.strokeStyle = INK;
      rr(ctx, cx - 74, 486, 148, 94, 14, shade(outfit, 0.92), 5);
      rr(ctx, cx - 34, 516, 68, 44, 8, shade(outfit, 0.78), 4);
    },
    towel: function (ctx, cx) { // 어깨 수건
      rr(ctx, cx - 118, 452, 74, 118, 12, '#fff4f4', 5);
      ctx.lineWidth = 4; ctx.strokeStyle = '#e8a0b0';
      [478, 500, 522].forEach(function (y) {
        ctx.beginPath(); ctx.moveTo(cx - 110, y); ctx.lineTo(cx - 52, y); ctx.stroke();
      });
    },
    beret: function (ctx, cx, cy, r) {
      ctx.beginPath(); ctx.ellipse(cx + 6, cy - r + 12, 96, 40, -0.08, Math.PI * 0.98, Math.PI * 2.04);
      ctx.fillStyle = '#c85a6a'; ctx.fill();
      ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
      ell(ctx, cx + 6, cy - r - 24, 10, 10, '#c85a6a');
    },
  };

  function draw(canvas, def, mood) {
    mood = mood || 'normal';
    var p = pal(def.id), k = KINDS[def.face.kind] || {};
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    var cx = W / 2, cy = 252, r = 148;

    // 몸통 (하단, 캔버스 밖으로 이어지는 상반신)
    var outfit = def.face.outfit;
    ctx.beginPath(); ctx.moveTo(cx - 150, H + 20);
    ctx.quadraticCurveTo(cx - 150, 452, cx - 62, 440);
    ctx.lineTo(cx + 62, 440);
    ctx.quadraticCurveTo(cx + 150, 452, cx + 150, H + 20);
    ctx.closePath(); ctx.fillStyle = outfit; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = INK; ctx.stroke();
    // 목/옷깃
    if (k.neck) k.neck(ctx, cx, p);
    else { tri(ctx, cx - 40, 446, cx + 40, 446, cx, 492, '#fffdf8'); }

    // 머리 뒤 요소 (귀·갈기·깃털)
    if (k.behind) k.behind(ctx, cx, cy, r, p);

    // 머리
    var headCol = k.headColor ? k.headColor(p) : p.primary;
    ell(ctx, cx, cy, r, r * 0.94, headCol, 6);
    // 머리 하단 셀 셰이드 한 톤
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, r - 3, r * 0.94 - 3, 0, 0, Math.PI * 2); ctx.clip();
    ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.72, r * 0.96, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(51,34,43,0.10)'; ctx.fill(); ctx.restore();

    // 머리 앞 요소 (패치·부리·줄무늬)
    if (k.front) k.front(ctx, cx, cy, r, p, mood);

    // 얼굴
    drawEyes(ctx, cx, cy, def, mood);
    drawMouth(ctx, cx, cy + 66, mood, !!k.beak);
    drawBlush(ctx, cx, cy, mood);

    // 액세서리
    if (def.face.acc && ACC[def.face.acc]) ACC[def.face.acc](ctx, cx, cy, r, p, outfit);
  }

  window.DSPortraits = { draw: draw, W: W, H: H };
})();

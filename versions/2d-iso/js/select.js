// ANIMALVERSE 아이소 디오라마 — 캐릭터 선택 화면
// 20종을 아이소 진열장 카드로 그려 보여주고, 선택 후 ISOGame.start() 호출.
(function () {
  'use strict';
  var S = window.AVSprites, I = window.ISO;
  var chars = window.AV_CHARACTERS || [];
  var selected = null;
  var cards = [];

  var grid = document.getElementById('char-grid');
  var nameEl = document.getElementById('sel-name');
  var introEl = document.getElementById('sel-intro');
  var enterBtn = document.getElementById('enter-btn');

  // 카드용 아이소 페데스탈 + 피규어 렌더
  function drawCard(cv, ch, t, glow) {
    var g = cv.getContext('2d');
    var w = cv.width, h = cv.height;
    g.clearRect(0, 0, w, h);
    var cx = w / 2, baseY = h - 34;

    // 페데스탈 (아이소 박스)
    var HW = 34, HH = 17, ph = 16;
    // 윗면
    if (glow) {
      g.save();
      g.shadowColor = 'rgba(244,115,156,0.8)'; g.shadowBlur = 22;
    }
    g.beginPath();
    g.moveTo(cx, baseY - HH); g.lineTo(cx + HW, baseY);
    g.lineTo(cx, baseY + HH); g.lineTo(cx - HW, baseY); g.closePath();
    g.fillStyle = glow ? '#ffe6ef' : '#efe6dc'; g.fill();
    if (glow) g.restore();
    // 왼면
    g.beginPath();
    g.moveTo(cx - HW, baseY); g.lineTo(cx, baseY + HH);
    g.lineTo(cx, baseY + HH + ph); g.lineTo(cx - HW, baseY + ph); g.closePath();
    g.fillStyle = glow ? '#e9b9cd' : '#d6c8b8'; g.fill();
    // 오른면
    g.beginPath();
    g.moveTo(cx + HW, baseY); g.lineTo(cx, baseY + HH);
    g.lineTo(cx, baseY + HH + ph); g.lineTo(cx + HW, baseY + ph); g.closePath();
    g.fillStyle = glow ? '#d99cb4' : '#c2b09c'; g.fill();

    // 피규어
    var walk = glow ? 0.4 : 0;
    S.draw(g, { id: ch.id, palette: ch.palette }, {
      x: cx, y: baseY - 4, scale: 0.92, face: 1,
      t: t, walk: walk, ph: t * 6,
    });
  }

  function build() {
    chars.forEach(function (ch, i) {
      var card = document.createElement('div');
      card.className = 'char-card';
      var cv = document.createElement('canvas');
      cv.width = 132; cv.height = 148;
      var name = document.createElement('div');
      name.className = 'cname';
      name.innerHTML = ch.ko + '<span class="em">' + (ch.emoji || '') + '</span>';
      card.appendChild(cv);
      card.appendChild(name);
      grid.appendChild(card);

      var rec = { ch: ch, cv: cv, card: card, t: i * 0.5, hover: false };
      cards.push(rec);

      card.addEventListener('mouseenter', function () { rec.hover = true; });
      card.addEventListener('mouseleave', function () { rec.hover = false; });
      card.addEventListener('click', function () { select(rec); });

      drawCard(cv, ch, rec.t, false);
    });
  }

  function select(rec) {
    selected = rec.ch;
    cards.forEach(function (c) { c.card.classList.toggle('selected', c === rec); });
    nameEl.textContent = rec.ch.ko + '  ' + (rec.ch.emoji || '');
    introEl.textContent = rec.ch.intro || '';
    enterBtn.disabled = false;
  }

  enterBtn.addEventListener('click', function () {
    if (!selected) return;
    running = false;
    window.ISOGame.start(selected);
  });

  // 선택 화면 애니메이션 (호버/선택 카드만 갱신해 부담 최소화)
  var running = true, last = 0;
  function tick(ts) {
    if (!running) return;
    if (!last) last = ts;
    var dt = (ts - last) / 1000; last = ts;
    cards.forEach(function (c) {
      var active = c.hover || c.ch === selected;
      if (active) { c.t += dt; drawCard(c.cv, c.ch, c.t, c.ch === selected); }
    });
    requestAnimationFrame(tick);
  }

  build();
  requestAnimationFrame(tick);
})();

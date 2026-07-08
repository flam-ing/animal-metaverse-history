// ANIMALVERSE 파스텔 파크 — 선택 화면 + 파스텔 공원 월드 (월드도 여기서 구축)
// chibi.js (window.Chibi) 위에서 동작.
(function () {
  'use strict';
  var Chibi = window.Chibi;
  var CHARS = window.AV_CHARACTERS || [];
  var NPCS = window.AV_NPCS || [];
  var ZONES = {}; (window.AV_ZONES || []).forEach(function (z) { ZONES[z.id] = z; });

  // ── 월드 정의 ──────────────────────
  var WORLD = { w: 1900, h: 1400 };
  var ZP = {
    plaza: { x: 900, y: 720 },
    park: { x: 470, y: 380 },
    cafe: { x: 1420, y: 410 },
    lake: { x: 440, y: 1020 },
    hotspring: { x: 1440, y: 1010 },
  };
  var props = [];   // {x,y,sortY,r,draw}
  var ponds = [];   // 그라운드에 그릴 물 영역
  var selected = null;

  // ═══════════ 선택 화면 ═══════════
  var grid = document.getElementById('grid');
  var pvCanvas = document.getElementById('pv-canvas');
  var pvCtx = pvCanvas.getContext('2d');
  var pvName = document.getElementById('pv-name');
  var pvIntro = document.getElementById('pv-intro');
  var enterBtn = document.getElementById('enter');

  function drawCardPortrait(cv, ch, t) {
    var g = cv.getContext('2d');
    var w = cv.width, h = cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, w, h);
    // 부드러운 원형 배경
    var grad = g.createRadialGradient(w / 2, h * 0.5, 6, w / 2, h * 0.5, w * 0.6);
    grad.addColorStop(0, 'rgba(255,255,255,.9)');
    grad.addColorStop(1, 'rgba(255,240,248,0)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    Chibi.shadow(g, w / 2, h - 14, 0.8, 0, 0);
    Chibi.draw(g, ch, { x: w / 2, y: h - 14, scale: 0.82, t: t, seed: 0, phase: 0, walk: 0 });
  }

  function buildSelect() {
    CHARS.forEach(function (ch) {
      var card = document.createElement('div');
      card.className = 'card';
      var cv = document.createElement('canvas');
      cv.width = 120; cv.height = 130;
      var nm = document.createElement('div');
      nm.className = 'nm';
      nm.innerHTML = ch.ko + '<span class="em">' + (ch.emoji || '') + '</span>';
      card.appendChild(cv); card.appendChild(nm);
      grid.appendChild(card);
      drawCardPortrait(cv, ch, 0);
      var rec = { ch: ch, cv: cv, card: card, hover: false, t: 0 };
      card.addEventListener('mouseenter', function () { rec.hover = true; });
      card.addEventListener('mouseleave', function () { rec.hover = false; rec.t = 0; drawCardPortrait(cv, ch, 0); });
      card.addEventListener('click', function () { pick(rec); });
      cards.push(rec);
    });
  }
  var cards = [];

  function pick(rec) {
    selected = rec.ch;
    cards.forEach(function (c) { c.card.classList.toggle('sel', c === rec); });
    pvName.innerHTML = rec.ch.ko + '<span class="en">' + rec.ch.en + '</span>';
    pvIntro.textContent = rec.ch.intro || '';
    enterBtn.disabled = false;
  }

  // 선택 화면 애니메이션 루프 (호버/미리보기만)
  var selActive = true, pvT = 0, selLast = 0;
  function selLoop(ts) {
    if (!selActive) return;
    if (!selLast) selLast = ts;
    var dt = (ts - selLast) / 1000; selLast = ts;
    pvT += dt;
    cards.forEach(function (c) {
      if (c.hover) { c.t += dt; drawCardPortrait(c.cv, c.ch, c.t); }
    });
    if (selected) {
      pvCtx.setTransform(1, 0, 0, 1, 0, 0);
      pvCtx.clearRect(0, 0, pvCanvas.width, pvCanvas.height);
      var ph = pvT * 5;
      Chibi.shadow(pvCtx, 96, 200, 1.2, 0.6, ph);
      Chibi.draw(pvCtx, selected, { x: 96, y: 200, scale: 1.25, t: pvT, seed: 0, phase: ph, walk: 0.6 });
    }
    requestAnimationFrame(selLoop);
  }

  enterBtn.addEventListener('click', function () {
    if (!selected) return;
    selActive = false;
    document.getElementById('select').classList.add('hidden');
    startWorld();
  });

  // ═══════════ 월드 ═══════════
  var canvas, ctx, cw, chh, dpr = 1;
  var keys = {}, time = 0, last = 0;
  var player, npcs = [], visitors = [], curZone = null, nearNpc = null;
  var dlg = { open: false, npc: null, i: 0 };
  var cam = { x: 0, y: 0 };

  function startWorld() {
    buildProps();
    canvas = document.getElementById('game');
    canvas.classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    player = { char: selected, x: ZP.plaza.x, y: ZP.plaza.y + 90, flip: false, walk: 0, phase: 0 };

    npcs = NPCS.map(function (n, i) {
      var z = ZP[n.zone] || ZP.plaza;
      var a = (i / NPCS.length) * Math.PI * 2;
      var x = z.x + Math.cos(a) * 70, y = z.y + Math.sin(a) * 70 + 60;
      return { def: n, x: x, y: y, ax: x, ay: y, flip: false, walk: 0, phase: i, seed: i * 1.7 };
    });

    var pool = CHARS.filter(function (c) { return c.id !== selected.id; });
    visitors = [];
    for (var k = 0; k < 6 && k < pool.length; k++) {
      var c = pool[(k * 3 + 1) % pool.length];
      visitors.push({ char: c, x: ZP.plaza.x + (k - 3) * 80, y: ZP.plaza.y + (k % 2 ? 120 : -80),
        tx: 0, ty: 0, wait: 0, flip: false, walk: 0, phase: k, seed: k * 2.3 });
      visitors[k].tx = visitors[k].x; visitors[k].ty = visitors[k].y;
    }

    bindKeys();
    last = 0;
    requestAnimationFrame(loop);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth; chh = window.innerHeight;
    canvas.style.width = cw + 'px'; canvas.style.height = chh + 'px';
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(chh * dpr);
  }

  // ── 소품 배치 ─────────────────────
  function tree(x, y, s) {
    props.push({ x: x, y: y, sortY: y, r: 26 * s, draw: function (c, t) { drawTree(c, x, y, s, t); } });
  }
  function drawTree(c, x, y, s, t) {
    var sway = Math.sin(t * 1.3 + x * 0.01) * 3;
    // 그림자
    c.fillStyle = 'rgba(120,90,120,.12)';
    c.beginPath(); c.ellipse(x, y, 34 * s, 12 * s, 0, 0, Math.PI * 2); c.fill();
    // 줄기
    c.fillStyle = '#c69b7b';
    c.beginPath(); c.roundRect(x - 7 * s, y - 60 * s, 14 * s, 60 * s, 6 * s); c.fill();
    // 솜사탕 잎 (여러 겹)
    var blobs = [[0, -95, 40], [-28, -80, 30], [28, -80, 30], [-14, -110, 28], [16, -108, 26]];
    for (var i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      c.fillStyle = i % 2 ? '#ffc6dd' : '#f7b0d0';
      c.beginPath(); c.ellipse(x + b[0] * s + sway, y + b[1] * s, b[2] * s, b[2] * 0.92 * s, 0, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.ellipse(x - 10 * s + sway, y - 108 * s, 14 * s, 12 * s, 0, 0, Math.PI * 2); c.fill();
  }

  function shop(x, y, col, roof) {
    props.push({ x: x, y: y, sortY: y, r: 55, draw: function (c) { drawShop(c, x, y, col, roof); } });
  }
  function drawShop(c, x, y, col, roof) {
    c.fillStyle = 'rgba(120,90,120,.12)';
    c.beginPath(); c.ellipse(x, y, 70, 20, 0, 0, Math.PI * 2); c.fill();
    // 몸체
    c.fillStyle = col; c.strokeStyle = 'rgba(90,60,80,.35)'; c.lineWidth = 4;
    c.beginPath(); c.roundRect(x - 60, y - 110, 120, 110, 16); c.fill(); c.stroke();
    // 지붕
    c.fillStyle = roof;
    c.beginPath();
    c.moveTo(x - 74, y - 100); c.lineTo(x, y - 168); c.lineTo(x + 74, y - 100);
    c.quadraticCurveTo(x, y - 118, x - 74, y - 100); c.closePath(); c.fill();
    // 문/창
    c.fillStyle = '#fff6ee';
    c.beginPath(); c.roundRect(x - 20, y - 62, 40, 62, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)';
    c.beginPath(); c.roundRect(x - 50, y - 92, 26, 26, 6); c.fill();
    c.beginPath(); c.roundRect(x + 24, y - 92, 26, 26, 6); c.fill();
    // 차양
    c.fillStyle = roof;
    c.beginPath(); c.roundRect(x - 64, y - 118, 128, 14, 7); c.fill();
  }

  function fountain(x, y) {
    props.push({ x: x, y: y, sortY: y, r: 60, draw: function (c, t) { drawFountain(c, x, y, t); } });
  }
  function drawFountain(c, x, y, t) {
    c.fillStyle = '#e8dced';
    c.beginPath(); c.ellipse(x, y, 78, 34, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#bfe3f2';
    c.beginPath(); c.ellipse(x, y - 4, 64, 26, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d6cad8';
    c.beginPath(); c.roundRect(x - 8, y - 60, 16, 56, 8); c.fill();
    c.beginPath(); c.ellipse(x, y - 62, 22, 9, 0, 0, Math.PI * 2); c.fill();
    // 물줄기
    c.strokeStyle = 'rgba(190,230,245,.85)'; c.lineWidth = 3;
    for (var i = 0; i < 7; i++) {
      var a = (i / 7) * Math.PI * 2 + t;
      c.beginPath();
      c.moveTo(x, y - 66);
      c.quadraticCurveTo(x + Math.cos(a) * 18, y - 84, x + Math.cos(a) * 34, y - 50 + Math.sin(t * 4 + i) * 4);
      c.stroke();
    }
  }

  function onsen(x, y) {
    props.push({ x: x, y: y, sortY: y - 40, r: 66, draw: function (c, t) { drawOnsen(c, x, y, t); } });
  }
  function drawOnsen(c, x, y, t) {
    c.fillStyle = '#c9a884';
    c.beginPath(); c.ellipse(x, y, 84, 40, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d9eef0';
    c.beginPath(); c.ellipse(x, y - 3, 68, 30, 0, 0, Math.PI * 2); c.fill();
    // 바위
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      c.fillStyle = i % 2 ? '#9c8b7a' : '#8a7a6a';
      c.beginPath(); c.ellipse(x + Math.cos(a) * 74, y + Math.sin(a) * 34, 16, 12, 0, 0, Math.PI * 2); c.fill();
    }
    // 김
    for (var s = 0; s < 5; s++) {
      var ph = (t * 0.5 + s * 0.3) % 1;
      c.fillStyle = 'rgba(255,255,255,' + (0.3 * (1 - ph)).toFixed(2) + ')';
      c.beginPath(); c.ellipse(x - 40 + s * 20, y - 20 - ph * 70, 12 + ph * 10, 14 + ph * 10, 0, 0, Math.PI * 2); c.fill();
    }
  }

  function bench(x, y) {
    props.push({ x: x, y: y, sortY: y, r: 30, draw: function (c) {
      c.fillStyle = 'rgba(120,90,120,.12)'; c.beginPath(); c.ellipse(x, y, 44, 12, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#d9a679'; c.beginPath(); c.roundRect(x - 40, y - 22, 80, 12, 5); c.fill();
      c.beginPath(); c.roundRect(x - 40, y - 44, 80, 12, 5); c.fill();
      c.fillStyle = '#c08a5c'; c.fillRect(x - 34, y - 22, 6, 22); c.fillRect(x + 28, y - 22, 6, 22);
    } });
  }

  function buildProps() {
    props = []; ponds = [];
    // 공원: 나무 + 벤치
    tree(ZP.park.x - 90, ZP.park.y - 40, 1.1);
    tree(ZP.park.x + 80, ZP.park.y - 70, 1.0);
    tree(ZP.park.x + 30, ZP.park.y + 80, 1.2);
    tree(ZP.park.x - 130, ZP.park.y + 60, 0.9);
    tree(ZP.park.x + 150, ZP.park.y + 40, 1.0);
    bench(ZP.park.x - 20, ZP.park.y + 20);
    // 광장 분수
    fountain(ZP.plaza.x, ZP.plaza.y);
    tree(ZP.plaza.x - 200, ZP.plaza.y - 30, 0.9);
    tree(ZP.plaza.x + 200, ZP.plaza.y + 40, 0.9);
    // 카페 거리
    shop(ZP.cafe.x - 110, ZP.cafe.y, '#f7c9d8', '#e27e96');
    shop(ZP.cafe.x + 20, ZP.cafe.y - 30, '#c9e8c4', '#4caf6d');
    shop(ZP.cafe.x + 140, ZP.cafe.y + 20, '#f7e3b8', '#e0a030');
    // 호수 + 부두
    ponds.push({ x: ZP.lake.x, y: ZP.lake.y, rx: 150, ry: 100 });
    props.push({ x: ZP.lake.x + 40, y: ZP.lake.y + 80, sortY: ZP.lake.y + 80, r: 0, draw: function (c) {
      c.fillStyle = '#c69b7b'; c.beginPath(); c.roundRect(ZP.lake.x + 20, ZP.lake.y + 30, 40, 60, 6); c.fill();
    } });
    tree(ZP.lake.x - 140, ZP.lake.y - 60, 1.0);
    // 온천
    onsen(ZP.hotspring.x, ZP.hotspring.y);
    tree(ZP.hotspring.x - 150, ZP.hotspring.y + 20, 0.9);
  }

  // ── 입력 / 대화 ────────────────────
  function bindKeys() {
    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase(); keys[k] = true;
      if (k === 'e') { e.preventDefault(); interact(); }
      if (k.indexOf('arrow') === 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  }
  function interact() {
    if (dlg.open) { dlg.i++; if (dlg.i >= dlg.npc.def.dialogue.length) closeDlg(); else showDlg(); return; }
    if (nearNpc) openDlg(nearNpc);
  }
  function openDlg(n) { dlg.open = true; dlg.npc = n; dlg.i = 0; document.getElementById('dialog').classList.remove('hidden'); showDlg(); }
  function showDlg() {
    var n = dlg.npc.def;
    document.getElementById('dlg-name').innerHTML = n.name + '<span class="rl">' + n.role + '</span>';
    document.getElementById('dlg-text').textContent = n.dialogue[dlg.i];
    document.getElementById('dlg-next').innerHTML = (dlg.i >= n.dialogue.length - 1)
      ? '<span class="k">E</span> 닫기 ✕' : '<span class="k">E</span> 다음 ▸';
  }
  function closeDlg() { dlg.open = false; dlg.npc = null; document.getElementById('dialog').classList.add('hidden'); }

  // ── 충돌 ──────────────────────────
  function canMove(x, y) {
    if (x < 40 || y < 40 || x > WORLD.w - 40 || y > WORLD.h - 40) return false;
    for (var i = 0; i < props.length; i++) {
      var p = props[i];
      if (p.r > 0 && Math.hypot(x - p.x, y - p.y) < p.r) return false;
    }
    return true;
  }
  function moveEnt(e, dx, dy, spd, dt) {
    var nx = e.x + dx * spd * dt, ny = e.y + dy * spd * dt;
    if (canMove(nx, e.y)) e.x = nx;
    if (canMove(e.x, ny)) e.y = ny;
    if (Math.abs(dx) > 0.01) e.flip = dx < 0;
  }

  function zoneAt(x, y) {
    var best = null, bd = 220;
    for (var id in ZP) { var d = Math.hypot(x - ZP[id].x, y - ZP[id].y); if (d < bd) { bd = d; best = id; } }
    return best;
  }

  // ── 업데이트 ──────────────────────
  function update(dt) {
    if (!dlg.open) {
      var dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
      var mag = Math.hypot(dx, dy);
      if (mag > 0) { dx /= mag; dy /= mag; moveEnt(player, dx, dy, 220, dt); }
      player.walk += ((mag > 0 ? 1 : 0) - player.walk) * Math.min(1, dt * 12);
      player.phase += dt * 9 * (0.25 + player.walk);
    }

    var z = zoneAt(player.x, player.y);
    if (z && z !== curZone) { curZone = z; toast(z); }

    nearNpc = null; var bestD = 120;
    npcs.forEach(function (n) {
      n.phase += dt * 2;
      var tx = n.ax + Math.cos(n.seed + time * 0.3) * 40;
      var ty = n.ay + Math.sin(n.seed * 1.3 + time * 0.25) * 40;
      var dx = tx - n.x, dy = ty - n.y, dl = Math.hypot(dx, dy);
      if (dl > 4) { moveEnt(n, dx / dl, dy / dl, 34, dt); n.walk += (1 - n.walk) * Math.min(1, dt * 6); }
      else n.walk += (0 - n.walk) * Math.min(1, dt * 6);
      var pd = Math.hypot(n.x - player.x, n.y - player.y);
      if (pd < bestD) { bestD = pd; nearNpc = n; }
    });

    visitors.forEach(function (v) {
      v.phase += dt * 9 * (0.25 + v.walk);
      if (v.wait > 0) { v.wait -= dt; v.walk += (0 - v.walk) * Math.min(1, dt * 6); return; }
      var dx = v.tx - v.x, dy = v.ty - v.y, dl = Math.hypot(dx, dy);
      if (dl < 12) {
        var a = (v.seed += 2.1);
        v.tx = Math.max(80, Math.min(WORLD.w - 80, v.x + Math.cos(a) * (120 + (a % 100))));
        v.ty = Math.max(80, Math.min(WORLD.h - 80, v.y + Math.sin(a * 1.2) * (120 + (a % 80))));
        v.wait = 0.6 + (a % 2);
        v.walk += (0 - v.walk) * 0.5;
      } else {
        var bx = v.x;
        moveEnt(v, dx / dl, dy / dl, 120, dt);
        if (Math.abs(v.x - bx) < 0.2 && Math.abs(dx) > Math.abs(dy)) v.wait = 0.4;
        v.walk += (1 - v.walk) * Math.min(1, dt * 6);
      }
    });

    // 카메라
    cam.x += (player.x - cw / 2 - cam.x) * Math.min(1, dt * 5);
    cam.y += (player.y - chh / 2 - cam.y) * Math.min(1, dt * 5);
  }

  // ── 그리기 ────────────────────────
  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // 하늘/잔디 배경 (스크린 고정 그라데이션)
    var bg = ctx.createLinearGradient(0, 0, 0, chh);
    bg.addColorStop(0, '#eaf7e4'); bg.addColorStop(1, '#dff0d8');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, chh);

    ctx.save();
    ctx.translate(-cam.x, -cam.y);

    drawGround();

    // 소품 + 캐릭터 y정렬
    var ents = [];
    props.forEach(function (p) { ents.push({ sortY: p.sortY, kind: 'prop', p: p }); });
    ents.push({ sortY: player.y, kind: 'char', o: player, isP: true });
    npcs.forEach(function (n) { ents.push({ sortY: n.y, kind: 'char', o: n, isNpc: true }); });
    visitors.forEach(function (v) { ents.push({ sortY: v.y, kind: 'char', o: v }); });
    ents.sort(function (a, b) { return a.sortY - b.sortY; });

    ents.forEach(function (e) {
      if (e.kind === 'prop') { e.p.draw(ctx, time); return; }
      drawChar(e.o, e.isP, e.isNpc);
    });

    ctx.restore();

    // 상호작용 힌트
    var hint = document.getElementById('interact');
    if (nearNpc && !dlg.open) hint.classList.remove('hidden'); else hint.classList.add('hidden');
  }

  function drawGround() {
    // 잔디 바탕
    ctx.fillStyle = '#d9edcf';
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    // 잔디 무늬 점
    ctx.fillStyle = 'rgba(180,215,160,.5)';
    for (var gx = 0; gx < WORLD.w; gx += 90) {
      for (var gy = 0; gy < WORLD.h; gy += 90) {
        var o = ((gx * 7 + gy * 13) % 40) - 20;
        ctx.beginPath(); ctx.ellipse(gx + o, gy + (o * 1.3), 14, 7, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 크림색 산책로 (광장 → 각 존)
    ctx.strokeStyle = '#f3e6cf'; ctx.lineWidth = 54; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (var id in ZP) {
      if (id === 'plaza') continue;
      ctx.beginPath(); ctx.moveTo(ZP.plaza.x, ZP.plaza.y);
      var mx = (ZP.plaza.x + ZP[id].x) / 2, my = (ZP.plaza.y + ZP[id].y) / 2;
      ctx.quadraticCurveTo(mx + 40, my - 30, ZP[id].x, ZP[id].y);
      ctx.stroke();
    }
    // 광장 원형 포장
    ctx.fillStyle = '#f6ebd6';
    ctx.beginPath(); ctx.ellipse(ZP.plaza.x, ZP.plaza.y, 200, 150, 0, 0, Math.PI * 2); ctx.fill();
    // 호수 물
    ponds.forEach(function (p) {
      var grd = ctx.createRadialGradient(p.x, p.y, 10, p.x, p.y, p.rx);
      grd.addColorStop(0, '#bfe6f5'); grd.addColorStop(1, '#8fcfe8');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2); ctx.fill();
      // 반짝임
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      for (var i = 0; i < 5; i++) {
        var a = i * 1.3 + time;
        ctx.beginPath();
        ctx.ellipse(p.x + Math.cos(a) * p.rx * 0.5, p.y + Math.sin(a * 1.4) * p.ry * 0.5, 9, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    // 떠다니는 꽃잎/하트 (은은히)
    for (var k = 0; k < 24; k++) {
      var fx = (k * 137 + time * 20) % WORLD.w;
      var fy = (k * 211 + Math.sin(time + k) * 20) % WORLD.h;
      ctx.fillStyle = k % 2 ? 'rgba(255,190,215,.55)' : 'rgba(210,190,245,.5)';
      ctx.beginPath(); ctx.ellipse(fx, fy, 5, 3, k, 0, Math.PI * 2); ctx.fill();
    }
  }

  function drawChar(o, isP, isNpc) {
    var ch = o.char || o.def;
    Chibi.shadow(ctx, o.x, o.y, 1, o.walk || 0, o.phase || 0);
    Chibi.draw(ctx, ch, { x: o.x, y: o.y, scale: 1, flip: o.flip, t: time, seed: o.seed || 0, phase: o.phase || 0, walk: o.walk || 0 });
    // 라벨
    var top = Chibi.topOf(ch);
    if (isP) label(o.x, o.y - top - 14, ch.ko, '#ef7bab', true);
    else if (isNpc) {
      label(o.x, o.y - top - 14, o.def.name + ' · ' + o.def.role, '#7a5c6a', false);
      if (o === nearNpc && !dlg.open) label(o.x, o.y - top - 40, 'E  대화', '#4caf6d', true);
    }
  }

  function label(x, y, text, color, strong) {
    ctx.font = (strong ? '700 ' : '600 ') + '15px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    var w = ctx.measureText(text).width + 20, h = 24;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.strokeStyle = 'rgba(240,180,205,.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - h / 2);
  }

  function toast(zid) {
    var z = ZONES[zid]; if (!z) return;
    document.getElementById('zone-name').textContent = z.ko;
    document.getElementById('zone-hint').textContent = z.hint || '';
    var el = document.getElementById('zone'); el.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function loop(ts) {
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    time += dt;
    update(dt); render();
    requestAnimationFrame(loop);
  }

  // 시작
  buildSelect();
  requestAnimationFrame(selLoop);
})();

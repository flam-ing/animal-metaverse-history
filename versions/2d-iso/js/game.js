// ANIMALVERSE 아이소 디오라마 — 월드 게임 루프 / 플레이어 / NPC / 대화
// select.js 가 ISOGame.start(charDef) 를 호출해 시작한다.
(function () {
  'use strict';
  var W = window.AVWorld, S = window.AVSprites, I = window.ISO;
  var ZONES = {}; (window.AV_ZONES || []).forEach(function (z) { ZONES[z.id] = z; });

  var canvas, ctx, cw = 0, ch = 0, dpr = 1;
  var running = false, last = 0, time = 0;
  var keys = {};
  var player = null;      // {char, x, y, face, walk, phase}
  var npcs = [];          // {char, name, role, x, y, ax, ay, face, walk, phase, seed, dialogue}
  var visitors = [];      // 배회하는 방문객
  var curZone = null;
  var dlg = { open: false, npc: null, i: 0 };
  var nearNpc = null;

  // ── 시작 ─────────────────────────────
  function start(charDef) {
    document.getElementById('select-screen').classList.add('hidden');
    var ws = document.getElementById('world-screen');
    ws.classList.remove('hidden');

    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    // 플레이어: 광장 중앙에서 시작
    var pz = W.ZONE_POS.plaza;
    player = { char: charDef, x: pz.x, y: pz.y + 1.5, face: 1, walk: 0, phase: 0 };

    spawnNpcs();
    spawnVisitors(charDef);
    bindInput();

    running = true;
    last = 0;
    requestAnimationFrame(loop);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth; ch = window.innerHeight;
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
  }

  // ── NPC 배치 ─────────────────────────
  function findFreeNear(cx, cy, seed) {
    for (var k = 0; k < 40; k++) {
      var a = (seed * 2.4 + k * 1.7);
      var r = 1.2 + (k % 6) * 0.5;
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (W.walkable(x, y)) return { x: x, y: y };
    }
    return { x: cx, y: cy };
  }

  function spawnNpcs() {
    npcs = [];
    (window.AV_NPCS || []).forEach(function (n, i) {
      var z = W.ZONE_POS[n.zone] || W.ZONE_POS.plaza;
      var pos = findFreeNear(z.x, z.y, i + 1);
      npcs.push({
        char: n, name: n.name, role: n.role,
        x: pos.x, y: pos.y, ax: pos.x, ay: pos.y,
        face: (i % 2 ? 1 : -1), walk: 0, phase: i, seed: i * 1.3,
        dialogue: n.dialogue || ['...'],
      });
    });
  }

  function spawnVisitors(exclude) {
    visitors = [];
    var pool = (window.AV_CHARACTERS || []).filter(function (c) { return c.id !== exclude.id; });
    // 결정적으로 6마리 선택
    var pick = [];
    for (var i = 0; i < pool.length && pick.length < 6; i++) {
      if ((i * 7 + 3) % 3 !== 0 || pick.length < 6) pick.push(pool[i]);
      if (pick.length >= 6) break;
    }
    pick.slice(0, 6).forEach(function (c, i) {
      var z = W.ZONE_POS[['plaza', 'park', 'cafe', 'lake', 'plaza', 'park'][i]];
      var pos = findFreeNear(z.x, z.y, i + 20);
      visitors.push({
        char: c, x: pos.x, y: pos.y, face: 1, walk: 0, phase: i,
        tx: pos.x, ty: pos.y, wait: 0, seed: i * 2.1,
      });
    });
  }

  // ── 입력 ─────────────────────────────
  function bindInput() {
    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      keys[k] = true;
      if (k === 'e') {
        e.preventDefault();
        onInteract();
      }
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  }

  function onInteract() {
    if (dlg.open) {
      dlg.i++;
      if (dlg.i >= dlg.npc.dialogue.length) { closeDialog(); }
      else { renderDialog(); }
      return;
    }
    if (nearNpc) openDialog(nearNpc);
  }

  function openDialog(npc) {
    dlg.open = true; dlg.npc = npc; dlg.i = 0;
    document.getElementById('dialog-box').classList.remove('hidden');
    renderDialog();
  }
  function renderDialog() {
    document.getElementById('dlg-who').textContent = dlg.npc.name + ' · ' + dlg.npc.role;
    document.getElementById('dlg-text').textContent = dlg.npc.dialogue[dlg.i];
    var nx = document.getElementById('dlg-next');
    nx.textContent = (dlg.i >= dlg.npc.dialogue.length - 1) ? 'E — 닫기 ✕' : 'E — 다음 ▸';
  }
  function closeDialog() {
    dlg.open = false; dlg.npc = null;
    document.getElementById('dialog-box').classList.add('hidden');
  }

  // ── 이동 방향 ────────────────────────
  function inputVec() {
    var ix = 0, iy = 0;
    if (keys['w'] || keys['arrowup']) iy -= 1;
    if (keys['s'] || keys['arrowdown']) iy += 1;
    if (keys['a'] || keys['arrowleft']) ix -= 1;
    if (keys['d'] || keys['arrowright']) ix += 1;
    return { ix: ix, iy: iy };
  }

  function tryMove(ent, wdx, wdy, dist) {
    var nx = ent.x + wdx * dist, ny = ent.y + wdy * dist;
    if (W.walkable(nx, ent.y)) ent.x = nx;
    if (W.walkable(ent.x, ny)) ent.y = ny;
  }

  // ── 업데이트 ─────────────────────────
  function update(dt) {
    // 플레이어
    if (!dlg.open) {
      var v = inputVec();
      var moving = (v.ix || v.iy);
      if (moving) {
        var d = I.screenDirToWorld(v.ix, v.iy);
        tryMove(player, d.x, d.y, 4.6 * dt);
        var sdx = (d.x - d.y);
        if (Math.abs(sdx) > 0.02) player.face = sdx < 0 ? -1 : 1;
      }
      player.walk += ((moving ? 1 : 0) - player.walk) * Math.min(1, dt * 12);
      player.phase += dt * 9 * (0.3 + player.walk);
    }

    // 존 감지
    var z = W.zoneAt(player.x, player.y);
    if (z && z !== curZone) { curZone = z; showToast(z); }
    else if (!z) curZone = curZone; // 유지

    // 근처 NPC
    nearNpc = null;
    var bestD = 1.7;
    npcs.forEach(function (n) {
      // 앵커 주변 배회
      n.phase += dt * 2;
      var wob = Math.sin(n.phase * 0.5 + n.seed) ;
      var tx = n.ax + Math.cos(n.seed + time * 0.25) * 0.7;
      var ty = n.ay + Math.sin(n.seed * 1.4 + time * 0.22) * 0.7;
      var dx = tx - n.x, dy = ty - n.y;
      var dl = Math.hypot(dx, dy);
      if (dl > 0.05) {
        var spd = 0.5;
        var nnx = n.x + (dx / dl) * spd * dt, nny = n.y + (dy / dl) * spd * dt;
        if (W.walkable(nnx, n.y)) n.x = nnx;
        if (W.walkable(n.x, nny)) n.y = nny;
        n.walk += (1 - n.walk) * Math.min(1, dt * 8);
        var sdx = (dx / dl - dy / dl);
        if (Math.abs(sdx) > 0.02) n.face = sdx < 0 ? -1 : 1;
      } else {
        n.walk += (0 - n.walk) * Math.min(1, dt * 8);
      }
      var pd = Math.hypot(n.x - player.x, n.y - player.y);
      if (pd < bestD) { bestD = pd; nearNpc = n; }
    });

    // 방문객 배회
    visitors.forEach(function (vis) {
      vis.phase += dt * 8 * (0.3 + vis.walk);
      if (vis.wait > 0) { vis.wait -= dt; vis.walk += (0 - vis.walk) * Math.min(1, dt * 6); return; }
      var dx = vis.tx - vis.x, dy = vis.ty - vis.y;
      var dl = Math.hypot(dx, dy);
      if (dl < 0.2) {
        // 새 목표
        var a = (vis.seed += 1.9);
        vis.tx = vis.x + Math.cos(a) * (2 + (a % 3));
        vis.ty = vis.y + Math.sin(a * 1.3) * (2 + (a % 2));
        if (!W.walkable(vis.tx, vis.ty)) { vis.tx = vis.x; vis.ty = vis.y; }
        vis.wait = 0.6 + (a % 2);
      } else {
        var spd = 1.6;
        var nx = vis.x + (dx / dl) * spd * dt, ny = vis.y + (dy / dl) * spd * dt;
        if (W.walkable(nx, vis.y)) vis.x = nx; else vis.wait = 0.4;
        if (W.walkable(vis.x, ny)) vis.y = ny;
        vis.walk += (1 - vis.walk) * Math.min(1, dt * 8);
        var sdx = (dx / dl - dy / dl);
        if (Math.abs(sdx) > 0.02) vis.face = sdx < 0 ? -1 : 1;
      }
    });
  }

  // ── 그리기 ───────────────────────────
  function worldToScreen(x, y) { return I.toScreen(x, y); }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    var ps = worldToScreen(player.x, player.y);
    var camX = cw / 2 - ps.x;
    var camY = ch / 2 - ps.y - 30;

    ctx.save();
    ctx.translate(camX, camY);

    // 1) 타일 + 절벽 (아이소 페인터 순서: x+y 오름차순)
    var SIZE = W.SIZE;
    for (var sum = 0; sum <= 2 * (SIZE - 1); sum++) {
      var xLo = Math.max(0, sum - (SIZE - 1));
      var xHi = Math.min(SIZE - 1, sum);
      for (var x = xLo; x <= xHi; x++) {
        var y = sum - x;
        W.drawTile(ctx, x, y, time);
      }
    }
    for (var s2 = 0; s2 <= 2 * (SIZE - 1); s2++) {
      var xa = Math.max(0, s2 - (SIZE - 1)), xb = Math.min(SIZE - 1, s2);
      for (var xx = xa; xx <= xb; xx++) { W.drawCliff(ctx, xx, s2 - xx); }
    }

    // 2) 소품 + 캐릭터 y정렬
    var ents = [];
    W.props.forEach(function (p) {
      ents.push({ sortY: p.sortY, kind: 'prop', ref: p });
    });
    function charEnt(o, isPlayer) {
      var sc = worldToScreen(o.x, o.y);
      ents.push({ sortY: sc.y, kind: 'char', o: o, sx: sc.x, sy: sc.y, isPlayer: isPlayer });
    }
    visitors.forEach(function (v) { charEnt(v, false); });
    npcs.forEach(function (n) { charEnt(n, false); });
    charEnt(player, true);

    ents.sort(function (a, b) { return a.sortY - b.sortY; });

    ents.forEach(function (e) {
      if (e.kind === 'prop') { e.ref.draw(ctx, time, e.ref.sx, e.ref.sy); return; }
      drawChar(e.o, e.sx, e.sy, e.isPlayer);
    });

    ctx.restore();
  }

  function drawChar(o, sx, sy, isPlayer) {
    var c = o.char;
    // 그림자
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = 'rgba(60,45,40,0.18)';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    S.draw(ctx, { id: c.id, palette: c.palette }, {
      x: sx, y: sy, scale: 1, face: o.face || 1,
      t: time, walk: o.walk || 0, ph: o.phase || 0,
    });

    // 라벨
    var hy = S.headY(c.id) || 62;
    if (isPlayer) {
      label(sx, sy - hy - 12, (c.ko || c.name), '#d84f80', true);
    } else if (o.role) {
      label(sx, sy - hy - 12, o.name + ' · ' + o.role, '#7a5c6a', false);
      if (o === nearNpc && !dlg.open) {
        label(sx, sy - hy - 34, 'E  대화', '#3f8f5f', true, true);
      }
    }
  }

  function label(x, y, text, color, strong, key) {
    ctx.font = (strong ? '700 ' : '600 ') + '13px "Apple SD Gothic Neo","Malgun Gothic",sans-serif';
    var w = ctx.measureText(text).width + 16;
    var h = 20;
    ctx.save();
    ctx.globalAlpha = key ? 0.96 : 0.88;
    roundRect(x - w / 2, y - h, w, h, 8);
    ctx.fillStyle = key ? 'rgba(232,248,238,0.96)' : 'rgba(255,255,255,0.86)';
    ctx.fill();
    ctx.strokeStyle = key ? 'rgba(63,143,95,0.5)' : 'rgba(200,170,150,0.4)';
    ctx.lineWidth = 1.5; ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y - h / 2);
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ── 존 토스트 ────────────────────────
  var toastTimer = null;
  function showToast(zid) {
    var z = ZONES[zid]; if (!z) return;
    var box = document.getElementById('zone-toast');
    document.getElementById('toast-name').textContent = z.ko;
    document.getElementById('toast-hint').textContent = z.hint || '';
    box.classList.remove('hidden', 'fadeout');
    // 리플로우로 애니메이션 리셋
    void box.offsetWidth;
    box.classList.add('shown');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      box.classList.add('fadeout');
      setTimeout(function () { box.classList.add('hidden'); }, 600);
    }, 2200);
  }

  // ── 루프 ─────────────────────────────
  function loop(ts) {
    if (!running) return;
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    time += dt;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }

  window.ISOGame = { start: start };
})();

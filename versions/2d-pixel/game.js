// ANIMALVERSE 도트 빌리지 — 선택 화면 + 월드 게임 루프
// sprites.js (AV_SPRITES) + world.js (AV_WORLD) 위에서 동작.
(function () {
  'use strict';
  var SP = window.AV_SPRITES, W = window.AV_WORLD;
  var chars = window.AV_CHARACTERS || [];
  var npcDefs = window.AV_NPCS || [];
  var ZONES = {}; (window.AV_ZONES || []).forEach(function (z) { ZONES[z.id] = z; });

  var TILE = W.TILE, ZOOM = 3;
  var selected = null;

  // ═══════════ 선택 화면 ═══════════
  var grid = document.getElementById('grid');
  var pvCanvas = document.getElementById('pv-canvas');
  var pvName = document.getElementById('pv-name');
  var pvIntro = document.getElementById('pv-intro');
  var enterBtn = document.getElementById('enter');
  var pvCtx = pvCanvas.getContext('2d');
  pvCtx.imageSmoothingEnabled = false;

  function buildSelect() {
    chars.forEach(function (ch) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      var cv = document.createElement('canvas');
      cv.width = 24; cv.height = 26;
      var g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
      var baked = SP.bake(ch.id, ch.palette);
      // 카드 중앙에 정지 프레임
      SP.draw(g, baked, 0, 1, 12, 25);
      var nm = document.createElement('div');
      nm.className = 'nm'; nm.textContent = ch.ko;
      cell.appendChild(cv); cell.appendChild(nm);
      cell.addEventListener('click', function () { pick(ch, cell); });
      grid.appendChild(cell);
    });
  }

  function pick(ch, cell) {
    selected = ch;
    Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove('sel'); });
    cell.classList.add('sel');
    pvName.innerHTML = ch.ko + '<span class="en">' + ch.en + '</span>';
    pvIntro.textContent = ch.intro || '';
    enterBtn.disabled = false;
  }

  // 미리보기 걷기 애니메이션
  var pvBaked = null, pvT = 0;
  function pvLoop(ts) {
    if (selected) {
      pvBaked = SP.bake(selected.id, selected.palette);
      pvCanvas.width = 24; pvCanvas.height = 26;
      pvCtx.imageSmoothingEnabled = false;
      pvCtx.clearRect(0, 0, 24, 26);
      var frame = Math.floor(ts / 180) % 2;
      SP.draw(pvCtx, pvBaked, frame, 1, 12, 25);
    }
    if (selectActive) requestAnimationFrame(pvLoop);
  }

  var selectActive = true;
  enterBtn.addEventListener('click', function () {
    if (!selected) return;
    selectActive = false;
    document.getElementById('select').classList.add('hidden');
    startWorld();
  });

  // ═══════════ 월드 ═══════════
  var canvas, ctx, cw, ch2, viewW, viewH;
  var keys = {}, time = 0, last = 0;
  var player, npcs = [], visitors = [];
  var curZone = null, nearNpc = null;
  var dlg = { open: false, npc: null, i: 0 };

  function startWorld() {
    W.init();
    canvas = document.getElementById('game');
    canvas.classList.remove('hidden');
    document.getElementById('hud').classList.remove('hidden');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    var ps = W.playerStart;
    player = { char: selected, baked: SP.bake(selected.id, selected.palette),
      x: ps.x, y: ps.y, dir: 1, walk: 0, phase: 0 };

    // NPC
    npcs = npcDefs.map(function (n, i) {
      var spot = W.npcSpots[n.id] || { x: W.PIX_W / 2, y: W.PIX_H / 2 };
      return {
        def: n, baked: SP.bake(n.id, n.palette),
        x: spot.x, y: spot.y, ax: spot.x, ay: spot.y,
        dir: (i % 2 ? 1 : -1), walk: 0, phase: i, seed: i * 1.7,
      };
    });

    // 방문객 6마리
    var pool = chars.filter(function (c) { return c.id !== selected.id; });
    visitors = [];
    for (var k = 0; k < 6 && k < pool.length; k++) {
      var c = pool[(k * 3 + 1) % pool.length];
      visitors.push({
        char: c, baked: SP.bake(c.id, c.palette),
        x: ps.x + (k - 3) * 30, y: ps.y + ((k % 2) ? 40 : -40),
        dir: 1, walk: 0, phase: k, tx: ps.x, ty: ps.y, wait: 0, seed: k * 2.3,
      });
    }

    bindKeys();
    last = 0;
    requestAnimationFrame(loop);
  }

  function resize() {
    cw = window.innerWidth; ch2 = window.innerHeight;
    canvas.style.width = cw + 'px'; canvas.style.height = ch2 + 'px';
    canvas.width = cw; canvas.height = ch2;
    ctx.imageSmoothingEnabled = false;
    viewW = cw / ZOOM; viewH = ch2 / ZOOM;
  }

  function bindKeys() {
    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      keys[k] = true;
      if (k === 'e') { e.preventDefault(); interact(); }
      if (k.indexOf('arrow') === 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
  }

  function interact() {
    if (dlg.open) {
      dlg.i++;
      if (dlg.i >= dlg.npc.def.dialogue.length) closeDlg();
      else showDlg();
      return;
    }
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

  function moveEnt(ent, dx, dy, spd, dt) {
    var nx = ent.x + dx * spd * dt, ny = ent.y + dy * spd * dt;
    if (!W.isSolidPx(nx, ent.y)) ent.x = nx;
    if (!W.isSolidPx(ent.x, ny)) ent.y = ny;
    if (Math.abs(dx) > 0.01) ent.dir = dx < 0 ? -1 : 1;
  }

  function update(dt) {
    // 플레이어
    if (!dlg.open) {
      var dx = 0, dy = 0;
      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;
      var mag = Math.hypot(dx, dy);
      if (mag > 0) { dx /= mag; dy /= mag; moveEnt(player, dx, dy, 82, dt); }
      player.walk += ((mag > 0 ? 1 : 0) - player.walk) * Math.min(1, dt * 12);
      player.phase += dt * 8 * (0.2 + player.walk);
    }

    // 존
    var z = W.zoneAt(player.x, player.y);
    if (z && z !== curZone) { curZone = z; toast(z); }

    // NPC 배회
    nearNpc = null; var bestD = 34;
    npcs.forEach(function (n) {
      n.phase += dt * 2;
      var tx = n.ax + Math.cos(n.seed + time * 0.3) * 12;
      var ty = n.ay + Math.sin(n.seed * 1.3 + time * 0.26) * 12;
      var dx = tx - n.x, dy = ty - n.y, dl = Math.hypot(dx, dy);
      if (dl > 2) { moveEnt(n, dx / dl, dy / dl, 12, dt); n.walk += (1 - n.walk) * Math.min(1, dt * 6); }
      else n.walk += (0 - n.walk) * Math.min(1, dt * 6);
      var pd = Math.hypot(n.x - player.x, n.y - player.y);
      if (pd < bestD) { bestD = pd; nearNpc = n; }
    });

    // 방문객
    visitors.forEach(function (v) {
      v.phase += dt * 8 * (0.2 + v.walk);
      if (v.wait > 0) { v.wait -= dt; v.walk += (0 - v.walk) * Math.min(1, dt * 6); return; }
      var dx = v.tx - v.x, dy = v.ty - v.y, dl = Math.hypot(dx, dy);
      if (dl < 6) {
        var a = (v.seed += 2.1);
        v.tx = v.x + Math.cos(a) * (40 + (a % 40));
        v.ty = v.y + Math.sin(a * 1.2) * (40 + (a % 30));
        v.tx = Math.max(60, Math.min(W.PIX_W - 60, v.tx));
        v.ty = Math.max(60, Math.min(W.PIX_H - 60, v.ty));
        v.wait = 0.6 + (a % 2);
        v.walk += (0 - v.walk) * 0.5;
      } else {
        var before = v.x + v.y;
        moveEnt(v, dx / dl, dy / dl, 44, dt);
        if (Math.abs(v.x + v.y - before) < 0.3) { v.wait = 0.3; } // 막힘
        v.walk += (1 - v.walk) * Math.min(1, dt * 6);
      }
    });
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch2);

    // 카메라 (월드 px)
    var camX = Math.round(clamp(player.x - viewW / 2, 0, Math.max(0, W.PIX_W - viewW)));
    var camY = Math.round(clamp(player.y - viewH / 2, 0, Math.max(0, W.PIX_H - viewH)));

    ctx.setTransform(ZOOM, 0, 0, ZOOM, -camX * ZOOM, -camY * ZOOM);

    W.drawGround(ctx, camX, camY, viewW, viewH, time * 1000);
    W.drawGroundDecor(ctx, time * 1000);

    // 엔티티 + 소품 y정렬
    var ents = [];
    W.props.forEach(function (p) {
      var fy = p.float ? Math.sin(time * 1.5 + p.x) * 2 : 0;
      ents.push({ sortY: p.sortY, t: 'prop', p: p, fy: fy });
    });
    ents.push(entOf(player, true, false));
    npcs.forEach(function (n) { ents.push(entOf(n, false, true)); });
    visitors.forEach(function (v) { ents.push(entOf(v, false, false)); });
    ents.sort(function (a, b) { return a.sortY - b.sortY; });

    ents.forEach(function (e) {
      if (e.t === 'prop') { ctx.drawImage(e.p.img, e.p.x, e.p.y + e.fy); return; }
      var o = e.o;
      var frame = (o.walk > 0.1) ? (Math.floor(time * 6 + o.phase) % 2) : 0;
      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(Math.round(o.x - 6), Math.round(o.y - 2), 12, 3);
      SP.draw(ctx, o.baked, frame, o.dir, o.x, o.y);
    });

    // 라벨 (스크린 스케일, 선명하게)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    function toScreen(wx, wy) { return { x: (wx - camX) * ZOOM, y: (wy - camY) * ZOOM }; }
    // 플레이어 이름
    drawLabel(toScreen(player.x, player.y - 28), player.char.ko, '#ffd94a', '#3a2f22');
    npcs.forEach(function (n) {
      drawLabel(toScreen(n.x, n.y - 28), n.def.name + ' · ' + n.def.role, '#fff', '#2a2440');
    });

    // 상호작용 힌트
    var hint = document.getElementById('interact');
    if (nearNpc && !dlg.open) hint.classList.remove('hidden');
    else hint.classList.add('hidden');
  }

  function entOf(o, isP, isNpc) {
    return { sortY: o.y, t: 'ent', o: o, isP: isP, isNpc: isNpc };
  }

  function drawLabel(pos, text, color, bg) {
    ctx.font = '11px monospace';
    var w = ctx.measureText(text).width + 12;
    var x = Math.round(pos.x - w / 2), y = Math.round(pos.y - 18);
    ctx.fillStyle = 'rgba(20,16,28,0.82)';
    ctx.fillRect(x, y, w, 16);
    ctx.fillStyle = bg; ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, pos.x, y + 9);
  }

  function toast(zid) {
    var z = ZONES[zid]; if (!z) return;
    document.getElementById('zone-name').textContent = z.ko;
    document.getElementById('zone-hint').textContent = z.hint || '';
    var el = document.getElementById('zone');
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function loop(ts) {
    if (!last) last = ts;
    var dt = Math.min(0.05, (ts - last) / 1000); last = ts;
    time += dt;
    update(dt); render();
    requestAnimationFrame(loop);
  }

  // 시작
  buildSelect();
  requestAnimationFrame(pvLoop);
})();

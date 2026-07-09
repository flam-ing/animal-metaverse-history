// ANIMALVERSE 토이 아일랜드 (Babylon.js) — 월드 + 선택 무대 + 게임 루프
(function () {
  'use strict';
  var B = window.BABYLON, A = window.BJSAnimals;
  var CHARS = window.AV_CHARACTERS || [];
  var NPCS = window.AV_NPCS || [];
  var ZONES = {}; (window.AV_ZONES || []).forEach(function (z) { ZONES[z.id] = z; });

  var ZONE_POS = {
    plaza: { x: 0, z: 0, r: 7 },
    park: { x: -13, z: -9, r: 8 },
    cafe: { x: 13, z: -9, r: 8 },
    lake: { x: -13, z: 11, r: 9 },
    hotspring: { x: 13, z: 11, r: 8 },
  };
  var ISLAND_R = 25;

  var canvas = document.getElementById('gl');
  var engine = new B.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
  var scene = new B.Scene(engine);
  scene.clearColor = B.Color4.FromHexString('#BFE3F2FF');
  scene.fogMode = B.Scene.FOGMODE_LINEAR; scene.fogColor = B.Color3.FromHexString('#CFE9F4');
  scene.fogStart = 40; scene.fogEnd = 80;

  var camera = new B.TargetCamera('cam', new B.Vector3(0, 8, -14), scene);
  camera.setTarget(new B.Vector3(0, 1, 0));

  var hemi = new B.HemisphericLight('h', new B.Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.55; hemi.groundColor = B.Color3.FromHexString('#5a8a48');
  var sun = new B.DirectionalLight('s', new B.Vector3(-0.6, -1, -0.4), scene);
  sun.position = new B.Vector3(20, 40, 20); sun.intensity = 0.95;
  var glow = new B.GlowLayer('glow', scene); glow.intensity = 0.32;

  var mode = 'select';
  var player = null, npcs = [], visitors = [], keys = {};
  var curZone = null, nearNpc = null;
  var selectedDef = null, stageRoot = null, stageRig = null, stageSpin = 0;
  var dlg = { open: false, npc: null, i: 0 };
  var worldRoot = new B.TransformNode('world', scene); worldRoot.setEnabled(false);
  var animProps = { fountain: [], steam: [] };
  var labelPool = [];
  var TREE_CANDY = ['#FF9EC5', '#7FD8A8', '#FFD36E', '#8FC8FF'];
  var treeIdx = 0;

  buildWorld();
  buildStage();
  buildSelectUI();
  bindInput();

  document.getElementById('loading').style.opacity = '0';
  setTimeout(function () { document.getElementById('loading').classList.add('hidden'); }, 420);
  document.getElementById('select').classList.remove('hidden');

  // ── 월드 ─────────────────────────────
  function mat(hex, opts) { return A.mat(scene, hex, opts); }
  function sph(d, hex, o) { var m = B.MeshBuilder.CreateSphere('w', { diameter: d, segments: 10 }, scene); m.material = mat(hex, o); m.parent = worldRoot; return m; }
  function boxm(w, h, d, hex, o) { var m = B.MeshBuilder.CreateBox('w', { width: w, height: h, depth: d }, scene); m.material = mat(hex, o); m.parent = worldRoot; return m; }
  function cylm(dt, db, h, hex, o) { var m = B.MeshBuilder.CreateCylinder('w', { diameterTop: dt, diameterBottom: db, height: h, tessellation: 16 }, scene); m.material = mat(hex, o); m.parent = worldRoot; return m; }
  function at(m, x, y, z) { m.position.set(x, y, z); return m; }

  function buildWorld() {
    // 물
    var water = B.MeshBuilder.CreateDisc('water', { radius: 70, tessellation: 48 }, scene);
    water.rotation.x = Math.PI / 2; water.position.y = -0.35; water.parent = worldRoot;
    var wm = mat('#6FC6E4', { gloss: 'high' }); wm.alpha = 0.9; wm.specularPower = 128; water.material = wm;
    // 섬
    var land = cylm(ISLAND_R * 2, (ISLAND_R - 1.5) * 2, 1.4, '#8CD070', { gloss: 'high' }); at(land, 0, -0.2, 0);
    var beach = B.MeshBuilder.CreateTorus('beach', { diameter: (ISLAND_R - 1) * 2, thickness: 3, tessellation: 40 }, scene);
    beach.rotation.x = 0; beach.scaling.y = 0.05; at(beach, 0, 0.5, 0); beach.material = mat('#F0DCAE'); beach.parent = worldRoot;

    buildPlaza(ZONE_POS.plaza);
    buildPark(ZONE_POS.park);
    buildCafe(ZONE_POS.cafe);
    buildLake(ZONE_POS.lake);
    buildOnsen(ZONE_POS.hotspring);
    scatterGrass();
  }

  function buildPlaza(p) {
    at(cylm(6.8, 7.4, 0.5, '#C9D2DF'), p.x, 0.5, p.z);
    at(cylm(4, 2.8, 0.5, '#B8BFCC'), p.x, 1.1, p.z);
    at(cylm(0.6, 0.6, 1.2, '#B8BFCC'), p.x, 1.9, p.z);
    var top = at(cylm(1.8, 1.0, 0.35, '#A8CDE8'), p.x, 2.6, p.z);
    // 물방울 (글로우)
    for (var i = 0; i < 12; i++) {
      var d = sph(0.16, '#BFE6F5', { glow: true });
      d.__a = (i / 12) * Math.PI * 2; d.__t = Math.random(); at(d, p.x, 2.8, p.z);
      animProps.fountain.push({ mesh: d, cx: p.x, cz: p.z });
    }
    // 게시판
    at(boxm(1.8, 1.2, 0.16, '#C9A06A'), p.x + 4, 1.3, p.z - 1.5);
    at(boxm(1.4, 0.85, 0.04, '#FFF8EC', { glow: true }), p.x + 4, 1.35, p.z - 1.42);
    // 광장 둘레 캔디 가로등 4개 (스폰 지점 피해서 대각선 배치)
    [[4.8, 4.8], [-4.8, 4.8], [4.8, -4.8], [-4.8, -4.8]].forEach(function (o) { candyLamp(p.x + o[0], p.z + o[1]); });
  }

  function toyTree(x, z) {
    // 막대사탕 나무 — 반질반질한 캔디 구슬 하나 + 매끈한 기둥
    var col = TREE_CANDY[treeIdx++ % TREE_CANDY.length];
    var g = new B.TransformNode('t', scene); g.parent = worldRoot; g.position.set(x, 0.5, z);
    at(cylm(0.34, 0.44, 2.0, '#F7F1E3', { gloss: 'high' }), 0, 1.0, 0).parent = g;
    var ball = B.MeshBuilder.CreateSphere('b', { diameter: 2.6, segments: 14 }, scene);
    ball.material = mat(col, { gloss: 'high' }); ball.parent = g; ball.position.y = 3.0;
    var shine = B.MeshBuilder.CreateSphere('bs', { diameter: 0.5, segments: 8 }, scene);
    shine.material = mat('#FFFFFF', { glow: true }); shine.parent = ball; shine.position.set(-0.7, 0.75, -0.5);
    return g;
  }
  function candyLamp(x, z) {
    // 줄무늬 기둥 + 글로우 구슬 가로등
    var g = new B.TransformNode('cl', scene); g.parent = worldRoot; g.position.set(x, 0.5, z);
    for (var i = 0; i < 6; i++) {
      var seg = cylm(0.14, 0.14, 0.34, i % 2 ? '#FFFFFF' : '#FF6E8C', { gloss: 'high' });
      seg.parent = g; seg.position.y = 0.17 + i * 0.34;
    }
    var bulb = B.MeshBuilder.CreateSphere('lb', { diameter: 0.5, segments: 10 }, scene);
    bulb.material = mat('#FFE9A8', { glow: true }); bulb.parent = g; bulb.position.y = 2.3;
    return g;
  }
  function toyBlocks(x, z) {
    // 쌓아 놓은 장난감 블록
    var cols = ['#FF8A7A', '#7FC8FF', '#FFD36E'];
    for (var i = 0; i < 3; i++) {
      var bl = boxm(0.7 - i * 0.12, 0.5, 0.7 - i * 0.12, cols[i], { gloss: 'high' });
      at(bl, x + (i % 2 ? 0.08 : -0.06), 0.75 + i * 0.5, z);
      bl.rotation.y = i * 0.5;
    }
  }
  function buildPark(p) {
    [[-3, -2], [3, -3], [0, 3], [4, 1], [-4, 2]].forEach(function (o) { toyTree(p.x + o[0], p.z + o[1]); });
    at(boxm(2, 0.16, 0.6, '#C98A4A'), p.x + 1, 1.1, p.z + 5);
    at(boxm(2, 0.6, 0.14, '#B57A3A'), p.x + 1, 1.4, p.z + 4.72);
    toyBlocks(p.x - 5, p.z + 4);
  }

  function shop(x, z, roof) {
    at(boxm(3, 2.4, 3, '#FBEEE0', { gloss: 'high' }), x, 1.2, z);
    var rf = at(cylm(0, 3.6, 1.4, roof, { gloss: 'high' }), x, 3.1, z); rf.rotation.y = Math.PI / 4;
    at(boxm(0.8, 1.3, 0.1, '#8A6A52'), x, 0.65, z + 1.52);
    at(boxm(3.2, 0.1, 0.9, roof), x, 1.9, z + 1.7).rotation.x = -0.25;
  }
  function buildCafe(p) { shop(p.x - 3, p.z - 2, '#E27E96'); shop(p.x + 3, p.z - 2, '#4CAF6D'); shop(p.x, p.z + 3, '#E0A030'); }

  function buildLake(p) {
    var pond = B.MeshBuilder.CreateDisc('pond', { radius: 5, tessellation: 32 }, scene);
    pond.rotation.x = Math.PI / 2; at(pond, p.x, 0.53, p.z); pond.parent = worldRoot;
    var pm = mat('#5FB8D8', { gloss: 'high' }); pm.specularPower = 128; pond.material = pm;
    at(boxm(1.2, 0.2, 4, '#B98A52'), p.x, 0.62, p.z - 4.5);
  }

  function buildOnsen(p) {
    at(cylm(6.8, 7.2, 0.6, '#B7936A'), p.x, 0.8, p.z);
    var w = B.MeshBuilder.CreateDisc('ow', { radius: 2.7, tessellation: 28 }, scene);
    w.rotation.x = Math.PI / 2; at(w, p.x, 1.02, p.z); w.parent = worldRoot;
    var wm = mat('#CFEFF0', { glow: true }); wm.alpha = 0.92; w.material = wm;
    for (var i = 0; i < 5; i++) { var a = (i / 5) * Math.PI * 2; at(sph(1.0, '#8A7A6A'), p.x + Math.cos(a) * 3, 0.7, p.z + Math.sin(a) * 3); }
    for (var k = 0; k < 6; k++) {
      var puff = sph(1.4, '#FFFFFF', { glow: true }); puff.material = puff.material.clone('pf'); puff.material.alpha = 0.4;
      puff.__t = Math.random(); puff.__x = p.x + (Math.random() - 0.5) * 4; puff.__z = p.z + (Math.random() - 0.5) * 4;
      at(puff, puff.__x, 1.2, puff.__z); animProps.steam.push(puff);
    }
  }

  function scatterGrass() {
    for (var i = 0; i < 36; i++) {
      var a = Math.random() * Math.PI * 2, r = Math.random() * (ISLAND_R - 3);
      var x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (nearestZone(x, z).d < 3.5) continue;
      at(cylm(0, 0.36, 0.5, i % 2 ? '#7BBF5A' : '#F6D94A'), x, 0.72, z);
    }
  }

  // ── 선택 무대 ─────────────────────────
  function buildStage() {
    stageRoot = new B.TransformNode('stage', scene);
    var ped = B.MeshBuilder.CreateCylinder('ped', { diameterTop: 4.8, diameterBottom: 5.6, height: 0.5, tessellation: 24 }, scene);
    ped.material = mat('#2a4478', { glow: true }); ped.parent = stageRoot; ped.position.y = 0.25;
    setStageAnimal(CHARS[0]);
  }
  function setStageAnimal(def) {
    if (stageRig) stageRig.root.dispose(false, true);
    stageRig = A.build(scene, def);
    stageRig.root.parent = stageRoot;
    stageRig.root.position.y = 0.5; stageRig.root.scaling.setAll(1.4);
    selectedDef = def;
  }

  // ── 선택 UI ───────────────────────────
  function buildSelectUI() {
    var grid = document.getElementById('char-grid');
    CHARS.forEach(function (def) {
      var card = document.createElement('div');
      card.className = 'ccard';
      card.innerHTML = '<div class="ce">' + (def.emoji || '🐾') + '</div><div class="cn">' + def.ko + '</div>';
      card.addEventListener('click', function () {
        grid.querySelectorAll('.ccard').forEach(function (c) { c.classList.remove('sel'); });
        card.classList.add('sel');
        setStageAnimal(def);
        document.getElementById('info-name').innerHTML = def.ko + '<span class="en">' + def.en + '</span>';
        document.getElementById('info-intro').textContent = def.intro || '';
      });
      grid.appendChild(card);
    });
    grid.firstChild.click();
    document.getElementById('enter-btn').addEventListener('click', enterWorld);
  }

  // ── 월드 진입 ─────────────────────────
  function makeLabel(cls) {
    var el = document.createElement('div'); el.className = 'nlabel' + (cls ? ' ' + cls : '');
    document.getElementById('labels').appendChild(el); return el;
  }

  function enterWorld() {
    mode = 'world';
    document.getElementById('select').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    stageRoot.setEnabled(false);
    worldRoot.setEnabled(true);

    player = A.build(scene, selectedDef);
    player.root.position.set(0, 0.5, 5); player.heading = Math.PI;
    player.label = makeLabel('player'); player.label.textContent = selectedDef.ko;

    npcs = NPCS.map(function (nd, i) {
      var zp = ZONE_POS[nd.zone] || ZONE_POS.plaza;
      var a = (i / NPCS.length) * Math.PI * 2;
      var rig = A.build(scene, nd);
      var x = zp.x + Math.cos(a) * 2.5, z = zp.z + Math.sin(a) * 2.5;
      rig.root.position.set(x, 0.5, z);
      rig.def = nd; rig.anchor = { x: x, z: z }; rig.seed = i * 1.7; rig.heading = 0;
      rig.label = makeLabel(); rig.label.innerHTML = nd.name + '<span class="rl">' + nd.role + '</span>';
      return rig;
    });

    var pool = CHARS.filter(function (c) { return c.id !== selectedDef.id; });
    visitors = [];
    for (var k = 0; k < 6 && k < pool.length; k++) {
      var def = pool[(k * 3 + 1) % pool.length];
      var rig = A.build(scene, def);
      var a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 12;
      rig.root.position.set(Math.cos(a) * r, 0.5, Math.sin(a) * r);
      rig.target = pickWander(); rig.wait = 0; rig.heading = 0;
      visitors.push(rig);
    }
  }
  function pickWander() { var a = Math.random() * Math.PI * 2, r = Math.random() * (ISLAND_R - 5); return { x: Math.cos(a) * r, z: Math.sin(a) * r }; }

  // ── 입력 / 대화 ───────────────────────
  function bindInput() {
    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase(); keys[k] = true;
      if (k === 'e') { e.preventDefault(); interact(); }
      if (k.indexOf('arrow') === 0) e.preventDefault();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('resize', function () { engine.resize(); });
  }
  function interact() {
    if (mode !== 'world') return;
    if (dlg.open) { dlg.i++; if (dlg.i >= dlg.npc.def.dialogue.length) closeDlg(); else showDlg(); return; }
    if (nearNpc) openDlg(nearNpc);
  }
  function openDlg(nn) { dlg.open = true; dlg.npc = nn; dlg.i = 0; document.getElementById('dialogue').classList.remove('hidden'); showDlg(); }
  function showDlg() {
    var nd = dlg.npc.def;
    document.getElementById('dlg-name').innerHTML = nd.name + '<span class="role">' + nd.role + '</span>';
    document.getElementById('dlg-text').textContent = nd.dialogue[dlg.i];
  }
  function closeDlg() { dlg.open = false; dlg.npc = null; document.getElementById('dialogue').classList.add('hidden'); }

  function nearestZone(x, z) {
    var best = null, bd = 1e9;
    for (var id in ZONE_POS) { var p = ZONE_POS[id]; var d = Math.hypot(x - p.x, z - p.z); if (d < bd) { bd = d; best = id; } }
    return { id: best, d: bd, r: ZONE_POS[best].r };
  }

  // ── 라벨 투영 ─────────────────────────
  function projectLabel(el, node, labelY) {
    var pos = node.getAbsolutePosition();
    var v = new B.Vector3(pos.x, pos.y + (labelY || 1.5) + 0.5, pos.z);
    var p = B.Vector3.Project(v, B.Matrix.Identity(), scene.getTransformMatrix(),
      camera.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight()));
    if (p.z > 1 || p.z < 0) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    el.style.left = (p.x / (window.devicePixelRatio || 1)) + 'px';
    el.style.top = (p.y / (window.devicePixelRatio || 1)) + 'px';
  }

  function angleDelta(from, to) { var d = (to - from) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; }

  // ── 루프 ──────────────────────────────
  var last = 0;
  engine.runRenderLoop(function () {
    var t = performance.now() / 1000;
    var dt = last ? Math.min(0.05, t - last) : 0.016; last = t;
    animateProps(t);
    if (mode === 'select') {
      stageSpin += dt * 0.7; stageRoot.rotation.y = stageSpin;
      if (stageRig) A.animate(stageRig, t, 0);
      // 동물 키(labelY)에 맞춰 카메라를 물려 잡음 — 키다리도 프레임 안에
      var h = ((stageRig && stageRig.labelY) || 1.5) * 1.4 + 0.5;
      camera.position = B.Vector3.Lerp(camera.position, new B.Vector3(0, 0.9 + h * 0.5, -(4.4 + h * 1.35)), 0.08);
      camera.setTarget(new B.Vector3(0, h * 0.42, 0));
    } else if (player) {
      updateWorld(dt, t);
    }
    scene.render();
  });

  function animateProps(t) {
    animProps.fountain.forEach(function (f) {
      f.mesh.__t += 0.03; var ph = f.mesh.__t % 1;
      f.mesh.position.y = 2.8 + Math.sin(ph * Math.PI) * 1.2;
      f.mesh.position.x = f.cx + Math.cos(f.mesh.__a) * ph * 0.6;
      f.mesh.position.z = f.cz + Math.sin(f.mesh.__a) * ph * 0.6;
    });
    animProps.steam.forEach(function (s) {
      s.__t += 0.006; var ph = s.__t % 1;
      s.position.y = 1.2 + ph * 3; s.material.alpha = 0.42 * (1 - ph); s.scaling.setAll(1 + ph * 1.5);
    });
  }

  function updateWorld(dt, t) {
    var mx = 0, mz = 0;
    if (!dlg.open) {
      if (keys['w'] || keys['arrowup']) mz += 1;
      if (keys['s'] || keys['arrowdown']) mz -= 1;
      if (keys['a'] || keys['arrowleft']) mx -= 1;
      if (keys['d'] || keys['arrowright']) mx += 1;
    }
    var mag = Math.hypot(mx, mz), speed = 0;
    if (mag > 0) {
      mx /= mag; mz /= mag; speed = 1;
      var nx = player.root.position.x + mx * 6 * dt, nz = player.root.position.z + mz * 6 * dt;
      if (Math.hypot(nx, nz) < ISLAND_R - 2) { player.root.position.x = nx; player.root.position.z = nz; }
      player.heading = Math.atan2(mx, mz);
    }
    player.root.rotation.y += angleDelta(player.root.rotation.y, player.heading) * 0.2;
    A.animate(player, t, speed);
    projectLabel(player.label, player.root, player.labelY);

    var px = player.root.position.x, pz = player.root.position.z;
    // 3인칭 추적 카메라
    var desired = new B.Vector3(px - Math.sin(player.heading) * 9, 6, pz - Math.cos(player.heading) * 9);
    camera.position = B.Vector3.Lerp(camera.position, desired, 0.07);
    camera.setTarget(new B.Vector3(px, 1.4, pz));

    var nz2 = nearestZone(px, pz); var inZone = nz2.d < nz2.r ? nz2.id : null;
    if (inZone && inZone !== curZone) { curZone = inZone; showToast(inZone); }

    nearNpc = null; var bestD = 3.2;
    npcs.forEach(function (nn) {
      var tx = nn.anchor.x + Math.cos(nn.seed + t * 0.3) * 1.6, tz = nn.anchor.z + Math.sin(nn.seed * 1.3 + t * 0.26) * 1.6;
      var dx = tx - nn.root.position.x, dz = tz - nn.root.position.z, dl = Math.hypot(dx, dz), sp = 0;
      if (dl > 0.15) { sp = 1; nn.root.position.x += (dx / dl) * 1.4 * dt; nn.root.position.z += (dz / dl) * 1.4 * dt; nn.heading = Math.atan2(dx, dz); }
      nn.root.rotation.y += angleDelta(nn.root.rotation.y, nn.heading) * 0.15;
      A.animate(nn, t, sp * 0.7);
      projectLabel(nn.label, nn.root, nn.labelY);
      var pd = Math.hypot(nn.root.position.x - px, nn.root.position.z - pz);
      if (pd < bestD) { bestD = pd; nearNpc = nn; }
    });

    visitors.forEach(function (v) {
      if (v.wait > 0) { v.wait -= dt; A.animate(v, t, 0); return; }
      var dx = v.target.x - v.root.position.x, dz = v.target.z - v.root.position.z, dl = Math.hypot(dx, dz);
      if (dl < 0.4) { v.target = pickWander(); v.wait = 0.6 + Math.random(); A.animate(v, t, 0); return; }
      v.root.position.x += (dx / dl) * 2 * dt; v.root.position.z += (dz / dl) * 2 * dt;
      v.heading = Math.atan2(dx, dz); v.root.rotation.y += angleDelta(v.root.rotation.y, v.heading) * 0.15;
      A.animate(v, t, 1);
    });

    var hint = document.getElementById('interact-hint');
    if (nearNpc && !dlg.open) { hint.classList.remove('hidden'); document.getElementById('interact-text').textContent = '대화 — ' + nearNpc.def.name; }
    else hint.classList.add('hidden');
  }

  var toastTimer = null;
  function showToast(zid) {
    var z = ZONES[zid]; if (!z) return;
    var el = document.getElementById('toast');
    el.innerHTML = z.ko + '<span class="sub">' + (z.hint || '') + '</span>';
    el.classList.add('show'); clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }
})();

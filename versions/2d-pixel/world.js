// ANIMALVERSE 도트 빌리지 — 타일맵 월드 생성 + 소품 베이킹
(function () {
  'use strict';

  var TILE = 16;
  var MAP_W = 64;
  var MAP_H = 48;

  // 타일 id
  var T = {
    GRASS: 0, GRASS2: 1, FLOWER: 2, DIRT: 3,
    STONE: 4, STONE2: 5, SAND: 6, WATER: 7,
    HOTWATER: 8, WOOD: 9, ROCKPATH: 10,
  };

  var map = [];     // map[y][x] = tile id
  var solid = [];   // solid[y][x] = true/false

  // 시드 난수 (매번 같은 마을)
  function makeRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // ---------------------------------------------------------------
  // 맵 생성
  // ---------------------------------------------------------------
  function fillRect(x0, y0, x1, y1, t) {
    for (var y = Math.max(0, y0); y <= Math.min(MAP_H - 1, y1); y++)
      for (var x = Math.max(0, x0); x <= Math.min(MAP_W - 1, x1); x++)
        map[y][x] = t;
  }

  function genMap() {
    var rng = makeRng(20260707);
    var x, y;
    for (y = 0; y < MAP_H; y++) {
      map.push([]);
      solid.push([]);
      for (x = 0; x < MAP_W; x++) {
        var r = rng();
        map[y].push(r < 0.08 ? T.FLOWER : (r < 0.35 ? T.GRASS2 : T.GRASS));
        solid[y].push(false);
      }
    }

    // 반짝 호수 (서쪽 타원) + 모래 테두리
    var cx = 10, cy = 27, rx = 8.5, ry = 11;
    for (y = 0; y < MAP_H; y++) {
      for (x = 0; x < MAP_W; x++) {
        var dx = (x - cx) / (rx + 1.7), dy = (y - cy) / (ry + 1.7);
        if (dx * dx + dy * dy <= 1) map[y][x] = T.SAND;
      }
    }
    for (y = 0; y < MAP_H; y++) {
      for (x = 0; x < MAP_W; x++) {
        var dx2 = (x - cx) / rx, dy2 = (y - cy) / ry;
        if (dx2 * dx2 + dy2 * dy2 <= 1) map[y][x] = T.WATER;
      }
    }

    // 중앙 광장 (돌바닥 체커)
    for (y = 17; y <= 30; y++)
      for (x = 24; x <= 40; x++)
        map[y][x] = ((x + y) % 2 === 0) ? T.STONE : T.STONE2;

    // 길: 광장 → 공원 / 카페 / 온천 / 호수
    fillRect(31, 12, 33, 17, T.DIRT);          // 북쪽 공원으로
    fillRect(40, 22, 45, 24, T.DIRT);          // 동쪽 카페로
    fillRect(31, 30, 33, 37, T.DIRT);          // 남쪽 온천으로
    fillRect(20, 26, 24, 28, T.DIRT);          // 서쪽 호수로
    fillRect(18, 7, 46, 9, T.DIRT);            // 공원 산책로
    fillRect(31, 9, 33, 12, T.DIRT);

    // 카페 거리 (밝은 돌 도로)
    for (y = 21; y <= 26; y++)
      for (x = 44; x <= 63; x++)
        map[y][x] = ((x + y) % 2 === 0) ? T.STONE2 : T.ROCKPATH;

    // 온천 마을 바닥 (돌길 패치)
    for (y = 37; y <= 45; y++)
      for (x = 23; x <= 42; x++)
        if ((x + y * 3) % 7 !== 0) map[y][x] = T.ROCKPATH;

    // 온천탕 2곳
    fillRect(26, 39, 31, 42, T.HOTWATER);
    fillRect(34, 40, 38, 42, T.HOTWATER);

    // 분수 (3x3 물) — 소품이 위에 그려짐
    fillRect(30, 21, 32, 23, T.STONE);

    // 부두 (호수 위 나무길)
    fillRect(12, 27, 17, 28, T.WOOD);

    // 충돌 지정: 물/온천물은 못 감, 나무길은 감
    for (y = 0; y < MAP_H; y++)
      for (x = 0; x < MAP_W; x++)
        solid[y][x] = (map[y][x] === T.WATER || map[y][x] === T.HOTWATER);
  }

  function setSolid(tx, ty, w, h) {
    for (var y = ty; y < ty + h; y++)
      for (var x = tx; x < tx + w; x++)
        if (y >= 0 && y < MAP_H && x >= 0 && x < MAP_W) solid[y][x] = true;
  }

  // ---------------------------------------------------------------
  // 타일셋 베이킹
  // ---------------------------------------------------------------
  var tileset = null;
  var TILE_KINDS = 16; // 가로 셀 수

  function px(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

  function bakeTiles() {
    tileset = document.createElement('canvas');
    tileset.width = TILE * TILE_KINDS;
    tileset.height = TILE * 3; // 물 애니메이션 3프레임용 행
    var c = tileset.getContext('2d');
    c.imageSmoothingEnabled = false;
    var rng = makeRng(4242);
    var i, f;

    function cell(id) { return id * TILE; }

    // 잔디 1/2
    px(c, cell(T.GRASS), 0, TILE, TILE, '#4E9A4E');
    for (i = 0; i < 5; i++) px(c, cell(T.GRASS) + ((i * 5) % 14) + 1, ((i * 7) % 14) + 1, 1, 1, '#5FB05C');
    px(c, cell(T.GRASS2), 0, TILE, TILE, '#529F51');
    for (i = 0; i < 6; i++) px(c, cell(T.GRASS2) + ((i * 3) % 14) + 1, ((i * 11) % 14) + 1, 1, 2, '#437F42');

    // 꽃잔디
    px(c, cell(T.FLOWER), 0, TILE, TILE, '#4E9A4E');
    px(c, cell(T.FLOWER) + 3, 4, 2, 2, '#FFD3E0');
    px(c, cell(T.FLOWER) + 10, 9, 2, 2, '#FFF3B8');
    px(c, cell(T.FLOWER) + 6, 12, 1, 1, '#FFFFFF');
    px(c, cell(T.FLOWER) + 12, 3, 1, 1, '#F4739C');

    // 흙길
    px(c, cell(T.DIRT), 0, TILE, TILE, '#C9A briefly'.slice(0, 0) || '#C9A36B');
    for (i = 0; i < 6; i++) px(c, cell(T.DIRT) + ((i * 5) % 13) + 1, ((i * 9) % 13) + 1, 2, 1, '#B8905A');
    px(c, cell(T.DIRT) + 4, 10, 3, 1, '#D9B57E');

    // 돌바닥 1/2 + 밝은 돌
    px(c, cell(T.STONE), 0, TILE, TILE, '#9AA0A8');
    px(c, cell(T.STONE), 0, TILE, 1, '#AAB0B8');
    px(c, cell(T.STONE) + 7, 7, 2, 2, '#8A9098');
    px(c, cell(T.STONE2), 0, TILE, TILE, '#A8AEB6');
    px(c, cell(T.STONE2), 0, 1, TILE, '#B8BEC6');
    px(c, cell(T.STONE2) + 3, 11, 2, 1, '#989EA6');
    px(c, cell(T.ROCKPATH), 0, TILE, TILE, '#B6B0A2');
    px(c, cell(T.ROCKPATH) + 2, 2, 5, 4, '#C6C0B2');
    px(c, cell(T.ROCKPATH) + 9, 8, 5, 5, '#A6A092');
    px(c, cell(T.ROCKPATH) + 3, 10, 4, 3, '#C0BAAC');

    // 모래
    px(c, cell(T.SAND), 0, TILE, TILE, '#E8D9A8');
    for (i = 0; i < 5; i++) px(c, cell(T.SAND) + ((i * 6) % 14) + 1, ((i * 4) % 14) + 1, 1, 1, '#D8C globalization'.slice(0, 0) || '#D8C48E');

    // 물 3프레임 (행 0,1,2)
    for (f = 0; f < 3; f++) {
      px(c, cell(T.WATER), f * TILE, TILE, TILE, '#3E7FC1');
      px(c, cell(T.WATER), f * TILE, TILE, 1, '#4E8FD1');
      var oy = f * TILE;
      var offs = [[2, 3], [9, 6], [5, 11], [12, 13]];
      for (i = 0; i < offs.length; i++) {
        var wx = (offs[i][0] + f * 3) % 14 + 1;
        var wy = offs[i][1];
        px(c, cell(T.WATER) + wx, oy + wy, 3, 1, '#6FAFE1');
        if ((i + f) % 3 === 0) px(c, cell(T.WATER) + wx + 1, oy + wy - 1, 1, 1, '#CFE7F7');
      }
    }

    // 온천물 2프레임 (행 0,1)
    for (f = 0; f < 2; f++) {
      var hy = f * TILE;
      px(c, cell(T.HOTWATER), hy, TILE, TILE, '#7FC4CE');
      var hof = [[3, 4], [10, 8], [6, 12]];
      for (i = 0; i < hof.length; i++) {
        var hx = (hof[i][0] + f * 4) % 13 + 1;
        px(c, cell(T.HOTWATER) + hx, hy + hof[i][1], 3, 1, '#A5DCE4');
      }
      px(c, cell(T.HOTWATER) + (f ? 11 : 4), hy + 2, 1, 1, '#E5F5F8');
    }

    // 나무 널빤지
    px(c, cell(T.WOOD), 0, TILE, TILE, '#A87B4E');
    px(c, cell(T.WOOD), 0, TILE, 1, '#BE9160');
    px(c, cell(T.WOOD), 7, TILE, 1, '#8B653F');
    px(c, cell(T.WOOD), 15, TILE, 1, '#8B653F');
    px(c, cell(T.WOOD) + 4, 2, 1, 4, '#8B653F');
    px(c, cell(T.WOOD) + 11, 9, 1, 4, '#8B653F');
    void rng;
  }

  // ---------------------------------------------------------------
  // 소품 베이킹
  // ---------------------------------------------------------------
  function makeCanvas(w, h) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { cv: cv, c: ctx };
  }

  function bakeTree() {
    var m = makeCanvas(40, 44);
    var c = m.c;
    // 줄기
    px(c, 17, 26, 6, 16, '#7A5230');
    px(c, 17, 26, 2, 16, '#8E6238');
    px(c, 15, 40, 10, 2, '#6A4528');
    // 벚꽃 캐노피 (뭉게뭉게)
    var blobs = [
      [12, 10, 16, 14], [4, 14, 14, 12], [22, 13, 14, 13],
      [9, 4, 12, 10], [19, 5, 12, 10], [1, 18, 10, 8], [29, 17, 10, 8],
    ];
    var i;
    for (i = 0; i < blobs.length; i++) px(c, blobs[i][0], blobs[i][1], blobs[i][2], blobs[i][3], '#F5A9C4');
    px(c, 8, 8, 10, 8, '#FBC7DA');
    px(c, 22, 9, 9, 7, '#FBC7DA');
    px(c, 13, 16, 12, 8, '#EE8FB2');
    var sp = [[7, 12], [26, 8], [15, 6], [32, 19], [4, 20], [20, 18]];
    for (i = 0; i < sp.length; i++) px(c, sp[i][0], sp[i][1], 2, 2, '#FFE3EE');
    return m.cv;
  }

  function bakeBench() {
    var m = makeCanvas(26, 14);
    var c = m.c;
    px(c, 1, 0, 24, 3, '#9C6B3E');   // 등받이
    px(c, 1, 5, 24, 4, '#B07C48');   // 좌판
    px(c, 1, 5, 24, 1, '#C austere'.slice(0, 0) || '#C68F55');
    px(c, 2, 9, 3, 5, '#6E4B2A');
    px(c, 21, 9, 3, 5, '#6E4B2A');
    return m.cv;
  }

  function bakeFountain() {
    var m = makeCanvas(48, 48);
    var c = m.c;
    // 바깥 수반
    px(c, 2, 8, 44, 36, '#8A9098');
    px(c, 4, 10, 40, 32, '#AAB0B8');
    px(c, 6, 12, 36, 28, '#4E8FD1');
    // 중앙 기둥
    px(c, 20, 14, 8, 18, '#B8BEC6');
    px(c, 18, 12, 12, 4, '#9AA0A8');
    px(c, 16, 30, 16, 4, '#9AA0A8');
    px(c, 22, 6, 4, 8, '#CDD3DA');
    return m.cv;
  }

  function bakeBoard() {
    var m = makeCanvas(28, 26);
    var c = m.c;
    px(c, 2, 20, 4, 6, '#6E4B2A');
    px(c, 22, 20, 4, 6, '#6E4B2A');
    px(c, 0, 0, 28, 20, '#8E6238');
    px(c, 2, 2, 24, 16, '#C9A36B');
    px(c, 4, 4, 8, 6, '#F6EED8');   // 쪽지들
    px(c, 14, 5, 9, 7, '#FFE9C7');
    px(c, 5, 12, 10, 4, '#D9F2E0');
    px(c, 17, 13, 6, 4, '#FFD3E0');
    return m.cv;
  }

  function bakeShop(wall, awn) {
    var m = makeCanvas(52, 46);
    var c = m.c;
    px(c, 0, 10, 52, 36, wall);                 // 벽
    px(c, 2, 12, 48, 2, '#00000022');
    px(c, 0, 0, 52, 6, '#8B5E3C');              // 지붕
    px(c, 0, 0, 52, 2, '#A5714A');
    // 차양 (줄무늬)
    for (var i = 0; i < 13; i++) px(c, i * 4, 6, 4, 6, i % 2 ? '#FFFFFF' : awn);
    px(c, 0, 12, 52, 1, '#00000033');
    // 문 + 창
    px(c, 20, 26, 12, 20, '#6E4B2A');
    px(c, 22, 28, 8, 16, '#8E6238');
    px(c, 28, 35, 2, 2, '#F2C94C');
    px(c, 6, 24, 10, 10, '#BFE3F2');
    px(c, 36, 24, 10, 10, '#BFE3F2');
    px(c, 6, 28, 10, 1, '#FFFFFF');
    px(c, 36, 28, 10, 1, '#FFFFFF');
    px(c, 5, 23, 12, 1, '#FFFFFF66');
    // 간판
    px(c, 16, 16, 20, 7, '#F6EED8');
    px(c, 17, 17, 18, 5, awn);
    return m.cv;
  }

  function bakeRock() {
    var m = makeCanvas(16, 12);
    var c = m.c;
    px(c, 2, 4, 12, 8, '#8A8578');
    px(c, 4, 2, 8, 4, '#9A9588');
    px(c, 4, 4, 4, 2, '#B0AB9E');
    px(c, 10, 8, 3, 3, '#726E62');
    return m.cv;
  }

  function bakeFence() {
    var m = makeCanvas(16, 14);
    var c = m.c;
    px(c, 1, 2, 3, 12, '#8E6238');
    px(c, 12, 2, 3, 12, '#8E6238');
    px(c, 0, 4, 16, 2, '#A87B4E');
    px(c, 0, 9, 16, 2, '#A87B4E');
    px(c, 1, 2, 3, 1, '#BE9160');
    px(c, 12, 2, 3, 1, '#BE9160');
    return m.cv;
  }

  function bakeBoat() {
    var m = makeCanvas(28, 22);
    var c = m.c;
    // 오리배
    px(c, 2, 12, 24, 8, '#F2C94C');
    px(c, 4, 10, 20, 4, '#FFD94A');
    px(c, 18, 2, 8, 10, '#FFD94A');    // 머리
    px(c, 24, 5, 4, 3, '#F5A623');     // 부리
    px(c, 21, 4, 2, 2, '#33222B');     // 눈
    px(c, 6, 8, 8, 4, '#FFF3B8');      // 좌석
    px(c, 2, 18, 24, 2, '#D9A72E');
    return m.cv;
  }

  function bakeLamp() {
    var m = makeCanvas(10, 30);
    var c = m.c;
    px(c, 4, 6, 2, 24, '#3D4350');
    px(c, 2, 0, 6, 8, '#3D4350');
    px(c, 3, 1, 4, 6, '#FFE9A8');
    return m.cv;
  }

  function bakeSign() {
    var m = makeCanvas(18, 20);
    var c = m.c;
    px(c, 8, 8, 2, 12, '#6E4B2A');
    px(c, 1, 0, 16, 9, '#A87B4E');
    px(c, 2, 1, 14, 7, '#C9A36B');
    px(c, 4, 3, 8, 1, '#6E4B2A');
    px(c, 4, 5, 10, 1, '#6E4B2A');
    return m.cv;
  }

  // ---------------------------------------------------------------
  // 소품 배치
  // ---------------------------------------------------------------
  var props = []; // {img, x, y(px 좌하단 기준), sortY}

  function addProp(img, tx, ty, solidW, solidH) {
    // (tx,ty) = 소품 밑변이 놓일 타일. 이미지 밑변 가운데를 맞춤.
    var x = tx * TILE + TILE / 2 - img.width / 2;
    var y = (ty + 1) * TILE - img.height;
    props.push({ img: img, x: Math.round(x), y: Math.round(y), sortY: (ty + 1) * TILE });
    if (solidW) {
      var sx = tx - Math.floor(solidW / 2) + (solidW % 2 === 0 ? 1 : 0);
      setSolid(sx, ty - solidH + 1, solidW, solidH);
    }
  }

  function placeProps() {
    var tree = bakeTree();
    var bench = bakeBench();
    var fountain = bakeFountain();
    var board = bakeBoard();
    var rock = bakeRock();
    var fence = bakeFence();
    var boat = bakeBoat();
    var lamp = bakeLamp();
    var sign = bakeSign();
    var shopA = bakeShop('#E8B4B8', '#E27E96');
    var shopB = bakeShop('#BFD8B8', '#4CAF6D');
    var shopC = bakeShop('#F2DFB8', '#E0A030');
    var shopD = bakeShop('#BCCDE8', '#5B7FC1');
    var i;

    // 공원: 벚나무 + 벤치
    var trees = [[19, 4], [26, 3], [34, 4], [41, 3], [46, 5], [21, 12], [44, 12], [37, 12]];
    for (i = 0; i < trees.length; i++) addProp(tree, trees[i][0], trees[i][1], 2, 1);
    addProp(bench, 28, 11, 2, 1);
    addProp(bench, 33, 5, 2, 1);

    // 광장: 분수 + 게시판 + 가로등
    addProp(fountain, 31, 23, 3, 3);
    addProp(board, 36, 19, 2, 1);
    addProp(lamp, 25, 18, 1, 1);
    addProp(lamp, 39, 29, 1, 1);

    // 카페 거리: 가게 4곳
    addProp(shopA, 47, 19, 4, 3);
    addProp(shopB, 52, 19, 4, 3);
    addProp(shopC, 57, 19, 4, 3);
    addProp(shopD, 50, 31, 4, 3);
    addProp(lamp, 45, 25, 1, 1);
    addProp(lamp, 60, 25, 1, 1);

    // 호수: 표지판 + 오리배(비충돌, 물 위)
    addProp(sign, 18, 26, 1, 1);
    props.push({ img: boat, x: 6 * TILE, y: 21 * TILE, sortY: 22.4 * TILE, float: true });

    // 온천: 바위 + 울타리
    var rocks = [[25, 38], [32, 39], [33, 43], [25, 43], [39, 39], [33, 40], [39, 43], [24, 41]];
    for (i = 0; i < rocks.length; i++) addProp(rock, rocks[i][0], rocks[i][1], 1, 1);
    for (i = 24; i <= 42; i += 2) addProp(fence, i, 46, 1, 1);
    addProp(sign, 34, 37, 1, 1);
  }

  // ---------------------------------------------------------------
  // 존 판정
  // ---------------------------------------------------------------
  function zoneAt(pxX, pxY) {
    var tx = pxX / TILE, ty = pxY / TILE;
    if (ty >= 34 && tx >= 20 && tx <= 46) return 'hotspring';
    if (tx < 20 && ty >= 14 && ty <= 43) return 'lake';
    if (tx >= 44 && ty >= 14 && ty < 33) return 'cafe';
    if (ty < 14 && tx >= 16 && tx < 48) return 'park';
    if (tx >= 22 && tx <= 42 && ty >= 16 && ty < 32) return 'plaza';
    return null;
  }

  // ---------------------------------------------------------------
  // 충돌
  // ---------------------------------------------------------------
  function isSolidPx(pxX, pxY) {
    if (pxX < 4 || pxY < 4 || pxX >= MAP_W * TILE - 4 || pxY >= MAP_H * TILE - 4) return true;
    var tx = Math.floor(pxX / TILE), ty = Math.floor(pxY / TILE);
    return solid[ty][tx];
  }

  // ---------------------------------------------------------------
  // 그리기
  // ---------------------------------------------------------------
  function drawGround(ctx, camX, camY, viewW, viewH, t) {
    var x0 = Math.max(0, Math.floor(camX / TILE));
    var y0 = Math.max(0, Math.floor(camY / TILE));
    var x1 = Math.min(MAP_W - 1, Math.ceil((camX + viewW) / TILE));
    var y1 = Math.min(MAP_H - 1, Math.ceil((camY + viewH) / TILE));
    var wf = Math.floor(t / 400) % 3;       // 물 프레임
    var hf = Math.floor(t / 500) % 2;       // 온천 프레임
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var id = map[y][x];
        var row = 0;
        if (id === T.WATER) row = wf;
        else if (id === T.HOTWATER) row = hf;
        ctx.drawImage(tileset, id * TILE, row * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
      }
    }
  }

  // 분수 물줄기 등 애니메이션 데코 (월드좌표로 그림)
  function drawGroundDecor(ctx, t) {
    // 분수 물방울
    var fx = 31 * TILE + TILE / 2, fy = 21 * TILE + 26;
    var i;
    ctx.fillStyle = '#CFE7F7';
    for (i = 0; i < 6; i++) {
      var ph = ((t / 90) + i * 37) % 22;
      var dx = Math.round(Math.sin(i * 2.1) * (4 + ph * 0.45));
      ctx.fillRect(Math.round(fx + dx), Math.round(fy - 14 + ph * 0.8), 2, 2);
    }
    // 호수 반짝임 (물 위 흰 점)
    ctx.fillStyle = '#FFFFFF';
    var sparks = [[7, 20], [12, 24], [5, 30], [10, 33], [14, 22], [8, 36]];
    for (i = 0; i < sparks.length; i++) {
      if (Math.floor(t / 300 + i) % 4 === 0)
        ctx.fillRect(sparks[i][0] * TILE + (i * 5) % 12, sparks[i][1] * TILE + (i * 7) % 12, 2, 1);
    }
  }

  window.AV_WORLD = {
    TILE: TILE, W: MAP_W, H: MAP_H,
    PIX_W: MAP_W * TILE, PIX_H: MAP_H * TILE,
    T: T,
    init: function () { genMap(); bakeTiles(); placeProps(); },
    map: map, props: props,
    isSolidPx: isSolidPx,
    zoneAt: zoneAt,
    setSolid: setSolid,
    drawGround: drawGround,
    drawGroundDecor: drawGroundDecor,
    // 파티클 영역
    regions: {
      park: { x0: 16 * TILE, y0: 0, x1: 48 * TILE, y1: 14 * TILE },
      pools: [
        { x0: 26 * TILE, y0: 39 * TILE, x1: 32 * TILE, y1: 43 * TILE },
        { x0: 34 * TILE, y0: 40 * TILE, x1: 39 * TILE, y1: 43 * TILE },
      ],
    },
    playerStart: { x: 32 * TILE + 8, y: 27 * TILE + 8 },
    npcSpots: {
      capybara: { x: 33 * TILE, y: 38.6 * TILE, r: 20 },
      pigeon: { x: 35 * TILE, y: 21 * TILE, r: 34 },
      alpaca: { x: 49 * TILE, y: 21.5 * TILE, r: 26 },
      raccoon: { x: 56 * TILE, y: 26 * TILE, r: 30 },
      goat: { x: 25 * TILE, y: 7 * TILE, r: 34 },
      parrot: { x: 29 * TILE, y: 26 * TILE, r: 30 },
      sloth: { x: 29 * TILE, y: 12.6 * TILE, r: 12 },
      axolotl: { x: 16.5 * TILE, y: 29.5 * TILE, r: 22 },
    },
  };
})();

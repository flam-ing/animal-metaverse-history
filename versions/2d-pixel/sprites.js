// ANIMALVERSE 도트 빌리지 — 종별 픽셀 스프라이트 정의 + 베이킹
// 문자 격자: P=primary S=secondary A=accent D=dark W=흰색 .=투명
// 모든 스프라이트는 오른쪽을 보는 기준. 왼쪽은 좌우 반전으로 베이킹.
(function () {
  'use strict';

  var GRID_W = 16;

  // ---------------------------------------------------------------
  // 스프라이트 정의
  // def: { grid:[...], legRows:n }  → 2프레임(다리 벌림) 자동 생성
  //      { frames:[grid1, grid2] } → 수제 2프레임 (플라밍고 등)
  // 각 행은 16자 미만이면 '.'으로 우측 패딩됨.
  // ---------------------------------------------------------------
  var DEFS = {

    // ===== 마스코트: 플라밍고 (16x26, 수제 2프레임) =====
    flamingo: {
      frames: [
        [
          '.........PPPP...',
          '........PPPPPP..',
          '........PDPPPSS.',
          '........PPPP..SD',
          '.........PPP...D',
          '.........PP.....',
          '........PP......',
          '........PP......',
          '.......PP.......',
          '....PPPPPP......',
          '...PPPPPPPPP....',
          '..PPPPPPPPPPP...',
          '..PAAPPAAPPPP...',
          '..PPAAAAAPPPP...',
          '...PPPPPPPPP....',
          '....SSSSSSS.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......D...D.....',
          '......DA..DA....',
        ],
        [
          '.........PPPP...',
          '........PPPPPP..',
          '........PDPPPSS.',
          '........PPPP..SD',
          '.........PPP...D',
          '.........PP.....',
          '........PP......',
          '........PP......',
          '.......PP.......',
          '....PPPPPP......',
          '...PPPPPPPPP....',
          '..PPPPPPPPPPP...',
          '..PAAPPAAPPPP...',
          '..PPAAAAAPPPP...',
          '...PPPPPPPPP....',
          '....SSSSSSS.....',
          '......D...DD....',
          '......D...DA....',
          '......D.........',
          '......D.........',
          '......D.........',
          '......D.........',
          '......D.........',
          '......D.........',
          '......D.........',
          '......DA........',
        ],
      ],
    },

    // ===== 토끼 (16x18) =====
    rabbit: {
      legRows: 2,
      grid: [
        '....PA...PA.....',
        '....PA...PA.....',
        '....PA...PA.....',
        '....PP...PP.....',
        '...PPPPPPPPP....',
        '..PPPPPPPPPPP...',
        '..PPPPPPPPDPP...',
        '..PPPPPPPPPPPA..',
        '...PPPPPPPPPP...',
        '....PPPPPPPP....',
        '.SSPPPPPPPPP....',
        '.SSPPPPPPPPPP...',
        '..PPPPPPPPPPP...',
        '..PPPPPPPPPP....',
        '...PPPPPPPPP....',
        '...PPPPPPPP.....',
        '...PPP..PPP.....',
        '...SSS..SSS.....',
      ],
    },

    // ===== 여우 (16x15) =====
    fox: {
      legRows: 3,
      grid: [
        '..........D..D..',
        '..........PP.PP.',
        '..........PPPPP.',
        '.........PPPPDP.',
        '.........PPPPPPS',
        '..DD..PPPPPPPSSS',
        '.DPPD.PPPPPPPPS.',
        '.DPPPPPPPPPPPP..',
        '.SPPPPPPPPPPP...',
        '.SSPPPPPPPPP....',
        '..SPPPPPPPPP....',
        '...PPP...PPP....',
        '...PP.....PP....',
        '...DP.....DP....',
      ],
    },

    // ===== 판다 (16x15) =====
    panda: {
      legRows: 3,
      grid: [
        '..AA......AA....',
        '..APPPPPPPPA....',
        '.PPPPPPPPPPPP...',
        '.PPAAPPPPAAPP...',
        '.PPAWPPPPAWPP...',
        '.PPPPPAAPPPPP...',
        '..PPPPPPPPPP....',
        '.AAPPPPPPPPAA...',
        '.AAPPPPPPPPAA...',
        '.AAPPPPPPPPAA...',
        '..PPPPPPPPPP....',
        '..PPPPPPPPPP....',
        '..AAA....AAA....',
        '..AAA....AAA....',
        '..AAA....AAA....',
      ],
    },

    // ===== 치즈 고양이 (16x14) =====
    cat: {
      legRows: 3,
      grid: [
        '..........D..D..',
        '..........PP.PP.',
        '..........PPPPP.',
        '..PPP.....PPPDP.',
        '.PP..P....PPPPP.',
        '.PP...PPPPPPPPS.',
        '..PPPPPAPPAPPSS.',
        '....PPPAPPAPPS..',
        '....PPPPPPPPPP..',
        '....PPPPPPPPP...',
        '....PPPPPPPPP...',
        '....PPP...PPP...',
        '....PP.....PP...',
        '....SP.....SP...',
      ],
    },

    // ===== 시바견 (16x14) =====
    dog: {
      legRows: 3,
      grid: [
        '..........D..D..',
        '..........PP.PP.',
        '...PP.....PPPPP.',
        '..PPPP....PPPDP.',
        '..PPPP....PSSSS.',
        '..PPP..PPPPPSSS.',
        '...P..PPPPPPPPS.',
        '.....PPPPPPPPP..',
        '.....PPPPPPPPP..',
        '.....PSSSSSPPP..',
        '.....PPPPPPPP...',
        '.....PPP..PPP...',
        '.....PP....PP...',
        '.....SP....SP...',
      ],
    },

    // ===== 펭귄 (16x15) =====
    penguin: {
      legRows: 2,
      grid: [
        '.....PPPPPP.....',
        '....PPPPPPPP....',
        '....PWDPPWDP....',
        '....PPPAAPPP....',
        '...PPSSSSSSPP...',
        '..PPPSSSSSSPPP..',
        '..PPPSSSSSSPPP..',
        '..PPPSSSSSSPPP..',
        '..PPPSSSSSSPPP..',
        '..PPPSSSSSSPPP..',
        '...PPSSSSSSPP...',
        '...PPPSSSSPPP...',
        '....PPPPPPPP....',
        '....AA....AA....',
        '...AAA...AAA....',
      ],
    },

    // ===== 부엉이 (16x15) =====
    owl: {
      legRows: 2,
      grid: [
        '..DP.......PD...',
        '..PPP.....PPP...',
        '..PPPPPPPPPPP...',
        '.PPWWPPPPWWPP...',
        '.PPWDPPPPWDPP...',
        '.PPPPPAAPPPPP...',
        '..PPPPPAPPPP....',
        '..PSSSSSSSSP....',
        '..PSASAASASP....',
        '..PSSSSSSSSP....',
        '..PSASAASASP....',
        '..PPSSSSSSPP....',
        '...PPPPPPPP.....',
        '....AA...AA.....',
        '....AA...AA.....',
      ],
    },

    // ===== 사자 (16x15) =====
    lion: {
      legRows: 3,
      grid: [
        '........AAAAA...',
        '.......AAAAAAA..',
        '.......APPPPPA..',
        '.......APPPDPA..',
        '.......APPPPSA..',
        '..D....AAPPSAA..',
        '..DP..PPAAAAA...',
        '...PPPPPPPPPP...',
        '...PPPPPPPPPP...',
        '...PPPPPPPPP....',
        '...PSSSSSPPP....',
        '...PPP...PPP....',
        '...PP.....PP....',
        '...SP.....SP....',
      ],
    },

    // ===== 호랑이 (16x14) =====
    tiger: {
      legRows: 3,
      grid: [
        '..........P..P..',
        '..........PP.PP.',
        '..........PPPPP.',
        '.........PAPPDP.',
        '.........PPPSSS.',
        '..AP..PPPPAPPSS.',
        '..PA.PPPAPPAPPS.',
        '...PPPPAPPAPPP..',
        '...PPPPAPPAPPP..',
        '...PPPPPPPPPP...',
        '...PSSSSSSPPP...',
        '...PPP...PPP....',
        '...PP.....PP....',
        '...SP.....SP....',
      ],
    },

    // ===== 코끼리 (16x15) =====
    elephant: {
      legRows: 3,
      grid: [
        '........PPPPPP..',
        '......SSPPPPPPP.',
        '.....SSASPPDPPP.',
        '.....SASAPPPPPP.',
        '.....SSASPPPPPP.',
        '.....SSSPPPP.PP.',
        '......SPPPPP.PP.',
        '.PPPPPPPPPPP.PP.',
        '.PPPPPPPPPPP.PP.',
        '.PPPPPPPPPP..PA.',
        '.PPPPPPPPPP.....',
        '.PSSSSSSPPP.....',
        '..PPP..PPP......',
        '..PPP..PPP......',
        '..SSP..SSP......',
      ],
    },

    // ===== 기린 (16x26) =====
    giraffe: {
      legRows: 10,
      grid: [
        '..........D.D...',
        '..........PPPP..',
        '..........PDPS..',
        '..........PPPP..',
        '.........PPA....',
        '.........PP.....',
        '.........APP....',
        '........PPA.....',
        '........PP......',
        '........PP......',
        '...PPPPPPP......',
        '.DPPAPPAPPP.....',
        '.DPPPPPAPPP.....',
        '.DPPAPPPAPP.....',
        '..PPPPPPPP......',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...PP....PP.....',
        '...DD....DD.....',
      ],
    },

    // ===== 원숭이 (16x14) =====
    monkey: {
      legRows: 3,
      grid: [
        '....PPPPPPP.....',
        '...PPPPPPPPP....',
        '..PPPSSSSSPPP...',
        '.PPPSDSSSDSPPP..',
        '.PPPSSSSSSSPPP..',
        '...SSSSDDSSS....',
        '....SSSSSSS..P..',
        '..P.PPPPPPP.PP..',
        '..PPPSSSSSPPP...',
        '..P.PSSSSSP.....',
        '....PPPPPPP.....',
        '....PP...PP.....',
        '....PP...PP.....',
        '....SS...SS.....',
      ],
    },

    // ===== 개구리 (16x12) =====
    frog: {
      legRows: 2,
      grid: [
        '..PPP....PPP....',
        '..PWDP..PWDP....',
        '..PPPPPPPPPP....',
        '.PPPPPPPPPPPP...',
        '.PDDDDDDDDDDP...',
        '.PPSSAASSSSPP...',
        '.PPSSSSSSSSPP...',
        'PPPSSSSSSSSPPP..',
        'PPPPSSSSSSPPPP..',
        'PPP..PPPP..PPP..',
        'PP...........PP.',
        'PPP.........PPP.',
      ],
    },

    // ===== 거북이 (16x12) =====
    turtle: {
      legRows: 3,
      grid: [
        '.....AAAAA......',
        '....AAAAAAA.....',
        '...AADAAADAA....',
        '..AAADAAADAAA...',
        '..AAAAAAAAAAA...',
        '..ADAAADAAADA...',
        '..AAAAAAAAAA.PPP',
        '.PSSSSSSSSSSPPDP',
        '..SSSSSSSSSS.PPP',
        '...PP...PP......',
        '...PP...PP......',
        '...SS...SS......',
      ],
    },

    // ===== 곰 (16x15) =====
    bear: {
      legRows: 3,
      grid: [
        '..PPP....PPP....',
        '..PAP....PAP....',
        '..PPPPPPPPPP....',
        '.PPPPPPPPPPPP...',
        '.PPDPPPPPPDPP...',
        '.PPPPSSSSPPPP...',
        '..PPPSDDSPPP....',
        '.PPPPPPPPPPPP...',
        '.PPPPSSSSPPPP...',
        '.PPPPSSSSPPPP...',
        '.PPPPSSSSPPPP...',
        '..PPPPPPPPPP....',
        '..PPP....PPP....',
        '..PPP....PPP....',
        '..SSS....SSS....',
      ],
    },

    // ===== 돼지 (16x13) =====
    pig: {
      legRows: 3,
      grid: [
        '.........PP.PP..',
        '........APP.PPA.',
        '.........PPPPP..',
        '........PPPPDP..',
        '........PPPPPAA.',
        '..P.....PPPPPAD.',
        '.P.PPPPPPPPPPP..',
        '..PPPPPPPPPPPP..',
        '..PPPPPPPPPPP...',
        '..PSSSSSSSPPP...',
        '...PPP...PPP....',
        '...PP.....PP....',
        '...SS.....SS....',
      ],
    },

    // ===== 병아리 (16x10) =====
    chick: {
      legRows: 2,
      grid: [
        '.....PPPP.......',
        '....PPPPPP......',
        '....PPPDPP......',
        '....PPPPPAA.....',
        '...SPPPPPP......',
        '...SSPPPPP......',
        '....PPPPP.......',
        '.....PPPP.......',
        '......A..A......',
        '.....AA..AA.....',
      ],
    },

    // ===== 고슴도치 (16x11) =====
    hedgehog: {
      legRows: 2,
      grid: [
        '....D.D.D.......',
        '...DADADAD......',
        '..DADADADAD.....',
        '.DADADADADAD....',
        '.ADADADADADSS...',
        '.DADADADADASDS..',
        '.ADADADADASSSSD.',
        '..ADADADASSSSS..',
        '...AAAAAASSSS...',
        '....DD..DD.DD...',
        '....DD..DD.DD...',
      ],
    },

    // ===== 수달 (16x13) =====
    otter: {
      legRows: 3,
      grid: [
        '..........PPPP..',
        '.........PPPPPP.',
        '.........PPDPSD.',
        '.........PPSSSS.',
        '....PPPPPPPPPP..',
        '..PPPPPPPPPPPP..',
        'PPPPPPSSSSSPPP..',
        'PPPPPSSSSSSPPP..',
        '.PPPPSSSSSSPP...',
        '....PPPPPPPPP...',
        '.....PP...PP....',
        '.....PP...PP....',
        '.....DD...DD....',
      ],
    },

    // =================== NPC ===================

    // ===== 카피바라 (16x14) =====
    capybara: {
      legRows: 3,
      grid: [
        '........P..P....',
        '........PPPPPP..',
        '........PPPPPP..',
        '........PPDPPP..',
        '........PPPPAA..',
        '.PPPPPPPPPPPPP..',
        '.PPPPPPPPPPPPP..',
        '.PPPPPPPPPPPPP..',
        '.PPSSSSSSSSPPP..',
        '.PPSSSSSSSSPP...',
        '.PPPPPPPPPPPP...',
        '..PP..PP..PP....',
        '..PP..PP..PP....',
        '..DD..DD..DD....',
      ],
    },

    // ===== 비둘기 (16x11) =====
    pigeon: {
      legRows: 2,
      grid: [
        '........PPP.....',
        '.......PPDPA....',
        '.......PAPP.....',
        '....PPPPAPP.....',
        '..PPPSSSPPP.....',
        '.PPPPSSSSPP.....',
        'DPPPPPSSSPP.....',
        'DDPPPPPPPPP.....',
        '..PPPPPPPP......',
        '....AA..AA......',
        '....AA..AA......',
      ],
    },

    // ===== 알파카 (16x20) =====
    alpaca: {
      legRows: 5,
      grid: [
        '........SSS.....',
        '.......PSSSP....',
        '........PPPP....',
        '........PDPA....',
        '........SPPS....',
        '........SPPS....',
        '........SPPS....',
        '........SPPS....',
        '....PPPPSPPSS...',
        '...PPSPPPPSPPP..',
        '..PPPPPPPPPPPP..',
        '..PSPPSPPSPPPP..',
        '..PPPPPPPPPPPP..',
        '...PPPPPPPPPP...',
        '...SPPPPPPPPS...',
        '....PP....PP....',
        '....PP....PP....',
        '....PP....PP....',
        '....PP....PP....',
        '....DD....DD....',
      ],
    },

    // ===== 라쿤 (16x14) =====
    raccoon: {
      legRows: 3,
      grid: [
        '..PP.....PP.....',
        '..PPPPPPPPP.....',
        '.PPPPPPPPPPPP...',
        '.AAWAAPPAAWAA...',
        '.AAAAAPPAAAAA...',
        '..PPPPDPPPPP....',
        '...PPSSSSPP.....',
        '..PPPPPPPPP..AA.',
        '..PSSSSSSSP..SS.',
        '..PSSSSSSSP..AA.',
        '..PPPPPPPPP.ASS.',
        '..PPP...PPP.AA..',
        '..PPP...PPP.....',
        '..AAA...AAA.....',
      ],
    },

    // ===== 염소 (16x14) =====
    goat: {
      legRows: 3,
      grid: [
        '........DD......',
        '.......D..P..P..',
        '.........PPPPP..',
        '.........PPDPP..',
        '.........PPPPP..',
        '..P.......PSP...',
        '..PP.PPPPPPPS...',
        '...PPPPPPPPPS...',
        '...PPPPPPPPP....',
        '...PSSSSSSPP....',
        '...PPPPPPPP.....',
        '...PPP..PPP.....',
        '...PP....PP.....',
        '...DD....DD.....',
      ],
    },

    // ===== 앵무새 (16x13) =====
    parrot: {
      legRows: 2,
      grid: [
        '........AA......',
        '.......APPP.....',
        '.......PPDPAA...',
        '.......PPPPPD...',
        '.....PPPPPPP....',
        '..PPPPSSPPPP....',
        '.DPPPPSSPDPP....',
        'DDPPPPSSPDPP....',
        'DD.PPPSSPPPP....',
        '....PPPPPPP.....',
        '.....PPPPP......',
        '......A..A......',
        '.....AA..AA.....',
      ],
    },

    // ===== 나무늘보 (16x15) =====
    sloth: {
      legRows: 3,
      grid: [
        '...PPPPPPPP.....',
        '..PPPPPPPPPP....',
        '..PSSSSSSSSP....',
        '..PSADSSSDAS....',
        '..PSSSDDSSSP....',
        '..PSSD..DSSP....',
        '..PPPSSSSPPP....',
        '.PPPPPPPPPPPP...',
        '.PP.PSSSSP.PP...',
        '.PP.PSSSSP.PP...',
        '.PP.PSSSSP.PP...',
        '.AA.PPPPPP.AA...',
        '....PP..PP......',
        '....PP..PP......',
        '....AA..AA......',
      ],
    },

    // ===== 우파루파 (16x13) =====
    axolotl: {
      legRows: 3,
      grid: [
        '..A.........A...',
        '.AA.PPPPPPP.AA..',
        '.AAPPPPPPPPPAA..',
        '..APPDPPPDPPA...',
        '..APAPPPPPAPA...',
        '...PPD...DPP....',
        '...PPPDDDPPP....',
        '....PPPPPPP..S..',
        '....PSSSSSP.SS..',
        '....PSSSSSPSS...',
        '....PPPPPPP.....',
        '....PP...PP.....',
        '....AA...AA.....',
      ],
    },
  };

  // ---------------------------------------------------------------
  // 유틸
  // ---------------------------------------------------------------
  function padGrid(grid) {
    var out = [];
    for (var i = 0; i < grid.length; i++) {
      var r = grid[i];
      if (r.length > GRID_W) r = r.slice(0, GRID_W);
      while (r.length < GRID_W) r += '.';
      out.push(r);
    }
    return out;
  }

  // 프레임2 자동 생성: 다리 구간을 좌/우로 1px 벌려 걷기 느낌
  function spreadLegs(grid, legRows) {
    var h = grid.length;
    var w = GRID_W;
    var out = [];
    var y, x;
    for (y = 0; y < h - legRows; y++) out.push(grid[y]);
    var minX = 99, maxX = -1;
    for (y = h - legRows; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (grid[y][x] !== '.') {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    var cx = (minX + maxX) / 2;
    for (y = h - legRows; y < h; y++) {
      var row = new Array(w);
      for (x = 0; x < w; x++) row[x] = '.';
      for (x = 0; x < w; x++) {
        var c = grid[y][x];
        if (c === '.') continue;
        var nx = x + (x > cx ? 1 : -1);
        if (nx >= 0 && nx < w) row[nx] = c;
      }
      out.push(row.join(''));
    }
    return out;
  }

  function colorFor(ch, palette) {
    switch (ch) {
      case 'P': return palette.primary;
      case 'S': return palette.secondary;
      case 'A': return palette.accent;
      case 'D': return palette.dark;
      case 'W': return '#FFFFFF';
      default: return null;
    }
  }

  function drawGridTo(ctx, grid, palette, ox, oy, flip) {
    var h = grid.length;
    for (var y = 0; y < h; y++) {
      var row = grid[y];
      for (var x = 0; x < GRID_W; x++) {
        var c = row[x];
        if (c === '.') continue;
        var col = colorFor(c, palette);
        if (!col) continue;
        ctx.fillStyle = col;
        var dx = flip ? (GRID_W - 1 - x) : x;
        ctx.fillRect(ox + dx, oy + y, 1, 1);
      }
    }
  }

  // ---------------------------------------------------------------
  // 베이킹: 종 id + palette → offscreen 캔버스 스트립
  // 셀 순서: [프레임0·우, 프레임1·우, 프레임0·좌, 프레임1·좌]
  // ---------------------------------------------------------------
  var bakeCache = {};

  function bake(id, palette) {
    var key = id;
    if (bakeCache[key]) return bakeCache[key];
    var def = DEFS[id];
    if (!def) def = DEFS.chick; // 미정의 종은 병아리로 폴백
    var f0, f1;
    if (def.frames) {
      f0 = padGrid(def.frames[0]);
      f1 = padGrid(def.frames[1]);
    } else {
      f0 = padGrid(def.grid);
      f1 = spreadLegs(f0, def.legRows || 3);
    }
    var h = f0.length;
    var canvas = document.createElement('canvas');
    canvas.width = GRID_W * 4;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawGridTo(ctx, f0, palette, 0, 0, false);
    drawGridTo(ctx, f1, palette, GRID_W, 0, false);
    drawGridTo(ctx, f0, palette, GRID_W * 2, 0, true);
    drawGridTo(ctx, f1, palette, GRID_W * 3, 0, true);
    var baked = { canvas: canvas, w: GRID_W, h: h };
    bakeCache[key] = baked;
    return baked;
  }

  // 스프라이트 그리기: (x,y)=발밑 중심 월드좌표, dir: 1=우 / -1=좌
  function draw(ctx, baked, frame, dir, x, y) {
    var cell = (dir < 0 ? 2 : 0) + (frame ? 1 : 0);
    var bob = frame ? -1 : 0;
    ctx.drawImage(
      baked.canvas,
      cell * baked.w, 0, baked.w, baked.h,
      Math.round(x - baked.w / 2), Math.round(y - baked.h + bob),
      baked.w, baked.h
    );
  }

  window.AV_SPRITES = { DEFS: DEFS, bake: bake, draw: draw, GRID_W: GRID_W };
})();

// ANIMALVERSE 2d-iso — 아이소메트릭 수학/공용 유틸
(function () {
  'use strict';
  var HW = 32, HH = 16; // 2:1 다이아몬드 타일 반폭/반높이

  // 타일(월드) 좌표 → 화면 좌표 (타일 윗면 중심)
  function toScreen(x, y) {
    return { x: (x - y) * HW, y: (x + y) * HH };
  }
  // 화면 이동 방향(ux,uy) → 월드 방향
  function screenDirToWorld(ux, uy) {
    var dx = (ux / HW + uy / HH) / 2;
    var dy = (uy / HH - ux / HW) / 2;
    var len = Math.hypot(dx, dy);
    if (len < 1e-6) return { x: 0, y: 0 };
    return { x: dx / len, y: dy / len };
  }
  // 결정적 해시 (0..1)
  function hash(x, y) {
    var h = (x * 374761393 + y * 668265263) | 0;
    h = ((h ^ (h >>> 13)) * 1274126177) | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  // 헥스 컬러 밝기 조절 f: -1..1
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
    else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  // 다이아몬드(타일 윗면) 패스
  function diamondPath(ctx, sx, sy, hw, hh) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - hh);
    ctx.lineTo(sx + hw, sy);
    ctx.lineTo(sx, sy + hh);
    ctx.lineTo(sx - hw, sy);
    ctx.closePath();
  }

  window.ISO = {
    HW: HW, HH: HH,
    toScreen: toScreen,
    screenDirToWorld: screenDirToWorld,
    hash: hash, shade: shade, lerp: lerp, clamp: clamp,
    diamondPath: diamondPath,
  };
})();

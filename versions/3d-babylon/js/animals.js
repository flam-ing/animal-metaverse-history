// ANIMALVERSE Babylon.js — 프로시저럴 동물 빌더
// characters/npcs 의 build{} 힌트 + palette 로 28종을 조립. 광택 토이 룩.
// window.BJSAnimals.build(scene, def) → rig {root, legs[], head, wings[], tail, kind, labelY}
//                    animate(rig, t, speed)
(function () {
  'use strict';
  var B = window.BABYLON;

  var matCache = {};
  function mat(scene, hex, opts) {
    opts = opts || {};
    var key = hex + (opts.glow ? 'g' : '') + (opts.gloss || '');
    if (matCache[key]) return matCache[key];
    var m = new B.StandardMaterial('m' + key, scene);
    var c = B.Color3.FromHexString(hex);
    m.diffuseColor = c;
    // 광택 토이 느낌: 좁고 또렷한 하이라이트 (넓은 번들거림 대신)
    m.specularColor = new B.Color3(0.32, 0.32, 0.38);
    m.specularPower = opts.gloss === 'high' ? 128 : 64;
    if (opts.glow) m.emissiveColor = c.scale(0.55);
    else m.emissiveColor = c.scale(0.04);
    matCache[key] = m;
    return m;
  }

  var idc = 0;
  function n() { return 'a' + (idc++); }

  function sphere(scene, d, hex, opts) {
    var m = B.MeshBuilder.CreateSphere(n(), { diameter: d, segments: 8 }, scene);
    m.material = mat(scene, hex, opts); return m;
  }
  function ellip(scene, dx, dy, dz, hex, opts) {
    var m = B.MeshBuilder.CreateSphere(n(), { diameter: 1, segments: 8 }, scene);
    m.scaling.set(dx, dy, dz); m.material = mat(scene, hex, opts); return m;
  }
  function box(scene, w, h, d, hex, opts) {
    var m = B.MeshBuilder.CreateBox(n(), { width: w, height: h, depth: d }, scene);
    m.material = mat(scene, hex, opts); return m;
  }
  function cyl(scene, dt, db, h, hex, opts) {
    var m = B.MeshBuilder.CreateCylinder(n(), { diameterTop: dt, diameterBottom: db, height: h, tessellation: 10 }, scene);
    m.material = mat(scene, hex, opts); return m;
  }
  function cone(scene, d, h, hex, opts) {
    var m = B.MeshBuilder.CreateCylinder(n(), { diameterTop: 0, diameterBottom: d, height: h, tessellation: 8 }, scene);
    m.material = mat(scene, hex, opts); return m;
  }

  function parent(child, p) { child.parent = p; return child; }

  function eyes(scene, head, x, y, z, r) {
    r = r || 0.05;
    [-1, 1].forEach(function (s) {
      var e = sphere(scene, r * 2, '#2b2226'); e.parent = head; e.position.set(x * s, y, z);
      var g = sphere(scene, r * 0.9, '#ffffff'); g.parent = head; g.position.set(x * s + r * 0.4, y + r * 0.4, z + r * 0.7);
    });
  }

  function legNode(scene, root, x, z, len, dia, hex, hipY) {
    var pivot = new B.TransformNode(n(), scene); pivot.parent = root; pivot.position.set(x, hipY, z);
    var leg = cyl(scene, dia, dia * 0.9, len, hex); leg.parent = pivot; leg.position.y = -len / 2;
    var foot = ellip(scene, dia * 1.15, dia * 0.6, dia * 1.5, hex); foot.parent = pivot; foot.position.set(0, -len, dia * 0.25);
    pivot.userData = { phase: 0 };
    return pivot;
  }

  // ── 메인 빌더 ───────────────────────────────
  function build(scene, def) {
    var p = def.palette, b = def.build || {};
    var root = new B.TransformNode('root_' + def.id, scene);
    var rig = { root: root, legs: [], wings: [], head: null, body: null, tail: null, kind: b.kind || 'mammal', labelY: 1.5 };

    if (def.id === 'flamingo') return buildFlamingo(scene, def, rig);

    var chunky = b.body === 'chunky';
    var tiny = b.body && b.body.indexOf('tiny') >= 0 || b.body === 'small-round';
    var egg = b.body === 'egg';
    var longBody = b.body === 'long' || b.body === 'chunky-rect';

    // 몸통
    var bw = chunky ? 0.95 : tiny ? 0.5 : (def.id === 'frog' ? 0.85 : 0.75);
    var bh = egg ? 0.95 : chunky ? 0.8 : (def.id === 'frog' ? 0.48 : 0.62);
    var bd = longBody ? 1.25 : chunky ? 1.0 : (def.id === 'frog' ? 0.95 : 0.85);
    var bodyY = (b.legs === 'long' || b.neck === 'long') ? 1.0 : (b.legs === 'short' || b.legs === 'stubby') ? 0.42 : 0.62;
    var body = ellip(scene, bw, bh, bd, p.primary, { gloss: 'high' }); body.parent = root; body.position.set(0, bodyY, 0);
    rig.body = body;
    // 배 (밝은 부분)
    var belly = ellip(scene, bw * 0.72, bh * 0.72, bd * 0.7, p.secondary); belly.parent = body; belly.position.set(0, -bh * 0.18, bd * 0.12);

    // 다리
    var kind = b.kind;
    var legLen = b.legs === 'long' ? 0.95 : b.legs === 'short' ? 0.34 : b.legs === 'stubby' ? 0.24 : 0.5;
    var legDia = chunky ? 0.24 : 0.16;
    var hipY = bodyY - bh * 0.35;
    if (kind === 'bird') {
      rig.legs.push(legNode(scene, root, 0.14, 0, hipY, legDia * 0.8, p.accent || p.dark, hipY));
      rig.legs.push(legNode(scene, root, -0.14, 0, hipY, legDia * 0.8, p.accent || p.dark, hipY));
    } else {
      var lx = bw * 0.27, lz = bd * 0.3;
      [[lx, lz], [-lx, lz], [lx, -lz], [-lx, -lz]].forEach(function (o) {
        rig.legs.push(legNode(scene, root, o[0], o[1], hipY, legDia, p.primary, hipY));
      });
    }
    // 다리 위상차
    rig.legs.forEach(function (l, i) { l.userData.phase = (i % 2) * Math.PI + (i >= 2 ? 0.5 : 0); });

    // 목 (긴 목)
    var headParent = body, headLocalY = bh * 0.5 + 0.12, headZ = bd * 0.42;
    if (b.neck === 'long') {
      var neckLen = def.id === 'giraffe' ? 1.5 : 1.1;
      var neck = cyl(scene, 0.26, 0.34, neckLen, p.primary); neck.parent = body;
      neck.position.set(0, bh * 0.3 + neckLen / 2, bd * 0.28);
      neck.rotation.x = -0.2;
      if (b.spots) for (var s = 0; s < 5; s++) { var sp = sphere(scene, 0.14, p.accent); sp.parent = neck; sp.position.set((s % 2 ? 0.12 : -0.12), -neckLen / 2 + s * neckLen / 5, 0.16); }
      headParent = neck; headLocalY = neckLen / 2 + 0.1; headZ = 0.1;
      rig.labelY = bodyY + neckLen + 0.6;
    }

    // 머리
    var headD = tiny ? 0.5 : chunky ? 0.72 : 0.58;
    var head = new B.TransformNode(n(), scene); head.parent = headParent; head.position.set(0, headLocalY, headZ);
    var headMesh = sphere(scene, headD, p.primary, { gloss: 'high' }); headMesh.parent = head;
    rig.head = head;
    var bigEyes = b.eyes === 'big';
    if (def.id === 'frog') {
      // 개구리 왕눈이 (머리 위로 툭 튀어나옴)
      [-1, 1].forEach(function (s) {
        var eyeSock = sphere(scene, 0.22, p.primary);
        eyeSock.parent = head;
        eyeSock.position.set(headD * 0.3 * s, headD * 0.36, headD * 0.16);

        var e = sphere(scene, 0.12, '#2b2226');
        e.parent = eyeSock;
        e.position.set(0, 0, 0.1);

        var g = sphere(scene, 0.05, '#ffffff');
        g.parent = eyeSock;
        g.position.set(0.03, 0.03, 0.14);
      });
    } else {
      eyes(scene, head, headD * 0.26, headD * 0.08, headD * 0.42, bigEyes ? 0.1 : 0.055);
    }

    // 주둥이 / 부리 / 코
    if (kind === 'bird') {
      var beakLen = b.beak === 'tiny' ? 0.12 : 0.22;
      var beak = cone(scene, 0.16, beakLen, b.beak === 'tiny' ? p.dark : (p.accent || '#f5a623')); beak.parent = head;
      beak.rotation.x = Math.PI / 2; beak.position.set(0, -0.02, headD * 0.5 + beakLen * 0.3);
    } else if (b.trunk) {
      var trunk = cyl(scene, 0.12, 0.22, 0.7, p.primary); trunk.parent = head; trunk.rotation.x = 0.9; trunk.position.set(0, -0.1, headD * 0.5);
    } else if (def.id === 'pig') {
      // 돼지코 디테일 (콧구멍 2개 포함)
      var pigSnout = ellip(scene, 0.32, 0.24, 0.22, p.accent);
      pigSnout.parent = head;
      pigSnout.position.set(0, -0.08, headD * 0.48);
      [-1, 1].forEach(function(s) {
        var nostril = sphere(scene, 0.05, p.dark);
        nostril.parent = pigSnout;
        nostril.position.set(0.08 * s, 0, 0.11);
      });
    } else if (def.id === 'frog') {
      // 개구리는 코가 없고 대신 넓은 턱밑 울음주머니 묘사
      var throat = ellip(scene, 0.42, 0.28, 0.38, p.accent || '#F2E863');
      throat.parent = head;
      throat.position.set(0, -headD * 0.25, headD * 0.25);
    } else if (def.id === 'monkey') {
      // 원숭이 얼굴 묘사 (살구색 얼굴 패치 + 코 + 둥근 입가)
      var faceMaskL = ellip(scene, 0.24, 0.24, 0.08, p.secondary);
      faceMaskL.parent = head;
      faceMaskL.position.set(-0.1, -0.02, headD * 0.4);
      var faceMaskR = ellip(scene, 0.24, 0.24, 0.08, p.secondary);
      faceMaskR.parent = head;
      faceMaskR.position.set(0.1, -0.02, headD * 0.4);
      var faceMaskTop = ellip(scene, 0.2, 0.16, 0.08, p.secondary);
      faceMaskTop.parent = head;
      faceMaskTop.position.set(0, 0.12, headD * 0.38);

      var monkeyNose = sphere(scene, 0.06, p.dark);
      monkeyNose.parent = head;
      monkeyNose.position.set(0, -0.04, headD * 0.52);
      var mouthPart = ellip(scene, 0.16, 0.1, 0.08, p.secondary);
      mouthPart.parent = head;
      mouthPart.position.set(0, -0.12, headD * 0.48);
    } else if (def.id === 'otter') {
      // 수달의 넓고 납작한 주둥이 + 수염
      var otterMuzz = ellip(scene, 0.32, 0.18, 0.26, p.secondary);
      otterMuzz.parent = head;
      otterMuzz.position.set(0, -0.08, headD * 0.45);
      var otterNose = sphere(scene, 0.08, p.dark);
      otterNose.parent = head;
      otterNose.position.set(0, -0.02, headD * 0.58);

      // 수달 작은 귀
      [-1, 1].forEach(function(s) {
        var ear = sphere(scene, 0.14, p.primary);
        ear.parent = head;
        ear.position.set(headD * 0.4 * s, -headD * 0.1, 0);
      });

      // 수달 수염
      [-1, 1].forEach(function (s) {
        for (var wIdx = 0; wIdx < 3; wIdx++) {
          var whisker = cyl(scene, 0.012, 0.012, 0.35, '#ffffff');
          whisker.parent = head;
          whisker.rotation.z = Math.PI / 2 + (wIdx - 1) * 0.22;
          whisker.rotation.y = -s * 0.2;
          whisker.position.set(headD * 0.32 * s, -0.12, headD * 0.44);
        }
      });
    } else if (b.snout) {
      var snout = ellip(scene, 0.34, 0.24, 0.24, p.accent); snout.parent = head; snout.position.set(0, -0.08, headD * 0.5);
    } else {
      // 일반 동물 (시바견, 고양이, 호랑이 등)
      // 시바견인 경우 얼굴 백색 패치 추가
      if (def.id === 'dog') {
        [-1, 1].forEach(function (s) {
          var cheekPatch = ellip(scene, 0.26, 0.2, 0.08, p.secondary);
          cheekPatch.parent = head;
          cheekPatch.position.set(0.12 * s, -0.06, headD * 0.42);
        });
        [-1, 1].forEach(function (s) {
          var eyebrow = sphere(scene, 0.065, p.secondary);
          eyebrow.parent = head;
          eyebrow.position.set(0.12 * s, 0.18, headD * 0.4);
        });
      }
      // 고양이인 경우 수염 추가
      if (def.id === 'cat') {
        [-1, 1].forEach(function (s) {
          for (var wIdx = 0; wIdx < 3; wIdx++) {
            var whisker = cyl(scene, 0.01, 0.01, 0.38, '#ffffff');
            whisker.parent = head;
            whisker.rotation.z = Math.PI / 2 + (wIdx - 1) * 0.25;
            whisker.rotation.y = -s * 0.15;
            whisker.position.set(headD * 0.34 * s, -0.1, headD * 0.44);
          }
        });
      }
      // 고슴도치인 경우 뾰족 주둥이 장착
      if (def.id === 'hedgehog') {
        var noseCone = cone(scene, 0.26, 0.42, p.secondary);
        noseCone.parent = head;
        noseCone.rotation.x = Math.PI / 2;
        noseCone.position.set(0, -0.06, headD * 0.48);
        var tip = sphere(scene, 0.08, p.dark);
        tip.parent = noseCone;
        tip.position.y = 0.21;
      } else {
        var muzzle = ellip(scene, 0.3, 0.26, 0.34, p.secondary); muzzle.parent = head; muzzle.position.set(0, -0.1, headD * 0.42);
        var nose = sphere(scene, 0.1, p.dark); nose.parent = head; nose.position.set(0, -0.04, headD * 0.6);
      }
    }

    // 귀
    addEars(scene, head, headD, b, p, def.id);

    // 갈기 (사자)
    if (b.mane) { var mane = sphere(scene, headD * 1.7, p.accent); mane.parent = head; mane.position.z = -0.05; mane.scaling.z = 0.6; }

    // 뿔 (염소/기린)
    if (b.horns) {
      [-1, 1].forEach(function (s) {
        var horn = cone(scene, 0.1, b.horns === 'ossicone' ? 0.28 : 0.22, b.horns === 'ossicone' ? p.dark : '#e8e0d0');
        horn.parent = head; horn.position.set(0.14 * s, headD * 0.5, 0);
      });
    }
    // 수염 (염소)
    if (b.beard) { var beard = cone(scene, 0.14, 0.24, p.secondary); beard.parent = head; beard.rotation.x = Math.PI; beard.position.set(0, -headD * 0.5, headD * 0.3); }

    // 볏 (앵무새)
    if (b.crest) { var crest = cone(scene, 0.16, 0.3, p.accent); crest.parent = head; crest.position.set(0, headD * 0.55, 0); }

    // 날개
    if (b.wings) {
      [-1, 1].forEach(function (s) {
        var w = ellip(scene, 0.16, 0.4, 0.6, b.wings === 'flipper' ? p.primary : (p.secondary));
        w.parent = body; w.position.set((bw * 0.5) * s, 0, -0.05); w.userData = { side: s, z0: 0 };
        rig.wings.push(w);
      });
    }

    // 꼬리
    if (b.tail) {
      var tail = new B.TransformNode(n(), scene); tail.parent = body; tail.position.set(0, 0.05, -bd * 0.5);
      var tm;
      if (b.tail === 'thick') {
        // 수달의 넓고 납작하며 처지는 꼬리
        tm = ellip(scene, 0.24, 0.14, 0.8, p.primary);
        tm.parent = tail;
        tm.position.set(0, -0.1, -0.3);
        tm.rotation.x = 0.25;
      } else if (b.tail === 'spiral') {
        // 돼지 꼬인 꼬리
        tm = new B.TransformNode(n(), scene); tm.parent = tail;
        var lastSeg = tm;
        for (var sIdx = 0; sIdx < 5; sIdx++) {
          var seg = cyl(scene, 0.05, 0.05, 0.12, p.accent || p.primary);
          seg.parent = lastSeg;
          seg.position.set(0.04 * Math.sin(sIdx * 1.5), -0.06, -0.05);
          seg.rotation.x = 0.4; seg.rotation.y = 0.5 * Math.sin(sIdx);
          lastSeg = seg;
        }
      } else if (b.tail === 'curl-up') {
        // 시바견 말린 꼬리
        tm = new B.TransformNode(n(), scene); tm.parent = tail;
        var lastSeg = tm;
        for (var sIdx = 0; sIdx < 6; sIdx++) {
          var seg = ellip(scene, 0.18 - sIdx * 0.02, 0.18 - sIdx * 0.02, 0.22, p.primary);
          seg.parent = lastSeg;
          seg.position.set(0, 0.08, -0.08);
          seg.rotation.x = 0.55;
          lastSeg = seg;
        }
      } else if (b.tail === 'curl') {
        // 고양이 말린 꼬리
        tm = new B.TransformNode(n(), scene); tm.parent = tail;
        var lastSeg = tm;
        for (var sIdx = 0; sIdx < 6; sIdx++) {
          var seg = cyl(scene, 0.08 - sIdx * 0.008, 0.09 - sIdx * 0.008, 0.22, p.primary);
          seg.parent = lastSeg;
          seg.position.set(0, 0.08 * Math.sin(sIdx * 0.5), -0.16);
          seg.rotation.x = -0.22 - sIdx * 0.05;
          lastSeg = seg;
        }
      } else if (b.tail === 'striped') {
        // 호랑이 마디 꼬리
        tm = new B.TransformNode(n(), scene); tm.parent = tail;
        var lastSeg = tm;
        for (var sIdx = 0; sIdx < 6; sIdx++) {
          var segColor = (sIdx % 2 === 0) ? p.primary : p.accent;
          var seg = ellip(scene, 0.14, 0.14, 0.24, segColor);
          seg.parent = lastSeg;
          seg.position.set(0, 0, -0.16);
          lastSeg = seg;
        }
      } else if (b.tail === 'bushy' || b.tail === 'ringed') {
        // 크고 위로 살짝 들린 풍성한 꼬리 + 밝은 끝
        tail.rotation.x = 0.5;
        tm = ellip(scene, 0.34, 0.34, 0.72, b.tail === 'ringed' ? p.dark : p.primary);
        tm.parent = tail; tm.position.z = -0.3;
        var tip = sphere(scene, 0.2, p.secondary); tip.parent = tail; tip.position.z = -0.6;
      } else if (b.tail === 'puff') {
        tm = sphere(scene, 0.28, p.secondary);
        tm.parent = tail; tm.position.z = -0.15;
      } else if (b.tail === 'tuft') {
        tm = sphere(scene, 0.18, p.dark);
        tm.parent = tail; tm.position.z = -0.15;
      } else {
        tm = ellip(scene, 0.12, 0.12, 0.35, p.primary);
        tm.parent = tail; tm.position.z = -0.15;
      }
      rig.tail = tail;
    }

    // 등껍질 (거북)
    if (b.shell) { var shell = ellip(scene, 1.0, 0.7, 1.1, p.accent, { gloss: 'high' }); shell.parent = body; shell.position.y = bh * 0.35; }

    // 가시 (고슴도치)
    if (b.spikes) {
      var kCount = 60;
      for (var k = 0; k < kCount; k++) {
        var theta = Math.acos(Math.random() * 0.85); // 등쪽 위주 (0 ~ 90도 근방)
        var phi = Math.random() * Math.PI * 2;
        var sx = Math.sin(theta) * Math.cos(phi) * bw * 0.48;
        var sy = Math.cos(theta) * bh * 0.48 + 0.1;
        var sz = Math.sin(theta) * Math.sin(phi) * bd * 0.48 - 0.12;

        var spk = cone(scene, 0.07, 0.26, p.accent || p.dark);
        spk.parent = body;
        spk.position.set(sx, sy, sz);

        spk.lookAt(body.position.add(new B.Vector3(sx * 2, sy * 2, sz * 2)));
        spk.rotation.x += Math.PI / 2;
      }
    }

    // 줄무늬 (호랑이)
    if (b.stripes) {
      for (var t2 = 0; t2 < 5; t2++) {
        var stripe = box(scene, 0.06, bh * 0.9, 0.14, p.accent || p.dark); stripe.parent = body;
        stripe.position.set(-bw * 0.4 + t2 * bw * 0.2, 0, bd * 0.2);
      }
      if (def.id === 'tiger') {
        // 이마 줄무늬 (세로 3줄)
        [-1, 0, 1].forEach(function(s) {
          var line = box(scene, 0.03, 0.16, 0.04, p.accent);
          line.parent = head;
          line.position.set(s * 0.08, headD * 0.36, headD * 0.3);
          line.rotation.x = -0.4;
        });
        // 뺨 줄무늬 (가로 2줄씩 양옆)
        [-1, 1].forEach(function(s) {
          [0.02, -0.06].forEach(function(yOff) {
            var line = box(scene, 0.18, 0.03, 0.04, p.accent);
            line.parent = head;
            line.position.set(headD * 0.38 * s, yOff, headD * 0.28);
            line.rotation.y = -s * 0.4;
          });
        });
      }
    }

    // 눈 패치 (판다/라쿤)
    if (b.eyePatch) [-1, 1].forEach(function (s) {
      var patch = ellip(scene, 0.2, 0.24, 0.1, p.accent === p.dark ? '#2e2b2c' : p.dark); patch.parent = head;
      patch.position.set(headD * 0.26 * s, headD * 0.08, headD * 0.46);
    });

    return rig;
  }

  function addEars(scene, head, headD, b, p, defId) {
    var ear = b.ears;
    if (!ear) return;
    [-1, 1].forEach(function (s) {
      var e;
      if (ear === 'long-up') { e = ellip(scene, 0.16, 0.5, 0.12, p.primary); e.parent = head; e.position.set(0.16 * s, headD * 0.55, 0); }
      else if (ear === 'pointy' || ear === 'triangle') {
        e = cone(scene, 0.22, 0.3, p.primary);
        e.parent = head;
        e.position.set(0.2 * s, headD * 0.5, 0);
        if (defId === 'cat') {
          var inner = cone(scene, 0.13, 0.18, '#FFAEB9');
          inner.parent = e;
          inner.position.set(0, 0.02, 0.05);
          inner.rotation.x = 0.15;
        }
      }
      else if (ear === 'floppy') { e = ellip(scene, 0.16, 0.34, 0.1, p.primary); e.parent = head; e.position.set(0.28 * s, headD * 0.2, 0); e.rotation.z = s * 0.6; }
      else if (ear === 'huge') { e = ellip(scene, 0.5, 0.6, 0.1, p.primary); e.parent = head; e.position.set(0.42 * s, 0.1, -0.05); }
      else if (ear === 'tufts') { e = cone(scene, 0.14, 0.24, p.primary); e.parent = head; e.position.set(0.22 * s, headD * 0.5, 0); }
      else if (ear === 'round-side') {
        e = sphere(scene, 0.24, p.primary);
        e.parent = head;
        e.position.set(0.38 * s, 0, 0);
        var inner = sphere(scene, 0.16, p.secondary);
        inner.parent = e;
        inner.position.set(0.05 * s, 0, 0.04);
      }
      else { e = sphere(scene, 0.24, ear === 'round-dark' ? p.dark : p.primary); e.parent = head; e.position.set(0.26 * s, headD * 0.42, 0); }
    });
  }

  // ── 마스코트 플라밍고 (전용) ─────────────────
  function buildFlamingo(scene, def, rig) {
    var p = def.palette, root = rig.root;
    // 긴 다리 2개 (무릎 관절 + 물갈퀴)
    [0.13, -0.13].forEach(function (x, i) {
      var pivot = new B.TransformNode(n(), scene); pivot.parent = root; pivot.position.set(x, 1.25, 0);
      var leg = cyl(scene, 0.07, 0.08, 1.25, p.accent); leg.parent = pivot; leg.position.y = -0.62;
      var knee = sphere(scene, 0.11, p.accent); knee.parent = pivot; knee.position.y = -0.6;
      var foot = ellip(scene, 0.24, 0.06, 0.3, p.accent); foot.parent = pivot; foot.position.set(0, -1.24, 0.1);
      pivot.userData = { phase: i * Math.PI };
      rig.legs.push(pivot);
    });
    // 몸통 (통통, 광택)
    var body = ellip(scene, 0.78, 0.68, 1.0, p.primary, { gloss: 'high' }); body.parent = root; body.position.set(0, 1.32, 0);
    rig.body = body;
    var belly = ellip(scene, 0.6, 0.52, 0.76, p.secondary); belly.parent = body; belly.position.set(0, -0.1, 0.08);
    // 꼬리 깃 — 위로 뻗친 깃털 부채 3장
    var tail = new B.TransformNode(n(), scene); tail.parent = body; tail.position.set(0, 0.12, -0.46);
    [-0.35, 0, 0.35].forEach(function (ry, i) {
      var tf = ellip(scene, 0.1, 0.34, 0.16, i === 1 ? p.accent : p.secondary);
      tf.parent = tail; tf.rotation.x = -0.85; tf.rotation.y = ry;
      tf.position.set(ry * 0.3, 0.12, -0.12);
    });
    rig.tail = tail;
    // 날개 — 몸에 붙는 물방울 모양, 살짝 접힌 각도
    [-1, 1].forEach(function (s) {
      var w = ellip(scene, 0.12, 0.4, 0.66, p.accent); w.parent = body;
      w.position.set(0.34 * s, 0.1, -0.08);
      w.rotation.z = s * 0.38; w.rotation.x = 0.22;
      w.userData = { side: s, z0: s * 0.38 }; rig.wings.push(w);
    });
    // S자 목 — 캣멀롬 스플라인 튜브 (매끈하게 이어진 곡선)
    var ctrl = [
      new B.Vector3(0, 0.05, 0.30), new B.Vector3(0, 0.55, 0.58),
      new B.Vector3(0, 1.05, 0.55), new B.Vector3(0, 1.38, 0.32),
      new B.Vector3(0, 1.52, 0.40),
    ];
    var path = B.Curve3.CreateCatmullRomSpline(ctrl, 8, false).getPoints();
    var neckMesh = B.MeshBuilder.CreateTube(n(), {
      path: path, tessellation: 10, cap: B.Mesh.CAP_ALL,
      radiusFunction: function (i, dist) { return 0.115 - (i / path.length) * 0.035; },
    }, scene);
    neckMesh.material = mat(scene, p.primary, { gloss: 'high' });
    neckMesh.parent = body;
    // 머리 (목 끝점에)
    var head = new B.TransformNode(n(), scene); head.parent = body; head.position.set(0, 1.52, 0.40);
    var hm = sphere(scene, 0.36, p.primary, { gloss: 'high' }); hm.parent = head;
    rig.head = head;
    eyes(scene, head, 0.11, 0.05, 0.15, 0.045);
    // 볼터치
    [-1, 1].forEach(function (s) {
      var cheek = ellip(scene, 0.09, 0.06, 0.05, p.accent); cheek.parent = head;
      cheek.position.set(0.13 * s, -0.05, 0.12);
    });
    // 굽은 부리 (분홍 밑동 + 아래로 꺾인 검은 끝)
    var beak1 = ellip(scene, 0.14, 0.13, 0.24, p.secondary); beak1.parent = head; beak1.position.set(0, -0.02, 0.24);
    var beak2 = cone(scene, 0.11, 0.22, '#33222b'); beak2.parent = head;
    beak2.rotation.x = Math.PI - 0.35; beak2.position.set(0, -0.14, 0.33);
    rig.labelY = 3.1;
    rig.kind = 'flamingo';
    return rig;
  }

  // ── 애니메이션 ───────────────────────────────
  function animate(rig, t, speed) {
    var s = Math.min(Math.max(speed, 0), 1);
    var w = t * 10;
    rig.legs.forEach(function (l) {
      var rot = Math.sin(w + (l.userData.phase || 0)) * 0.6 * s;
      if (rig.kind === 'flamingo' && s < 0.05) {
        // 한 다리 뒤로 접어 들기
        l.userData.lift = (l.userData.lift || 0) + (((l.userData.phase || 0) > 0 ? 1 : 0) - (l.userData.lift || 0)) * 0.05;
        rot += l.userData.lift * 0.95;
      }
      l.rotation.x = rot;
    });
    rig.wings.forEach(function (wg) {
      wg.rotation.z = (wg.userData.z0 || 0) + wg.userData.side * (Math.sin(w * 1.1) * 0.35 * s + Math.sin(t * 2.3) * 0.05);
    });
    if (rig.body) {
      if (rig.bodyY0 == null) rig.bodyY0 = rig.body.position.y;
      rig.body.position.y = rig.bodyY0 + Math.abs(Math.sin(w)) * 0.04 * s;
    }
    if (rig.tail) rig.tail.rotation.y = Math.sin(t * 3) * 0.2;
    if (rig.head) rig.head.rotation.z = Math.sin(t * 2) * 0.04;
  }

  window.BJSAnimals = { build: build, animate: animate, mat: mat };
})();

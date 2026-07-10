// ANIMALVERSE 미연시 RPG "두근두근 아일랜드" — 엔진
// 화면 전환 · 세이브 · 대화(VN) 재생 · 선택지 · 호감도 를 담당한다.
(function () {
  'use strict';

  var SAVE_KEY = 'ds_save_v1';

  // ── 상태 ──────────────────────────────────────────────
  var state = null; // { day, slotIdx, stats:{chm,int,sta}, love:{id:n}, evSeen:{id:[b,b,b]}, name }

  // 씬(대화) 재생 상태
  var scene = { castDef: null, castId: null, queue: [], idx: 0, onDone: null };
  var sceneActive = false;
  var choiceActive = false;

  var dom = {};
  var imgCache = {}; // key `${id}_${mood}` → Image | null | 'loading'

  // ── 유틸 ──────────────────────────────────────────────
  function T(s) { return String(s).replace(/\{name\}/g, state ? state.name : '나그네'); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp100(n) { return Math.max(0, Math.min(100, n)); }
  function getCast(id) { return DS_DATA.cast.find(function (c) { return c.id === id; }); }
  function getPlace(id) { return DS_DATA.places.find(function (p) { return p.id === id; }); }
  function statInfo(id) { return DS_DATA.stats.find(function (s) { return s.id === id; }); }
  function heartsHtml(love) {
    var filled = Math.max(0, Math.min(5, Math.floor((love || 0) / 20)));
    var s = '<span class="hearts">';
    for (var i = 0; i < 5; i++) s += i < filled ? '♥' : '<span class="ht-empty">♡</span>';
    return s + '</span>';
  }
  function formatDelta(n) { return (n >= 0 ? '+' : '') + n + (n >= 0 ? ' ♥' : ' 💔'); }

  // ── 세이브 ────────────────────────────────────────────
  function freshState(name) {
    var love = {}, evSeen = {};
    DS_DATA.cast.forEach(function (c) { love[c.id] = 0; evSeen[c.id] = [false, false, false]; });
    return { day: 1, slotIdx: 0, stats: { chm: 1, int: 1, sta: 1 }, love: love, evSeen: evSeen, name: name || '나그네' };
  }
  function validSave(s) {
    if (!s || typeof s.day !== 'number' || !s.stats || !s.love || !s.evSeen || typeof s.name !== 'string') return false;
    return DS_DATA.cast.every(function (c) { return Array.isArray(s.evSeen[c.id]) && s.evSeen[c.id].length === 3; });
  }
  function loadState() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return validSave(parsed) ? parsed : null;
    } catch (e) { return null; }
  }
  function saveState() {
    if (!state) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 실패해도 게임은 계속 */ }
  }
  function clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* noop */ }
  }
  function hasSave() { return !!loadState(); }

  // ── 초상화 (PNG 우선, 없으면 캔버스 드로잉) ───────────
  function drawImgToCanvas(canvas, img) {
    canvas.width = DSPortraits.W; canvas.height = DSPortraits.H;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
  function setPortrait(canvas, castDef, mood) {
    mood = mood || 'normal';
    var key = castDef.id + '_' + mood;
    canvas._currentKey = key;
    var cached = imgCache[key];
    if (cached && cached !== 'loading') { drawImgToCanvas(canvas, cached); return; }
    if (cached === null) { DSPortraits.draw(canvas, castDef, mood); return; }
    if (cached === undefined) {
      imgCache[key] = 'loading';
      var img = new Image();
      img.onload = function () {
        imgCache[key] = img;
        if (canvas._currentKey === key) drawImgToCanvas(canvas, img);
      };
      img.onerror = function () {
        imgCache[key] = null;
        if (canvas._currentKey === key) DSPortraits.draw(canvas, castDef, mood);
      };
      img.src = 'img/' + key + '.png';
    }
    // 로딩 중이거나 방금 요청 보낸 경우, 우선 프로시저럴 초상화로 보여준다.
    DSPortraits.draw(canvas, castDef, mood);
  }

  // ── 화면 전환 ─────────────────────────────────────────
  function showScreen(id) {
    Array.prototype.forEach.call(document.querySelectorAll('.screen'), function (sec) { sec.classList.remove('active'); });
    document.getElementById(id).classList.add('active');
    dom.hud.hidden = (id === 'scr-title' || id === 'scr-name');
  }
  function updateHud() {
    if (!state) return;
    var slot = DS_DATA.slots[state.slotIdx] || '';
    dom.hudDay.textContent = '📅 D' + state.day + ' · ' + slot;
    dom.hudStats.innerHTML = DS_DATA.stats.map(function (s) {
      return '<span class="stat-chip">' + s.icon + s.ko + ' ' + (state.stats[s.id] || 0) + '</span>';
    }).join('');
  }

  // ── 모달 (단련 결과 / 인물 선택) ──────────────────────
  function openModal(innerHtml) {
    dom.modalLayer.innerHTML = '<div class="modal-backdrop"><div class="modal-box">' + innerHtml + '</div></div>';
    dom.modalLayer.hidden = false;
    dom.modalLayer.querySelector('.modal-backdrop').addEventListener('click', function (e) { if (e.target === this) closeModal(); });
    dom.modalLayer.querySelector('.modal-box').addEventListener('click', function (e) { e.stopPropagation(); });
  }
  function closeModal() { dom.modalLayer.hidden = true; dom.modalLayer.innerHTML = ''; }

  // ── 타이틀 ────────────────────────────────────────────
  function renderTitle() {
    state = null;
    showScreen('scr-title');
    dom.titleName.textContent = DS_DATA.title;
    dom.titleSub.textContent = DS_DATA.subtitle;
    dom.btnContinue.style.display = hasSave() ? '' : 'none';
    dom.castPreview.innerHTML = '';
    DS_DATA.cast.forEach(function (c) {
      var box = document.createElement('div'); box.className = 'cp-item';
      var cv = document.createElement('canvas'); cv.className = 'cp-canvas';
      DSPortraits.draw(cv, c, 'normal');
      var mark = c.gender === 'F' ? '♀' : '♂';
      var info = document.createElement('div'); info.className = 'cp-info';
      info.innerHTML = '<b>' + c.name + '</b> <span class="gmark ' + (c.gender === 'F' ? 'g-f' : 'g-m') + '">' + mark + '</span>' +
        '<span class="cp-tag">' + c.tagline + '</span>';
      box.appendChild(cv); box.appendChild(info);
      dom.castPreview.appendChild(box);
    });
  }
  function confirmName() {
    var val = dom.nameInput.value.trim().slice(0, 8);
    if (!val) val = '나그네';
    state = freshState(val);
    saveState();
    renderMap();
  }

  // ── 맵 ────────────────────────────────────────────────
  function presentCastAt(placeId) {
    var slot = DS_DATA.slots[state.slotIdx];
    return DS_DATA.cast.filter(function (c) { return c.schedule[slot] === placeId; });
  }
  function renderMap() {
    showScreen('scr-map');
    updateHud();
    var slot = DS_DATA.slots[state.slotIdx];
    dom.mapHeader.textContent = 'D' + state.day + ' ' + slot + ' — 어디로 갈까?';
    dom.mapCards.innerHTML = '';
    DS_DATA.places.forEach(function (place) {
      var present = presentCastAt(place.id);
      var card = document.createElement('div');
      card.className = 'place-card';
      card.style.setProperty('--theme', place.theme);
      var chips = present.map(function (c) {
        return '<div class="cast-chip"><span class="cc-name">' + c.name + '</span>' + heartsHtml(state.love[c.id]) + '</div>';
      }).join('') || '<div class="cast-chip empty">지금은 아무도 없어요</div>';
      card.innerHTML =
        '<h3>' + place.ko + '</h3>' +
        '<p class="place-desc">' + place.desc + '</p>' +
        '<div class="cast-chips">' + chips + '</div>' +
        '<button class="btn-train" type="button">🏋️ 단련</button>';
      card.addEventListener('click', function () { onCardClick(place.id); });
      card.querySelector('.btn-train').addEventListener('click', function (ev) { ev.stopPropagation(); trainAt(place.id); });
      dom.mapCards.appendChild(card);
    });
  }
  function onCardClick(placeId) {
    var present = presentCastAt(placeId);
    if (present.length === 1) openScene(present[0].id);
    else if (present.length >= 2) showChooser(present);
    else trainAt(placeId);
  }
  function showChooser(list) {
    var html = '<h3>누구에게 갈까요?</h3><div class="chooser-list">' +
      list.map(function (c) { return '<button class="chooser-btn" data-id="' + c.id + '">' + c.name + ' <span class="tag-sp">' + c.species + '</span></button>'; }).join('') +
      '</div><button id="btnChooserCancel" class="btn-ghost" type="button">취소</button>';
    openModal(html);
    Array.prototype.forEach.call(dom.modalLayer.querySelectorAll('.chooser-btn'), function (btn) {
      btn.addEventListener('click', function () { var id = btn.getAttribute('data-id'); closeModal(); openScene(id); });
    });
    document.getElementById('btnChooserCancel').addEventListener('click', closeModal);
  }

  // ── 단련 ──────────────────────────────────────────────
  function trainAt(placeId) {
    var place = getPlace(placeId);
    state.stats[place.train.stat] = (state.stats[place.train.stat] || 0) + 1;
    saveState();
    var st = statInfo(place.train.stat);
    var html = '<h3>' + place.train.label + '</h3>' +
      '<p>' + T(place.train.line) + '</p>' +
      '<div class="toast-inline">' + st.icon + st.ko + ' +1</div><br>' +
      '<button id="btnTrainOk" class="btn-primary" type="button">확인</button>';
    openModal(html);
    document.getElementById('btnTrainOk').addEventListener('click', function () { closeModal(); advanceSlot(); });
  }

  // ── VN 씬 재생 (방문 대화 / 엔딩 고백·솔로 내레이션 공용) ─
  function openScene(castId) {
    var cast = getCast(castId);
    var slot = DS_DATA.slots[state.slotIdx];
    var place = getPlace(cast.schedule[slot]);
    var queue = [];
    queue.push({ mood: 'normal', text: T(pick(cast.greet)) });

    var seenArr = state.evSeen[castId];
    var evIdx = seenArr.indexOf(false);
    var ev = (evIdx !== -1 && cast.events[evIdx].min <= (state.love[castId] || 0)) ? cast.events[evIdx] : null;

    if (ev) {
      ev.scenes.forEach(function (s) { queue.push({ mood: s.mood, text: T(s.t) }); });
      queue.push({ choice: true, q: T(ev.choice.q), opts: ev.choice.opts, evIdx: evIdx });
    } else {
      var chat = pick(cast.chats);
      chat.t.forEach(function (t, i) {
        var step = { mood: 'normal', text: T(t) };
        if (i === 0) step.applyLove = chat.love;
        queue.push(step);
      });
    }
    queue.push({ mood: 'normal', text: '…' });

    startScene(cast, queue, place ? place.theme : '#e8b8d0', advanceSlot);
  }
  function startScene(castDef, queueLines, theme, onDone) {
    scene.castDef = castDef;
    scene.castId = castDef ? castDef.id : null;
    scene.queue = queueLines;
    scene.idx = 0;
    scene.onDone = onDone;
    choiceActive = false;
    sceneActive = true;
    showScreen('scr-scene');
    updateHud();
    dom.vnBg.style.background = 'linear-gradient(180deg, #fff7fb 0%, ' + theme + '55 45%, ' + theme + ' 100%)';
    renderSceneStep();
  }
  function renderSceneStep() {
    var step = scene.queue[scene.idx];
    if (!step) { endScene(); return; }
    if (step.choice) { showChoice(step); return; }

    dom.vnDialogue.hidden = false;
    hideChoice();
    if (scene.castDef) {
      dom.vnPortrait.hidden = false;
      setPortrait(dom.vnPortrait, scene.castDef, step.mood || 'normal');
      dom.vnNameplate.hidden = false;
      dom.vnNameplate.textContent = scene.castDef.name + ' · ' + scene.castDef.species;
    } else {
      dom.vnPortrait.hidden = true;
      dom.vnNameplate.hidden = true;
    }
    dom.vnText.textContent = step.text;

    if (step.applyLove !== undefined && !step._loveApplied) {
      step._loveApplied = true;
      applyLove(scene.castId, step.applyLove);
      showToast(formatDelta(step.applyLove));
      saveState();
    }
  }
  function advanceScene() {
    if (choiceActive) return;
    scene.idx++;
    renderSceneStep();
  }
  function endScene() {
    sceneActive = false;
    var cb = scene.onDone;
    scene.onDone = null;
    if (cb) cb();
  }
  function applyLove(castId, delta) {
    if (!castId) return;
    state.love[castId] = clamp100((state.love[castId] || 0) + delta);
  }
  function showToast(text) {
    var el = document.createElement('div');
    el.className = 'vn-toast';
    el.textContent = text;
    dom.vnToastLayer.appendChild(el);
    setTimeout(function () { el.remove(); }, 1500);
  }

  // ── 선택지 ────────────────────────────────────────────
  function isLocked(opt) { return !!(opt.need && (state.stats[opt.need.stat] || 0) < opt.need.v); }
  function showChoice(step) {
    choiceActive = true;
    dom.vnDialogue.hidden = true;
    var row = step.opts.map(function (opt) {
      var locked = isLocked(opt);
      var label = T(opt.label);
      if (locked) {
        var si = statInfo(opt.need.stat);
        label += '<span class="lock">🔒 ' + si.ko + ' ' + opt.need.v + ' 필요</span>';
      }
      return '<button class="choice-btn"' + (locked ? ' disabled' : '') + '>' + label + '</button>';
    }).join('');
    dom.vnChoices.innerHTML = '<div class="choice-q">' + step.q + '</div><div class="choice-row">' + row + '</div>';
    dom.vnChoices.hidden = false;
    var enabledOpts = step.opts.filter(function (o) { return !isLocked(o); });
    Array.prototype.forEach.call(dom.vnChoices.querySelectorAll('.choice-btn:not([disabled])'), function (btn, idx) {
      btn.addEventListener('click', function () { pickChoice(step, enabledOpts[idx]); });
    });
  }
  function hideChoice() { dom.vnChoices.hidden = true; dom.vnChoices.innerHTML = ''; }
  function pickChoice(step, opt) {
    if (!choiceActive) return;
    applyLove(scene.castId, opt.love);
    showToast(formatDelta(opt.love));
    state.evSeen[scene.castId][step.evIdx] = true;
    saveState();
    choiceActive = false;
    hideChoice();
    dom.vnDialogue.hidden = false;
    var replyLines = opt.reply.map(function (t) { return { mood: opt.mood, text: T(t) }; });
    var args = [scene.idx + 1, 0].concat(replyLines);
    Array.prototype.splice.apply(scene.queue, args);
    advanceScene();
  }

  // ── 슬롯 진행 / 하루 요약 ─────────────────────────────
  function advanceSlot() {
    state.slotIdx++;
    saveState();
    if (state.slotIdx > 2) renderDayEnd(); else renderMap();
  }
  function renderDayEnd() {
    showScreen('scr-dayend');
    updateHud();
    dom.deHeader.textContent = 'D' + state.day + ' 요약';
    dom.deStats.innerHTML = DS_DATA.stats.map(function (s) {
      return '<div class="de-stat">' + s.icon + ' ' + s.ko + ' <b>' + (state.stats[s.id] || 0) + '</b></div>';
    }).join('');
    var ranked = DS_DATA.cast.slice().sort(function (a, b) { return (state.love[b.id] || 0) - (state.love[a.id] || 0); }).slice(0, 3);
    dom.deLoves.innerHTML = ranked.map(function (c) {
      return '<div class="de-love"><span>' + c.name + '</span>' + heartsHtml(state.love[c.id]) + '</div>';
    }).join('');
    var top = state.love[ranked[0].id] || 0;
    dom.deComment.textContent =
      top >= 80 ? '심상치 않은 분위기가 감돈다…' :
      top >= 50 ? '마음이 조금씩 가까워지고 있다.' :
      top >= 20 ? '아직은 서먹하지만 나쁘지 않은 하루였다.' :
      '오늘은 다들 무슨 생각을 하며 지냈을까?';
  }
  function nextDay() {
    state.day++; state.slotIdx = 0; saveState();
    if (state.day > DS_DATA.days) showEnding(); else renderMap();
  }

  // ── 엔딩 ──────────────────────────────────────────────
  function showEnding() {
    var winner = null, max = -1;
    DS_DATA.cast.forEach(function (c) {
      var v = state.love[c.id] || 0;
      if (v > max) { max = v; winner = c; }
    });
    if (winner && max >= 60) {
      var lines = winner.confess.map(function (t, i) { return { mood: i % 2 === 0 ? 'shy' : 'happy', text: T(t) }; });
      startScene(winner, lines, '#e8a8c8', function () { showEndingCard(winner, max); });
    } else {
      var soloLines = DS_DATA.endings.solo.map(function (t) { return { mood: 'normal', text: T(t) }; });
      startScene(null, soloLines, '#c0b0ec', function () { showEndingCard(null, max); });
    }
  }
  function showEndingCard(winner, love) {
    showScreen('scr-ending');
    updateHud();
    var html;
    if (winner) {
      html = '<h2>「' + winner.name + ' 엔딩」</h2>' + heartsHtml(love) +
        '<p>호감도 ' + love + ' · 이제부터 진짜 이야기가 시작된다.</p>' +
        '<button id="btnRestart" class="btn-primary" type="button">처음으로</button>';
    } else {
      html = '<h2>솔로 엔딩</h2>' +
        '<p>' + DS_DATA.endings.soloHint + '</p>' +
        '<button id="btnRestart" class="btn-primary" type="button">처음으로</button>';
    }
    dom.endCard.innerHTML = html;
    document.getElementById('btnRestart').addEventListener('click', function () { clearSave(); renderTitle(); });
  }

  // ── 초기화 / 이벤트 연결 ──────────────────────────────
  function cacheDom() {
    dom.hud = document.getElementById('hud');
    dom.hudDay = document.getElementById('hudDay');
    dom.hudStats = document.getElementById('hudStats');
    dom.titleName = document.getElementById('titleName');
    dom.titleSub = document.getElementById('titleSub');
    dom.btnContinue = document.getElementById('btnContinue');
    dom.castPreview = document.getElementById('castPreview');
    dom.nameInput = document.getElementById('nameInput');
    dom.mapHeader = document.getElementById('mapHeader');
    dom.mapCards = document.getElementById('mapCards');
    dom.vnBg = document.getElementById('vnBg');
    dom.vnPortrait = document.getElementById('vnPortrait');
    dom.vnNameplate = document.getElementById('vnNameplate');
    dom.vnDialogue = document.getElementById('vnDialogue');
    dom.vnText = document.getElementById('vnText');
    dom.vnChoices = document.getElementById('vnChoices');
    dom.vnToastLayer = document.getElementById('vnToastLayer');
    dom.deHeader = document.getElementById('deHeader');
    dom.deStats = document.getElementById('deStats');
    dom.deLoves = document.getElementById('deLoves');
    dom.deComment = document.getElementById('deComment');
    dom.endCard = document.getElementById('endCard');
    dom.modalLayer = document.getElementById('modalLayer');
  }
  function wireStaticEvents() {
    document.getElementById('btnStart').addEventListener('click', function () {
      clearSave();
      dom.nameInput.value = '나그네';
      showScreen('scr-name');
    });
    dom.btnContinue.addEventListener('click', function () {
      var saved = loadState();
      if (!saved) return;
      state = saved;
      if (state.day > DS_DATA.days) showEnding(); else renderMap();
    });
    document.getElementById('btnNameOk').addEventListener('click', confirmName);
    dom.nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') confirmName(); });
    document.getElementById('hudHome').addEventListener('click', renderTitle);
    document.getElementById('btnNextDay').addEventListener('click', nextDay);
    dom.vnDialogue.addEventListener('click', function () { if (sceneActive && !choiceActive) advanceScene(); });
    document.addEventListener('keydown', function (e) {
      if (!sceneActive || choiceActive) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        advanceScene();
      }
    });
  }

  cacheDom();
  wireStaticEvents();
  renderTitle();
})();

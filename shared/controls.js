// One input lifecycle for all three 3D renderers. Physical key codes also work
// while a Korean keyboard layout is active; held keys never survive focus loss.
(function () {
  'use strict';
  window.AVInput = {
    create: function (onInteract) {
      var keys = {}, keyboard = new Map(), pointers = new Map(), enabled = false;
      var codes = { KeyW:'w', KeyA:'a', KeyS:'s', KeyD:'d', KeyE:'e', ArrowUp:'w', ArrowLeft:'a', ArrowDown:'s', ArrowRight:'d' };
      var controls = document.createElement('div');
      controls.id = 'touch-controls';
      controls.setAttribute('aria-label', '이동과 대화');
      controls.innerHTML = '<div class="av-dpad"><button type="button" data-key="w" aria-label="앞으로 이동">↑</button><button type="button" data-key="a" aria-label="왼쪽으로 이동">←</button><button type="button" data-key="s" aria-label="뒤로 이동">↓</button><button type="button" data-key="d" aria-label="오른쪽으로 이동">→</button></div><button type="button" class="av-talk" aria-label="대화 또는 다음 대사">대화 / 다음</button>';
      document.body.appendChild(controls);
      function sync() {
        ['w','a','s','d'].forEach(function (key) {
          keys[key] = enabled && (Array.from(keyboard.values()).includes(key) || Array.from(pointers.values()).includes(key));
        });
      }
      function clear() { keyboard.clear(); pointers.clear(); sync(); }
      function keyFor(e) { return codes[e.code] || ({w:'w',a:'a',s:'s',d:'d',e:'e'})[e.key.toLowerCase()]; }
      window.addEventListener('keydown', function (e) {
        var key = keyFor(e);
        if (!enabled || !key || e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
        e.preventDefault();
        if (key === 'e') { if (!e.repeat) onInteract(); }
        else { keyboard.set(e.code || e.key, key); sync(); }
      });
      window.addEventListener('keyup', function (e) { keyboard.delete(e.code || e.key); sync(); });
      window.addEventListener('blur', clear);
      document.addEventListener('visibilitychange', function () { if (document.hidden) clear(); });
      controls.querySelectorAll('[data-key]').forEach(function (button) {
        button.addEventListener('pointerdown', function (e) {
          if (!enabled) return;
          e.preventDefault();
          pointers.set(e.pointerId, button.dataset.key); sync();
          try { button.setPointerCapture(e.pointerId); } catch (_) {}
        });
        ['pointerup','pointercancel','lostpointercapture'].forEach(function (event) {
          button.addEventListener(event, function (e) { pointers.delete(e.pointerId); sync(); });
        });
      });
      controls.querySelector('.av-talk').addEventListener('click', function () { if (enabled) onInteract(); });
      function setEnabled(value) {
        enabled = !!value;
        controls.hidden = !enabled;
        document.body.dataset.avMode = enabled ? 'world' : 'select';
        clear();
      }
      setEnabled(false);
      return { keys:keys, clear:clear, setEnabled:setEnabled };
    }
  };
})();

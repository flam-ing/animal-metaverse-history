import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = fileURLToPath(new URL('../',import.meta.url));
const server = createServer(async (req,res) => {
  try {
    let name = path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if (!name.startsWith(root)) throw new Error('Invalid path');
    if (name === root.slice(0,-1) || new URL(req.url,'http://localhost').pathname.endsWith('/')) name += '/index.html';
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.jsx':'text/javascript','.css':'text/css'})[path.extname(name)] || 'application/octet-stream');
    res.end(await readFile(name));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL ? {channel:process.env.CHROME_CHANNEL} : {})});
await mkdir(new URL('../test-results/',import.meta.url),{recursive:true});
try {
  for (const version of ['3d','3d-babylon','3d-r3f']) {
    const page = await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true,isMobile:true});
    const errors = []; page.on('pageerror',e => errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/versions/${version}/?debug=1`);
    await page.locator('#enter-btn').waitFor({state:'visible',timeout:60000});
    await page.waitForFunction(() => document.querySelector('#loading').classList.contains('hidden'));
    assert.equal(await page.locator('#char-grid button').count(),20);
    for (const index of [2,10,19,0]) await page.locator('#char-grid button').nth(index).click();
    await page.waitForTimeout(600);
    const accessible = await page.locator('#enter-btn').evaluate(button => {
      const r = button.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && button.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
    });
    assert.equal(accessible,true,'entry button must fit and be tappable');
    await page.screenshot({path:new URL(`../test-results/${version}-mobile-select.png`,import.meta.url).pathname});
    if (version === '3d-babylon') {
      const missing = await page.evaluate(() => { const s = BABYLON.EngineStore.LastCreatedScene; return s.meshes.filter(m => m.material && !s.materials.includes(m.material)).length; });
      assert.equal(missing,0,'selecting animals must preserve cached world materials');
    }
    await page.locator('#enter-btn').click();
    await page.waitForFunction(() => window.__avDebug?.state().player);
    const initial = await page.evaluate(() => window.__avDebug.state().player);
    await page.keyboard.down('d'); await page.waitForTimeout(650); await page.keyboard.up('d');
    const right = await page.evaluate(() => window.__avDebug.state().player);
    const screenRightSign = version === '3d-babylon' ? -1 : 1;
    assert.ok((right.x-initial.x)*screenRightSign > 1,'D moves to screen right');
    assert.ok(Math.abs(right.z-initial.z) < 0.05,'held sideways movement must not orbit');
    await page.keyboard.down('s'); await page.waitForTimeout(400); await page.keyboard.up('s');
    const backward = await page.evaluate(() => window.__avDebug.state().player);
    assert.ok(backward.z > right.z+0.5,'S moves backwards without rotating the input frame');
    assert.ok(Math.abs(backward.x-right.x) < 0.05);
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'ㅈ',code:'KeyW',bubbles:true})));
    await page.waitForTimeout(250);
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    const blurred = await page.evaluate(() => window.__avDebug.state());
    await page.waitForTimeout(250);
    assert.deepEqual((await page.evaluate(() => window.__avDebug.state())).player,blurred.player);
    assert.equal(blurred.keys.w,false);
    assert.ok(blurred.player.z < backward.z,'physical WASD must work with Korean key values');
    const button = page.locator('[data-key="w"]'), box = await button.boundingBox();
    await page.mouse.move(box.x+box.width/2,box.y+box.height/2); await page.mouse.down();
    await page.waitForTimeout(250);
    await button.dispatchEvent('pointercancel',{pointerId:1}); await page.mouse.up();
    const cancelled = await page.evaluate(() => window.__avDebug.state());
    assert.equal(cancelled.keys.w,false);
    assert.ok(cancelled.player.z < blurred.player.z,'direction pad moves the player');
    await page.waitForTimeout(200);
    assert.deepEqual((await page.evaluate(() => window.__avDebug.state())).player,cancelled.player);
    assert.equal(await page.locator('.av-talk').isVisible(),true);
    assert.notEqual(await page.locator('#zone-chip').textContent(),'섬 어딘가');
    if (version === '3d-babylon') {
      const x = await page.locator('.nlabel.player').evaluate(el => parseFloat(el.style.left));
      assert.ok(x > 100 && x < 300,'DPR=2 name label must stay over the player');
    }
    // Walk to a real wandering NPC with the same keys a player uses.
    for (let step=0;step<45 && !(await page.locator('#interact-hint').isVisible());step++) {
      const state = await page.evaluate(() => window.__avDebug.state());
      const target = state.npcs.sort((a,b) => Math.hypot(a.x-state.player.x,a.z-state.player.z)-Math.hypot(b.x-state.player.x,b.z-state.player.z))[0];
      const dx = target.x-state.player.x, dz = target.z-state.player.z;
      const key = Math.abs(dx)>Math.abs(dz) ? (dx*screenRightSign>0 ? 'd':'a') : (dz>0 ? 's':'w');
      await page.keyboard.down(key); await page.waitForTimeout(100); await page.keyboard.up(key);
    }
    assert.equal(await page.locator('#interact-hint').isVisible(),true);
    await page.locator('.av-talk').click();
    await page.locator('#dialogue').waitFor({state:'visible'});
    const firstLine = await page.locator('#dlg-text').textContent();
    await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'e',code:'KeyE',repeat:true,bubbles:true})));
    assert.equal(await page.locator('#dlg-text').textContent(),firstLine,'key repeat must not skip dialogue');
    await page.locator('.av-talk').click();
    await page.waitForFunction(line => document.getElementById('dlg-text').textContent !== line,firstLine);
    assert.notEqual(await page.locator('#dlg-text').textContent(),firstLine);
    await page.locator('.av-talk').click(); await page.locator('.av-talk').click();
    await page.locator('#dialogue').waitFor({state:'hidden'});
    assert.equal(await page.locator('#dialogue').isVisible(),false);
    await page.screenshot({path:new URL(`../test-results/${version}-mobile-world.png`,import.meta.url).pathname});
    await page.setViewportSize({width:1280,height:800});
    await page.waitForTimeout(300);
    await page.screenshot({path:new URL(`../test-results/${version}-desktop.png`,import.meta.url).pathname});
    assert.deepEqual(errors,[],JSON.stringify(errors));
    console.log(`PASS ${version}: 20 selectable animals; mobile entry; straight WASD; Korean layout; blur and pointer cancel; touch NPC dialogue and key-repeat guard; zone HUD; no exceptions`);
    await page.close();
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }

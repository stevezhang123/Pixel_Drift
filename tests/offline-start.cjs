const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

test('index uses only local startup resources and has a current offline asset bundle', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /<script[^>]+https?:\/\//);
  assert.match(html, /vendor\/phaser\.min\.js/);
  assert.match(html, /assets\/offline\.js/);
  assert.match(html, /id="tutorial-button"[^>]*>新手教程</);
  assert.match(html, /<img src="assets\/tutorial\.svg"/);
  assert.match(html, /像素飘流/);
  assert.ok(fs.existsSync(path.join(root, 'assets/tutorial.svg')));
  assert.ok(fs.statSync(path.join(root, 'vendor/phaser.min.js')).size > 1_000_000);

  const context = vm.createContext({window:{}});
  vm.runInContext(fs.readFileSync(path.join(root, 'assets/offline.js'), 'utf8'), context);
  const assets = context.window.GAME_ASSETS;
  const artContext = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(root, 'src/gfx/ArtAssets.js'), 'utf8') + '\nthis.art = ArtAssets;', artContext);
  for (const {url} of artContext.art.images) assert.match(assets[url], /^data:image\/png;base64,/);
  assert.ok(assets['assets/鹦鹉穿风.mp3'].startsWith('data:audio/mpeg;base64,'));
  assert.ok(assets['assets/样板音效/受伤.ogg'].startsWith('data:audio/ogg;base64,'));
  assert.ok(assets['assets/样板音效/dash.wav'].startsWith('data:audio/wav;base64,'));
});

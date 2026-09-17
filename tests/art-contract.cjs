const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'src/gfx/ArtAssets.js'), 'utf8') + '\nthis.art = ArtAssets;', context);
const art = context.art;
assert.equal(art.playerScale, 0.8, 'Player art must be 1.6 times the previous 0.5 scale');
for (const [key, file] of [['tex_emerald', 'emerald.png'], ['tex_life', 'life.png']]) {
  const entry = art.images.find(item => item.key === key);
  assert.equal(entry?.url, `assets/art/${file}`, `${key} must load the supplied pickup texture`);
  const data = fs.readFileSync(path.join(root, entry.url));
  assert.equal(data.readUInt32BE(16), 16, `${file} must remain pixel-perfect at 16 px wide`);
  assert.equal(data.readUInt32BE(20), 16, `${file} must remain pixel-perfect at 16 px tall`);
}
for (const color of ['blue','green','red']) {
  const frames = [0,1].map(frame => art.images.find(item => item.key === `tex_player_${color}_${frame}`));
  assert.ok(frames.every(Boolean), `${color} parrot needs both wing poses`);
  const data = frames.map(frame => fs.readFileSync(path.join(root,frame.url)));
  assert.ok(!data[0].equals(data[1]), `${color} flap must use distinct images`);
}
const ids = ['plain', 'beach', 'forest', 'cave', 'nether', 'basalt', 'end', 'snow', 'blossom', 'wailing'];
const biomeContext = vm.createContext({});
for (const file of ['src/config/constants.js', 'src/config/biomes.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), biomeContext);
}
const biomes = vm.runInContext('BIOMES', biomeContext);
assert.deepEqual(Array.from(biomes, b => b.id), ids, 'Biome cycle must follow the requested order');
assert.deepEqual(Array.from(art.biomeIds), ids, 'Every playable biome must have art');
assert.deepEqual(Array.from(biomes.slice(6), b => b.name), ['末地', '雪林', '花开尖塔', '哭嚎炼狱']);
// Expanded biomes now have their own encounters; their assets and transition contract remain shared.
for (const biome of biomes) assert.ok(biome.obstacleWeights && biome.duration > 0);
// Exercise the existing gameplay transition, including the new last-to-first wrap.
biomeContext.Phaser = {Scene:class {}};
vm.runInContext(fs.readFileSync(path.join(root, 'src/scenes/GameScene.js'), 'utf8'), biomeContext);
const updateBiome = vm.runInContext('GameScene.prototype.updateBiome', biomeContext);
const visited = [], skins = [], titles = [];
const transition = {
  biomeIndex:5, biome:biomes[5], biomeTimer:0, transitioning:false,
  cameras:{main:{fadeOut(){}, fadeIn(){}}},
  time:{delayedCall(_delay, callback){callback();}},
  game:{audioController:{setBiome(){}}},
  bgManager:{applyBiome(biome){visited.push(biome.id);}},
  entities:[{applyBiome(biome){skins.push(biome.id);}}],
  showBiomeTitle(name){titles.push(name);},
};
for(let i=0; i<5; i++) updateBiome.call(transition, transition.biome.duration);
assert.deepEqual(visited, ['end','snow','blossom','wailing','plain']);
assert.deepEqual(skins, visited, 'Live obstacles must receive each biome during transitions');
assert.deepEqual(titles, ['末地','雪林','花开尖塔','哭嚎炼狱','平原']);
context.Phaser = {Scene:class {}};
context.CHARACTERS = {blue:{},green:{},red:{}};
vm.runInContext(fs.readFileSync(path.join(root,'src/scenes/BootScene.js'),'utf8')+'\nthis.boot = new BootScene();',context);
const animations=[];
context.boot.anims={exists:()=>false,create:animation=>animations.push(animation)};
context.boot.createAnimations();
assert.equal(animations.length,3);
for(const animation of animations) {
  assert.equal(animation.frames.length,2, 'Flight must alternate two wing poses');
  assert.equal(animation.repeat,-1, 'Flight must loop');
  for(const frame of animation.frames) assert.ok(art.images.some(image=>image.key===frame.key));
}
for (const id of ids) {
  for (const kind of ['background', 'wall', 'wallcap', 'ground', 'vine', 'island']) {
    const key = art.biomeKey(kind, { id });
    const entry = art.images.find(item => item.key === key);
    assert.ok(entry, `${id} missing ${kind}`);
    const data = fs.readFileSync(path.join(root, entry.url));
    const width = data.readUInt32BE(16), height = data.readUInt32BE(20);
    if (kind === 'vine') assert.ok(height >= width * 8, `${id} fragile art must be slender`);
    if (kind === 'wall') assert.ok(width >= 64 && height >= 64, `${id} wall lacks revised detail resolution`);
  }
}
let bytes = 0;
const files = new Set();
for (const {key, url} of art.images) {
  const data = fs.readFileSync(path.join(root, url));
  assert.equal(data.subarray(1, 4).toString(), 'PNG', `${key} must be PNG`);
  assert.ok(data.readUInt32BE(16) <= 1024 && data.readUInt32BE(20) <= 1024, `${key} too large`);
  if (!files.has(url)) bytes += data.length;
  files.add(url);
}
assert.ok(bytes < 2 * 1024 * 1024, `Runtime PNG total is ${bytes} bytes`);
assert.equal(new Set(art.images.map(x => x.key)).size, art.images.length, 'Duplicate keys');
assert.equal(art.ghastFrame(0.5, 0), 'tex_ghast_charge');
assert.equal(art.ghastFrame(1.0, 0.12), 'tex_ghast_fire');
assert.equal(art.ghastFrame(1.0, 0), 'tex_ghast');
console.log(`PASS: ten biome mappings, ${art.images.length} texture keys, ${files.size} PNG files, ${(bytes/1024).toFixed(1)} KiB, ghast visual states`);

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function load(context, file, name) {
  vm.runInContext(fs.readFileSync(path.join(root,file),'utf8')+`\nthis.result = ${name};`, context);
  return context.result;
}
function audioFixture(saved='{}', webAudio=true) {
  const elements=[];
  class Audio {
    constructor(src) { this.src=src; this.paused=true; this.currentTime=0; this.plays=0; elements.push(this); }
    play() { this.paused=false; this.plays++; return Promise.resolve(); }
    pause() { this.paused=true; }
  }
  const param=()=>({value:0,scheduled:[],cancelScheduledValues(){},
    setValueAtTime(value){this.value=value;},setTargetAtTime(value,time,tau){this.scheduled.push({value,time,tau});}});
  class AudioContext {
    constructor(){this.currentTime=2;this.state='running';this.destination={};}
    createMediaElementSource(){return {connect(node){return node;}};}
    createBiquadFilter(){return {Q:param(),gain:param(),frequency:param(),connect(node){return node;}};}
    createGain(){return {gain:param(),connect(node){return node;}};}
    resume(){return Promise.resolve();} close(){}
  }
  let stored=saved;
  const handlers={};
  const document={hidden:false,addEventListener(k,fn){handlers[k]=fn;},removeEventListener(){}};
  const context=vm.createContext({Audio,window:{AudioContext:webAudio?AudioContext:undefined,
    addEventListener(){},removeEventListener(){}},document,
    localStorage:{getItem(){return stored;},setItem(k,v){stored=v;}}});
  const Controller=load(context,'src/systems/AudioController.js','AudioController');
  return {Controller,audio:new Controller(),elements,document,handlers,stored:()=>JSON.parse(stored)};
}

test('Music waits for a gesture, loops one track, and keeps its position across biome mixes', async()=>{
  const {audio,Controller}=audioFixture();
  assert.equal(audio.music.plays,0);
  audio.unlock(); await Promise.resolve();
  assert.equal(audio.music.loop,true);
  assert.match(audio.music.src,/鹦鹉穿风.mp3$/);
  audio.music.currentTime=27;
  for (const id of Object.keys(Controller.profiles)) audio.setBiome(id);
  assert.equal(audio.music.currentTime,27);
  assert.equal(audio.music.plays,1);
  assert.equal(audio.lowpass.frequency.scheduled.length,6);
  assert.equal(audio.lowpass.frequency.scheduled.at(-1).value,2600);
  assert.ok(audio.gain.gain.scheduled.every(x=>x.tau>0));
});

test('Music and effects switches are independent, stop active audio, and survive reload', async()=>{
  const {audio,stored}=audioFixture();
  audio.unlock(); await Promise.resolve();
  audio.playSfx('helicopter');
  const sound=audio.pools.helicopter.find(a=>!a.paused);
  assert.ok(sound);
  audio.setEffectsEnabled(false);
  assert.equal(sound.paused,true);
  assert.equal(audio.music.paused,false);
  const plays=sound.plays;
  audio.playSfx('helicopter');
  assert.equal(sound.plays,plays);
  audio.setMusicEnabled(false);
  assert.equal(audio.music.paused,true);
  audio.setEffectsEnabled(true); audio.playSfx('click');
  assert.ok(audio.pools.click.some(a=>!a.paused));
  assert.equal(audio.music.paused,true);
  const restored=audioFixture(JSON.stringify(stored())).audio;
  assert.equal(restored.musicEnabled,false); assert.equal(restored.effectsEnabled,true);
});

test('Independent music and effects volumes are clamped, applied, and persisted', ()=>{
  const {audio,Controller,stored}=audioFixture();
  audio.setMusicVolume(0.42); audio.setEffectsVolume(0.27);
  assert.equal(audio.music.volume, Controller.profiles.plain.volume * 0.42);
  assert.ok(Object.entries(audio.pools).every(([key,pool]) =>
    pool.every(sound => sound.volume === Controller.effects[key][1] * 0.27)));
  assert.deepEqual(stored(), {music:true,effects:true,musicVolume:0.42,effectsVolume:0.27});
  audio.setMusicVolume(-2); audio.setEffectsVolume(5);
  assert.equal(audio.musicVolume,0); assert.equal(audio.effectsVolume,1);
});

test('Hidden tabs stop sounds; returning resumes music only when enabled', async()=>{
  const {audio,document,handlers}=audioFixture();
  audio.unlock(); await Promise.resolve(); await Promise.resolve();
  audio.playSfx('collect'); document.hidden=true; handlers.visibilitychange();
  assert.equal(audio.music.paused,true);
  assert.ok(Object.values(audio.pools).flat().every(a=>a.paused));
  document.hidden=false; handlers.visibilitychange();
  assert.equal(audio.music.paused,false);
  audio.setMusicEnabled(false); handlers.visibilitychange();
  assert.equal(audio.music.paused,true);
});

test('Audio file mapping uses every requested supplied file and supports a no-WebAudio fallback', ()=>{
  const {audio,Controller}=audioFixture('{broken',false);
  for(const [file] of Object.values(Controller.effects)) assert.ok(fs.existsSync(path.join(root,'assets/样板音效',file)));
  assert.equal(Controller.effects.dash[0], 'dash.wav');
  audio.unlock(); audio.setBiome('cave');
  assert.equal(audio.music.volume,Controller.profiles.cave.volume);
  assert.equal(audio.musicEnabled,true);
});

function gameFixture() {
  const sounds=[], shakes=[];
  class EnemyEntity {}
  const context=vm.createContext({Phaser:{Scene:class{}},EnemyEntity,GROUND_Y:476,
    ArtAssets:{playerScale:0.5},TUNING:{dash:{duration:0.3,cooldown:0.5},
      health:{invincibleTime:1,maxStorage:6},score:{destroyPoints:10,emeraldPoints:20}}});
  const Game=load(context,'src/scenes/GameScene.js','GameScene');
  const game=new Game();
  Object.assign(game,{state:'playing',health:3,maxHealth:3,invincible:0,score:0,dashTimer:0.1,
    game:{audioController:{playSfx:key=>sounds.push(key)}},playerSprite:{},charCfg:{dashCdMul:1},
    charKey:'blue',playerX:220,playerY:200,
    add:{image(){return {setScale(){return this;},setTint(){return this;},setAlpha(){return this;},
      setDepth(){return this;},destroy(){}};}},
    tweens:{add(){}},time:{delayedCall(){}},cameras:{main:{shake(...args){shakes.push(args);},flash(){}}},
    updateHealthUI(){},spawnFloatText(){},spawnBurst(){}});
  return {game,sounds,shakes,EnemyEntity};
}

test('A successful dash plays its supplied sound once without camera shake; cooldown suppresses repeats',()=>{
  const {game,sounds,shakes}=gameFixture(); game.dashCooldown=0; game.dashTimer=0;
  game.tryDash(); game.tryDash();
  assert.deepEqual(sounds,['dash']); assert.equal(game.dashTimer,0.3);
  assert.deepEqual(shakes,[]);
});

test('Only a helicopter destroyed during dash gets man.mp3; other enemies and obstacles are silent',()=>{
  const {game,sounds,EnemyEntity}=gameFixture();
  const heli=Object.assign(new EnemyEntity(),{kill(){},kind:'enemy'});
  game.destroyEntity(heli);
  game.destroyEntity({kill(){},kind:'enemy'}); // Bee/phantom share this kind.
  game.destroyEntity({kill(){},kind:'vine'});
  game.dashTimer=0; game.destroyEntity(heli);
  assert.deepEqual(sounds,['helicopter']);
  assert.equal(game.score,40);
});

test('Invincibility suppresses repeated hurt sounds; failure plays once and emerald collection scores',()=>{
  const {game,sounds}=gameFixture();
  game.damagePlayer(); game.damagePlayer();
  assert.deepEqual(sounds,['hurt']); assert.equal(game.health,2);
  game.invincible=0; game.health=1;
  game.damagePlayer(); game.gameOver();
  assert.deepEqual(sounds,['hurt','hurt','fail']);
  const other=gameFixture(); other.game.collectEmerald({kill(){},x:2,y:3});
  assert.deepEqual(other.sounds,['collect']); assert.equal(other.game.score,20);
});

test('Life crystals never raise the health limit above six',()=>{
  const {game}=gameFixture();
  game.health=6; game.maxHealth=6;
  game.collectLifeCrystal({kill(){},x:2,y:3});
  assert.equal(game.health,6); assert.equal(game.maxHealth,6);
});

test('Tutorial is available only from the menu and pauses while its single guide image is open',()=>{
  const nodes={};
  for (const id of ['tutorial-button','tutorial-dialog','tutorial-close']) {
    nodes['#'+id]={hidden:true,open:false,handlers:{},addEventListener(k,fn){this.handlers[k]=fn;},
      focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;}};
  }
  const Tutorial=load(vm.createContext({document:{querySelector:id=>nodes[id]}}),'src/ui/TutorialUI.js','TutorialUI');
  let active=true,paused=false;
  const game={scene:{getScenes:()=>active?[{sys:{settings:{key:'MenuScene'}}}]:[],
    pause(){active=false;paused=true;},isPaused(){return paused;},resume(){active=true;paused=false;}}};
  const ui=new Tutorial(game,{playSfx(){}});
  ui.showButton(true); assert.equal(nodes['#tutorial-button'].hidden,false);
  ui.open(); assert.equal(ui.isOpen,true); assert.equal(paused,true);
  ui.close(); assert.equal(active,true); assert.equal(nodes['#tutorial-button'].focused,true);
  ui.showButton(false); assert.equal(nodes['#tutorial-button'].hidden,true);
});

test('Settings pauses and restores active play while preserving a previously paused scene',()=>{
  const nodes={};
  for (const id of ['settings-button','settings-dialog','music-enabled','effects-enabled','settings-close']) {
    nodes['#'+id]={open:false,addEventListener(){},focus(){},showModal(){this.open=true;},close(){this.open=false;}};
  }
  const context=vm.createContext({document:{querySelector:id=>nodes[id]}});
  const Settings=load(context,'src/ui/SettingsUI.js','SettingsUI');
  let active=true,paused=false,resumes=0;
  const game={scene:{getScenes:()=>active?[{sys:{settings:{key:'GameScene'}}}]:[],isActive:()=>active,isPaused:()=>paused,
    pause(){active=false;paused=true;},resume(){active=true;paused=false;resumes++;}}};
  const ui=new Settings(game,{musicEnabled:true,effectsEnabled:false,playSfx(){}});
  ui.open(); assert.equal(active,false); assert.equal(ui.isOpen,true);
  ui.close(); assert.equal(active,true); assert.equal(resumes,1);
  active=false;paused=true; ui.open();ui.close();
  assert.equal(resumes,1); assert.equal(paused,true);
});

test('Opening settings during character selection suspends the pending game transition',()=>{
  const nodes={};
  for(const id of ['settings-button','settings-dialog','music-enabled','effects-enabled','settings-close']) {
    nodes['#'+id]={open:false,addEventListener(){},focus(){},showModal(){this.open=true;},close(){this.open=false;}};
  }
  const Settings=load(vm.createContext({document:{querySelector:id=>nodes[id]}}),'src/ui/SettingsUI.js','SettingsUI');
  const paused=new Set();
  const game={scene:{isActive:key=>key==='CharacterSelectScene',
    getScenes:()=>[{sys:{settings:{key:'CharacterSelectScene'}}}],
    pause:key=>paused.add(key),isPaused:key=>paused.has(key),resume:key=>paused.delete(key)}};
  const ui=new Settings(game,{musicEnabled:true,effectsEnabled:true,playSfx(){}});
  ui.open(); assert.equal(paused.has('CharacterSelectScene'),true);
  ui.close(); assert.equal(paused.size,0);
});

const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(context, file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context); }

function flightFixture() {
  class Rectangle { constructor(x,y,width,height) { Object.assign(this,{x,y,width,height}); } }
  const context = vm.createContext({Phaser:{Scene:class{},Math:{
    Linear:(a,b,t)=>a+(b-a)*t,Clamp:(n,a,b)=>Math.max(a,Math.min(n,b))},Geom:{Rectangle,
    Intersects:{RectangleToRectangle:(a,b)=>a.x<b.width+b.x && a.x+a.width>b.x
      && a.y<b.y+b.height && a.y+a.height>b.y}}}});
  for (const file of ['src/config/constants.js','src/config/characters.js','src/scenes/GameScene.js']) load(context,file);
  const {GameScene,TUNING,CHARACTERS,PLAYER_X} = vm.runInContext('({GameScene,TUNING,CHARACTERS,PLAYER_X})',context);
  context.ArtAssets = {playerScale:0.8};
  const scene = new GameScene();
  const trails=[], tweens=[];
  const sprite = {texture:{key:'tex_player_blue_0'},setPosition(x,y){this.x=x;this.y=y;},
    setRotation(){},setTint(){},clearTint(){}};
  Object.assign(scene,{state:'playing',paused:false,transitioning:false,elapsed:0,score:0,
    playerX:PLAYER_X,playerY:200,vy:350,windTime:0,charCfg:CHARACTERS.blue,charKey:'blue',
    dashTimer:0,dashCooldown:0,dashLockTimer:0,invincible:0,playerSprite:sprite,
    biome:{capped:false},game:{audioController:{playSfx(){}}},
    add:{image(x,y){trails.push({x,y}); return {setScale(){return this;},setTint(){return this;},
      setAlpha(){return this;},setDepth(){return this;},destroy(){}};}},
    tweens:{add(config){tweens.push(config);}},entities:[],
    bgManager:{update(){}},spawnManager:{update(){}},updateBiome(){},updateUI(){},
    checkReboundFireballs(){},damagePlayer(){throw Error('unexpected damage');},
    destroyEntity(entity){entity.dead=true;}});
  return {scene,TUNING,PLAYER_X,trails,tweens,Rectangle};
}

for (const fps of [30,60,120]) test(`The real player dashes horizontally and hits obstacles at ${fps} fps`,()=>{
  const {scene,TUNING,PLAYER_X,trails,tweens,Rectangle} = flightFixture();
  const obstacle = {kind:'fragile',breakable:true,dead:false,update(){},offscreen(){return false;},
    rect(){return new Rectangle(PLAYER_X+130,185,16,30);}};
  scene.entities.push(obstacle);
  scene.tryDash();
  for (let frame=0;scene.dashTimer>0 && frame<100;frame++) {
    scene.update(0,1000/fps);
    assert.equal(scene.playerY,200); assert.equal(scene.vy,0);
    assert.equal(scene.playerSprite.x,scene.playerX);
    assert.equal(scene.playerSprite.y,scene.playerY);
    assert.equal(scene.getPlayerRect().x+9,scene.playerX);
  }
  assert.equal(scene.playerX,PLAYER_X+TUNING.dash.forwardOffset);
  assert.equal(obstacle.dead,true);
  assert.ok(trails.length>1);
  assert.ok(tweens.every(tween=>!('x' in tween)), 'Trails must not fly ahead of the player');
  scene.update(0,1000/fps);
  assert.ok(scene.playerY>200); assert.ok(scene.playerX<PLAYER_X+TUNING.dash.forwardOffset);
});

test('Repeated dashes stay inside the flight area and respect pauses and slime locks',()=>{
  const {scene,TUNING,PLAYER_X} = flightFixture();
  for (const key of ['paused','transitioning','dashLockTimer']) {
    scene[key]=1;scene.tryDash();assert.equal(scene.dashTimer,0);scene[key]=0;
  }
  for(let dash=0;dash<8;dash++) {
    scene.tryDash();
    for(let frame=0;scene.dashTimer>0 && frame<30;frame++) scene.update(0,1000/60);
    assert.equal(scene.playerX,PLAYER_X+TUNING.dash.forwardOffset);
  }
});

function controlsFixture(touch) {
  const nodes = Object.fromEntries(['#mobile-controls','#mobile-dash','#mobile-dash-state'].map(id=>[id,
    {hidden:true,handlers:{},addEventListener(type,fn){this.handlers[type]=fn;}}]));
  const classes = new Set();
  const context = vm.createContext({window:{matchMedia:()=>({matches:touch})},document:{
    querySelector:id=>nodes[id],documentElement:{classList:{toggle(k,on){on?classes.add(k):classes.delete(k);},remove:k=>classes.delete(k)}}}});
  load(context,'src/ui/MobileControls.js');
  const Type = vm.runInContext('MobileControls',context);
  const game={events:{on(){},once(){},off(){}},scale:{getParentBounds(){},refresh(){}},audioController:{unlock(){}}};
  let dashes=0,active=true;
  const scene={sys:{isActive:()=>active},state:'playing',dashTimer:0,dashCooldown:0,dashLockTimer:0,
    tryDash(){dashes++;this.dashTimer=.32;}};
  return {ui:new Type(game),nodes,classes,scene,dashes:()=>dashes,pause:()=>{active=false;}};
}

test('Touch control triggers one dash, blocks repeat/locked/paused input and releases layout',()=>{
  const f = controlsFixture(true);f.ui.bind(f.scene);
  assert.equal(f.nodes['#mobile-controls'].hidden,false);assert.ok(f.classes.has('mobile-controls-active'));
  let prevented=0,stopped=0;
  const tap=()=>f.nodes['#mobile-dash'].handlers.pointerdown({preventDefault(){prevented++;},stopPropagation(){stopped++;}});
  tap();tap();assert.equal(f.dashes(),1);assert.equal(prevented,2);assert.equal(stopped,2);
  f.scene.dashTimer=0;f.scene.dashLockTimer=3;f.ui.update();tap();
  assert.equal(f.dashes(),1);assert.match(f.nodes['#mobile-dash-state'].textContent,/禁冲刺/);
  f.scene.dashLockTimer=0;f.pause();tap();assert.equal(f.dashes(),1);
  f.ui.unbind(f.scene);assert.equal(f.nodes['#mobile-controls'].hidden,true);assert.equal(f.classes.size,0);
});

test('Desktop never displays the touch control or reserves screen space',()=>{
  const f=controlsFixture(false);f.ui.bind(f.scene);
  assert.equal(f.nodes['#mobile-controls'].hidden,true);assert.equal(f.classes.size,0);
});

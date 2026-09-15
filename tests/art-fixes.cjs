const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function fixture() {
  const random = Object.create(Math);
  random.random = () => 0.25;
  const context = vm.createContext({Math:random, Phaser:{
    Geom:{Rectangle:class {constructor(x,y,width,height){Object.assign(this,{x,y,width,height});}}},
    Math:{Between:(a,b)=>Math.round((a+b)/2)},
  }});
  for (const file of ['src/config/constants.js','src/gfx/ArtAssets.js','src/entities/Entity.js',
    'src/entities/EnemyEntity.js','src/entities/BeeEntity.js','src/entities/BatEntity.js',
    'src/entities/GlowEntity.js','src/entities/PhantomEntity.js','src/systems/SpawnManager.js']) {
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  }
  const types = vm.runInContext('({EnemyEntity,BeeEntity,BatEntity,GlowEntity,PhantomEntity,SpawnManager,PLAYER_X,GROUND_Y,GAME_W})',context);
  const scene = {entities:[],playerX:types.PLAYER_X,playerY:types.GROUND_Y*0.56,add:{
    sprite(){return {
      setDepth(){return this;},setDisplaySize(w,h){this.displayWidth=w;this.displayHeight=h;return this;},
      play(){return this;},setFlipX(value){this.flipX=value;return this;},
      setPosition(){return this;},setRotation(){return this;},destroy(){},
    };},
  }};
  return {...types,scene,random};
}

test('Resized mobs use the requested visual dimensions and matching collision bounds',()=>{
  const {EnemyEntity,BeeEntity,BatEntity,GlowEntity,PhantomEntity,scene} = fixture();
  for (const [Type,w,h] of [[EnemyEntity,57.6,43.2],[BatEntity,43.2,28.8],
    [BeeEntity,70,50],[GlowEntity,68,60],[PhantomEntity,84,52.8]]) {
    const e=new Type(scene,400,200);
    assert.equal(e.sprite.displayWidth,w);
    assert.equal(e.sprite.displayHeight,h);
    assert.equal(e.rect().width,w);
    assert.equal(e.rect().height,h);
    assert.equal(e.breakable,true);
  }
});

for (const speed of [180, 480, 1248]) test(`Bat enters, crosses player and is recycled at speed ${speed}`, () => {
  const {BatEntity,scene,GAME_W,PLAYER_X} = fixture();
  const bat = new BatEntity(scene,GAME_W+80,200);
  let crossed = false, removed = false;
  for (let i=0;i<1200;i++) {
    bat.update(1/60,speed);
    if (bat.x<PLAYER_X) crossed=true;
    if (bat.offscreen()) { bat.kill(); removed=true; break; }
  }
  assert.ok(crossed); assert.ok(removed); assert.ok(bat.dead);
});

for (const fromRight of [false,true]) for (const scroll of [180,480,1248]) {
  test(`Phantom crosses the middle of player lane from ${fromRight?'right':'left'} at scroll ${scroll}`,()=>{
    const {PhantomEntity,scene,PLAYER_X,GROUND_Y,GAME_W} = fixture();
    const e=new PhantomEntity(scene,fromRight?GAME_W+40:-40,GROUND_Y*0.33,{speed:320});
    let crossed=false;
    for(let i=0;i<360;i++) {
      const oldX=e.x;
      e.update(1/60,scroll);
      if((oldX-PLAYER_X)*(e.x-PLAYER_X)<=0) {
        assert.ok(e.y>=GROUND_Y*0.45 && e.y<=GROUND_Y*0.65, `crossing y=${e.y}`);
        crossed=true;break;
      }
      assert.equal(e.offscreen(),false,'phantom disappears before reaching the player lane');
    }
    assert.equal(crossed,true,'phantom never reaches the player lane');
  });
}

test('SpawnManager starts both phantom entries in the middle-upper play area',()=>{
  const {scene,SpawnManager,random,GROUND_Y} = fixture();
  const manager=new SpawnManager(scene);
  for(const r of [0.1,0.9]) {
    random.random=()=>r;
    manager.spawnPhantom();
    const e=scene.entities.at(-1);
    assert.ok(e.y>=GROUND_Y*0.25 && e.y<=GROUND_Y*0.4, `entry y=${e.y}`);
  }
});

test('Right-bound phantoms are recycled after leaving the viewport',()=>{
  const {scene,PhantomEntity,GAME_W} = fixture();
  const e=new PhantomEntity(scene,-40,160);
  e.x=GAME_W+180;e.y=240;
  assert.equal(e.offscreen(),true);
});

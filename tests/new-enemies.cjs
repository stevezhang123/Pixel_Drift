const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function fixture(){
  const sprite=()=>new Proxy({angle:0,destroy(){this.destroyed=true;}},{get(o,k,receiver){return k in o?o[k]:(...args)=>{o[k+'Args']=args;return receiver;};}});
  const context=vm.createContext({Math,Phaser:{Scene:class{},Math:{Between:(a,b)=>Math.floor((a+b)/2),FloatBetween:(a,b)=>(a+b)/2},Geom:{Rectangle:class{constructor(x,y,width,height){Object.assign(this,{x,y,width,height});}}}}});
  for(const f of ['config/constants','gfx/ArtAssets','entities/Entity','entities/ProjectileEntity','entities/NewEnemyEntities','entities/EnemyEntity','scenes/GameScene','config/biomes','systems/SpawnManager'])
    vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',f+'.js'),'utf8'),context);
  const types=vm.runInContext('({ShulkerEntity,HellJellyEntity,FlowerSlimeEntity,EnemyShotEntity,GameScene,SpawnManager,BIOMES,GAME_W,GROUND_Y})',context);
  const scene={entities:[],playerX:150,playerY:220,add:{sprite},spawnBurst(){},scrollSpeed:180};
  return {...types,scene,context};
}
test('Default shulker count uses inclusive 1–3 bounds and sticky speed is 367.5',()=>{
  const {ShulkerEntity,scene,context}=fixture();
  context.Phaser.Math.Between=(min,max)=>{assert.equal(min,1);assert.equal(max,3);return max;};
  const e=new ShulkerEntity(scene,{x:900,y:200,w:66,h:180});
  assert.equal(e.shotCount,3);e.fire();
  const p=scene.entities.at(-1);assert.ok(Math.abs(Math.hypot(p.vx,p.vy)-367.5)<1e-8);
});
test('Nearby sticky shots also keep the fixed speed of 367.5',()=>{
  const {ShulkerEntity,scene}=fixture();
  for(const side of ['left','right','up','down']){
    const e=new ShulkerEntity(scene,{x:scene.playerX+80,y:scene.playerY,w:66,h:180},{side});
    e.fire();const p=scene.entities.at(-1);
    const speed=Math.hypot(p.vx,p.vy);
    assert.ok(Math.abs(speed-367.5)<1e-8);
    const x=p.x,y=p.y,vx=p.vx,vy=p.vy;
    scene.playerX+=20;p.update(.1,1092);
    assert.equal(p.vx,vx);assert.equal(p.vy,vy);
    assert.ok(Math.abs(Math.hypot(p.x-x,p.y-y)-speed*.1)<1e-8);
  }
});
for(const count of [1,2,3]) test('Every shulker shot keeps its launch speed as scrolling accelerates, count '+count,()=>{
  const {ShulkerEntity,GameScene,scene,GAME_W}=fixture();
  scene.playerX=220;scene.playerY=230;
  const wall={x:GAME_W+100,y:230,w:66,h:180,update(dt,scroll){this.x-=scroll*dt;}};
  const shulker=new ShulkerEntity(scene,wall,{side:'left',shotCount:count});
  scene.entities.push(wall,shulker);
  const seen=new Set();
  for(let frame=0;frame<1500&&wall.x>-100;frame++){
    scene.scrollSpeed=[400,420,1092][Math.floor(frame/30)%3];
    const before=new Map(scene.entities.filter(e=>e.kind==='enemyshot').map(p=>[p,[p.x,p.y]]));
    GameScene.prototype.updateEntities.call(scene,1/60);
    for(const p of scene.entities.filter(e=>e.kind==='enemyshot')){
      seen.add(p);
      const speed=Math.hypot(p.vx,p.vy);
      assert.ok(Math.abs(speed-367.5)<1e-7);
      if(before.has(p)){
        const [x,y]=before.get(p);
        assert.ok(Math.abs(Math.hypot(p.x-x,p.y-y)*60-speed)<1e-7);
      }
    }
  }
  assert.equal(seen.size,count);
});
for(const side of ['left','right','up','down']) for(const scroll of [400,1092])
test('Three shulker shots launch ahead of the player without reversing, '+side+' at '+scroll,()=>{
  const {ShulkerEntity,GameScene,scene,GAME_W,context}=fixture();
  scene.playerX=vm.runInContext('PLAYER_X + TUNING.dash.forwardOffset',context);
  scene.playerY=230;scene.scrollSpeed=scroll;
  const wall={x:GAME_W+100,y:230,w:66,h:180,update(dt,s){this.x-=s*dt;}};
  const e=new ShulkerEntity(scene,wall,{side,shotCount:3});
  scene.entities.push(wall,e);
  const launches=[];const fire=e.fire.bind(e);
  e.fire=()=>{fire();const p=scene.entities.at(-1);launches.push({x:p.x,vx:p.vx,speed:Math.hypot(p.vx,p.vy)});};
  for(let frame=0;frame<600&&wall.x>-100;frame++)GameScene.prototype.updateEntities.call(scene,1/30);
  assert.equal(launches.length,3);
  for(const p of launches){
    assert.ok(p.x-scene.playerX>=160,'Shot must launch in front with room to react');
    assert.ok(p.vx<0,'No late shot fired backwards from behind the player');
    assert.ok(Math.abs(p.speed-367.5)<1e-8);
  }
});
test('A shulker already past its firing zone does not catch up with a rear volley',()=>{
  const {ShulkerEntity,scene}=fixture();
  const e=new ShulkerEntity(scene,{x:100,y:230,w:66,h:180},{shotCount:3});
  e.update(1/30,400);
  assert.equal(scene.entities.length,0);assert.equal(e.shotsFired,0);
  assert.equal(e.sprite.setTextureArgs[0],'tex_shulker');
});
test('Biome enemy timer excludes wall-bound shulkers and disabled slots across biome changes',()=>{
  const {SpawnManager,scene,BIOMES}=fixture();const manager=new SpawnManager(scene);
  const calls=[];
  for(const method of ['spawnHeli','spawnBee','spawnBat','spawnGlow','spawnPhantom','spawnHellJelly','spawnFlowerSlime','spawnGhast']) manager[method]=()=>calls.push(method);
  for(const biome of BIOMES){
    scene.biome=biome;calls.length=0;
    for(let i=0;i<100;i++){manager.enemyTimer=0;manager.updateEnemies(.1);}
    if(!biome.enemySlots.some(slot=>slot.type==='heli'&&slot.weight>0)) assert.ok(!calls.includes('spawnHeli'),biome.id);
  }
  scene.biome={enemyInterval:1,enemySlots:[{type:'shulker',weight:1},{type:'heli',weight:0},{type:'bee',weight:-1}]};
  calls.length=0;manager.enemyTimer=0;manager.updateEnemies(.1);assert.equal(calls.length,0);
  manager.spawnEnemy('shulker');manager.spawnEnemy('unknown');assert.equal(calls.length,0);
  scene.biome={enemyInterval:1,enemySlots:[{type:'heli',weight:1}]};
  manager.enemyTimer=0;manager.updateEnemies(.1);assert.deepEqual(calls,['spawnHeli']);
});
test('Wall shulkers require both an enabled biome slot and a positive attachment chance',()=>{
  const {SpawnManager,scene}=fixture();const manager=new SpawnManager(scene);
  for(const biome of [{shulkerChance:1,enemySlots:[]},{shulkerChance:1,enemySlots:[{type:'shulker',weight:0}]},{shulkerChance:0,enemySlots:[{type:'shulker',weight:1}]}]){
    scene.biome=biome;scene.entities=[];const wall={x:1000,y:300,w:66,h:160};manager.addWall(wall);
    assert.deepEqual(scene.entities,[wall]);
  }
});
test('Shulkers remain attached on all four faces and disappear with their wall',()=>{
  const {ShulkerEntity,scene}=fixture();
  for(const side of ['up','down','left','right']){
    const wall={x:500,y:200,w:66,h:180,dead:false};
    const e=new ShulkerEntity(scene,wall,{side});const dx=e.x-wall.x,dy=e.y-wall.y;
    wall.x-=125;wall.y+=15;e.update(.1,900);
    assert.equal(e.x-wall.x,dx);assert.equal(e.y-wall.y,dy);
    wall.dead=true;e.update(.1,900);assert.ok(e.dead);
  }
});
test('Dedicated enemy art preserves collision sizes and bullet behavior',()=>{
  const {ShulkerEntity,HellJellyEntity,FlowerSlimeEntity,EnemyShotEntity,scene}=fixture();
  const shulker=new ShulkerEntity(scene,{x:950,y:200,w:66,h:160},{side:'up'});
  assert.equal(shulker.w,36);assert.equal(shulker.h,36);
  shulker.update(0,180);assert.equal(shulker.sprite.setTextureArgs[0],'tex_shulker');
  shulker.fire();shulker.openTimer=.2;shulker.update(.01,180);
  assert.equal(shulker.sprite.setTextureArgs[0],'tex_shulker_fire');
  for(const [Type,w,h,key] of [[HellJellyEntity,54,60,'tex_helljelly'],[FlowerSlimeEntity,42,42,'tex_flowerslime']]){
    const e=new Type(scene,600,200);assert.equal(e.w,w);assert.equal(e.h,h);
    assert.equal(e.sprite.playArgs[0],'art_'+key);
  }
  for(const type of ['sticky','jellyfire','petal']){
    const p=new EnemyShotEntity(scene,400,200,100,-100,{type,tint:0x111111});
    assert.equal(p.type,type);assert.equal(p.breakable,true);assert.equal(Object.hasOwn(p.sprite,'setTintArgs'),false);
  }
});
for(const speed of [180,480,1248]) for(const count of [1,3]) test('Shulker fires '+count+' shots per visible crossing at speed '+speed,()=>{
  const {ShulkerEntity,scene,GAME_W}=fixture();const wall={x:GAME_W+100,y:230,w:66,h:180,dead:false};
  const e=new ShulkerEntity(scene,wall,{side:'left',shotCount:count});
  for(let i=0;i<1500&&wall.x>-100;i++){wall.x-=speed/60;e.update(1/60,speed);}
  assert.equal(scene.entities.length,count);assert.ok(scene.entities.every(p=>p.dashLockSeconds===3));
});
test('Jelly explodes only on dash destruction, once, with breakable rightward fireballs',()=>{
  const {HellJellyEntity,scene}=fixture();const e=new HellJellyEntity(scene,300,240);
  e.onDashDestroyed();e.onDashDestroyed();assert.ok(scene.entities.length>=3);
  const count=scene.entities.length;
  for(const p of scene.entities){const x=p.x;p.update(.1,1248);assert.ok(p.x>x);assert.ok(p.breakable);assert.notEqual(p.kind,'fireball');}
  new HellJellyEntity(scene,400,200).kill();assert.equal(scene.entities.length,count);
});
for(const boundary of ['ground','left']) test('Slime explodes once at '+boundary+' with 4–6 random upper-right bullets',()=>{
  const {FlowerSlimeEntity,scene,GROUND_Y}=fixture();
  const e=new FlowerSlimeEntity(scene,boundary==='left'?1:500,boundary==='left'?100:GROUND_Y-21,{vx:-200,vy:300});
  e.update(.1,180);e.afterPlayerCollisions();assert.ok(e.dead);assert.ok(scene.entities.length>=4&&scene.entities.length<=6);
  const count=scene.entities.length;e.update(.1,180);assert.equal(scene.entities.length,count);
  for(const p of scene.entities){const x=p.x,y=p.y;p.update(.1,1248);assert.ok(p.x>=x);assert.ok(p.y<=y);}
  assert.ok(new Set(scene.entities.map(p=>p.vx)).size>1);
});
test('Slime dash destruction does not burst; ordinary flight is parabolic and leftward',()=>{
  const {FlowerSlimeEntity,scene}=fixture();const e=new FlowerSlimeEntity(scene,900,220);
  const x=e.x,vy=e.vy;e.update(.1,180);assert.ok(e.x<x);assert.ok(e.vy>vy);
  e.kill();e.update(5,180);assert.equal(scene.entities.length,0);
});
test('Dash kill on the landing frame cancels the pending burst',()=>{
  const {FlowerSlimeEntity,scene,GROUND_Y}=fixture();
  const e=new FlowerSlimeEntity(scene,150,GROUND_Y-21,{vy:300});
  e.update(.1,180);assert.ok(e.pendingBurst);assert.equal(scene.entities.length,0);
  e.kill();e.afterPlayerCollisions();assert.equal(scene.entities.length,0);
});
test('Sticky hit damages once and refreshes a three-second lock without starting cooldown',()=>{
  const {GameScene,EnemyShotEntity,scene}=fixture();
  const game=Object.create(GameScene.prototype);
  Object.assign(game,{state:'playing',invincible:0,dashTimer:0,dashCooldown:0,dashLockTimer:0,health:3,
    damagePlayer(){this.health--;this.invincible=1;},spawnFloatText(){}});
  const shot=()=>new EnemyShotEntity(scene,150,220,0,0,{type:'sticky',dashLockSeconds:3});
  game.playerVsEnemyShot(shot(),false);assert.equal(game.health,2);assert.equal(game.dashLockTimer,3);
  game.tryDash();assert.equal(game.dashTimer,0);assert.equal(game.dashCooldown,0);
  game.updateDashLock(1);assert.equal(game.dashLockTimer,2);
  game.playerVsEnemyShot(shot(),false);assert.equal(game.dashLockTimer,2);assert.equal(game.health,2);
  game.invincible=0;game.playerVsEnemyShot(shot(),false);assert.equal(game.dashLockTimer,3);
  game.updateDashLock(4);assert.equal(game.dashLockTimer,0);
  Object.assign(game,{charCfg:{dashCdMul:1},game:{audioController:{playSfx(){}}},
    add:{image:scene.add.sprite},tweens:{add(){}}});
  game.tryDash();assert.ok(game.dashTimer>0,'Dash becomes usable again after expiry');
});
test('Spawn manager creates registered enemies and attaches shulkers to the exact spawned wall',()=>{
  const {SpawnManager,scene,HellJellyEntity,FlowerSlimeEntity,ShulkerEntity}=fixture();
  scene.biome={shulkerChance:1,enemySlots:[{type:'shulker',weight:1}]};const manager=new SpawnManager(scene);
  manager.spawnEnemy('helljelly');assert.ok(scene.entities.at(-1) instanceof HellJellyEntity);
  manager.spawnEnemy('flowerslime');assert.ok(scene.entities.at(-1) instanceof FlowerSlimeEntity);
  const wall={x:1000,y:300,w:66,h:160,fromTop:false};manager.addWall(wall);
  assert.equal(scene.entities.at(-2),wall);
  assert.ok(scene.entities.at(-1) instanceof ShulkerEntity);assert.equal(scene.entities.at(-1).wall,wall);
});
test('A shulker left of the player still fires toward them during fast scrolling',()=>{
  const {ShulkerEntity,scene}=fixture();
  const e=new ShulkerEntity(scene,{x:50,y:200,w:66,h:100},{side:'right'});
  e.fire();const p=scene.entities.at(-1),x=p.x;p.update(.1,1248);assert.ok(p.x>x);
});
test('New projectiles are recycled at every screen edge and by a finite lifetime',()=>{
  const {EnemyShotEntity,scene,GAME_W,GROUND_Y}=fixture();
  for(const [x,y] of [[-100,200],[GAME_W+120,200],[200,-120],[200,GROUND_Y+100]]){
    assert.ok(new EnemyShotEntity(scene,x,y,0,0).offscreen());
  }
  const p=new EnemyShotEntity(scene,400,200,0,0,{screenSpace:true});p.update(13,0);assert.ok(p.offscreen());
});
test('New enemy biome slots are present and all biomes retain usable obstacle weights',()=>{
  const {BIOMES}=fixture();for(const b of BIOMES)assert.ok(b.obstacleWeights&&Object.values(b.obstacleWeights).some(n=>n>0));
  assert.ok(BIOMES.find(b=>b.id==='end').shulkerChance>0);
  assert.ok(BIOMES.find(b=>b.id==='wailing').enemySlots.some(s=>s.type==='helljelly'));
  assert.ok(BIOMES.find(b=>b.id==='blossom').enemySlots.some(s=>s.type==='flowerslime'));
});

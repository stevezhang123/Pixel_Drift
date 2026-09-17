"use strict";

// Dedicated PNG art; animation is visual-only and does not drive combat timing.
class EnemyShotEntity extends ProjectileEntity {
  constructor(scene, x, y, vx, vy, opts = {}) {
    const type=opts.type || 'petal';
    const texture={sticky:'tex_sticky',jellyfire:'tex_jellyfire',petal:'tex_petal'}[type];
    super(scene, x, y, texture || opts.texture || 'tex_stone', opts.size || 16, opts.size || 16,
      vx, vy, 0, {type, breakable:true, tint:texture ? undefined : opts.tint, spin:90});
    this.kind = 'enemyshot';
    this.dashLockSeconds = opts.dashLockSeconds || 0;
    this.screenSpace = opts.screenSpace === true;
    this.age = 0;
  }
  update(dt, scrollSpeed) {
    if (this.dead) return;
    this.age += dt;
    super.update(dt, this.screenSpace ? 0 : scrollSpeed);
  }
  offscreen() {
    return this.age > 12 || this.x < -80 || this.x > GAME_W + 100 ||
      this.y < -100 || this.y > GROUND_Y + 80;
  }
}

class ShulkerEntity extends Entity {
  constructor(scene, wall, opts = {}) {
    super(scene, 'shulker', wall.x, wall.y, 'tex_shulker', 36, 36);
    this.wall = wall;
    this.side = opts.side || 'left';
    const normal = {up:[0,-1], down:[0,1], left:[-1,0], right:[1,0]}[this.side];
    if (!normal) throw new Error('Unknown shulker attachment: ' + this.side);
    this.normal = normal;
    const along = Math.max(-.8,Math.min(.8,opts.along || 0));
    this.offsetX = normal[0] ? normal[0] * (wall.w + this.w) / 2 : along * (wall.w-this.w)/2;
    this.offsetY = normal[1] ? normal[1] * (wall.h + this.h) / 2 : along * (wall.h-this.h)/2;
    this.shotCount = opts.shotCount || Phaser.Math.Between(1,3);
    this.shotsFired = 0;
    this.openTimer = 0;
    this.breakable = true;
    this.sprite.setRotation(Math.atan2(normal[1],normal[0]) + Math.PI/2).setDisplaySize(36,44);
    this.syncWall();
  }
  syncWall() {
    this.x = this.wall.x + this.offsetX;
    this.y = this.wall.y + this.offsetY;
    this.sprite.setPosition(this.x,this.y);
  }
  update(dt, scrollSpeed) {
    if (this.dead) return;
    if (this.wall.dead) { this.kill(); return; }
    this.syncWall();
    this.openTimer = Math.max(0,this.openTimer-dt);
    // Finish the volley ahead of even the dashing player. Scheduling across the
    // whole screen put round three behind the player, reversing its direction.
    const firingEnd = PLAYER_X + TUNING.dash.forwardOffset + 160;
    const firingWidth = GAME_W - firingEnd;
    const progress = (GAME_W - this.x) / firingWidth;
    const inFiringRange = this.x >= firingEnd && this.x <= GAME_W;
    while (inFiringRange && this.shotsFired < this.shotCount &&
      progress >= (this.shotsFired + .5) / this.shotCount) {
      this.fire(); this.shotsFired++; this.openTimer = .3;
    }
    const next = (this.shotsFired + .5) / this.shotCount;
    const charging = this.shotsFired < this.shotCount && inFiringRange &&
      (next-progress)*firingWidth / Math.max(1,scrollSpeed) < .25;
    this.sprite.setTexture(this.openTimer > 0 ? 'tex_shulker_fire' : charging ? 'tex_shulker_open' : 'tex_shulker');
  }
  fire() {
    const x=this.x+this.normal[0]*22, y=this.y+this.normal[1]*22;
    const dx=this.scene.playerX-x,dy=this.scene.playerY-y,len=Math.hypot(dx,dy)||1;
    const speed=500;
    this.scene.entities.push(new EnemyShotEntity(this.scene,x,y,dx/len*speed,dy/len*speed,
      {type:'sticky',tint:0xead8a8,dashLockSeconds:3,screenSpace:true}));
  }
  offscreen() { return this.wall.dead || super.offscreen(); }
}

class HellJellyEntity extends Entity {
  constructor(scene,x,y) {
    super(scene,'helljelly',x,y,'tex_helljelly',54,60);
    this.breakable=true;
    this.baseY=y;
    this.hover=Math.random()*Math.PI*2;
    this.exploded=false;
  }
  update(dt,scrollSpeed) {
    if(this.dead) return;
    this.hover+=dt*2;
    this.x-=(scrollSpeed+35)*dt;
    this.y=this.baseY+Math.sin(this.hover)*22;
    this.sprite.setPosition(this.x,this.y);
  }
  onDashDestroyed() {
    if(this.exploded || this.dead) return;
    this.exploded=true;
    const n=Phaser.Math.Between(4,6);
    for(let i=0;i<n;i++) {
      const angle=(Math.random()-.5)*Math.PI*.65, speed=200+Math.random()*100;
      this.scene.entities.push(new EnemyShotEntity(this.scene,this.x+this.w/2+20,this.y,
        Math.cos(angle)*speed,Math.sin(angle)*speed,
        {type:'jellyfire',texture:'tex_fireball',size:24,screenSpace:true}));
    }
    this.scene.spawnBurst(this.x,this.y,0xff8833);
  }
}

class FlowerSlimeEntity extends Entity {
  constructor(scene,x,y,opts={}) {
    super(scene,'flowerslime',x,y,'tex_flowerslime',42,42);
    this.breakable=true;
    this.vx=opts.vx === undefined ? -190 : opts.vx;
    this.vy=opts.vy === undefined ? -250 : opts.vy;
    this.gravity=460;
    this.exploded=false;
  }
  update(dt,scrollSpeed) {
    if(this.dead) return;
    const oldX=this.x,oldY=this.y;
    this.x+=(this.vx-scrollSpeed)*dt;
    this.y+=this.vy*dt+.5*this.gravity*dt*dt;
    this.vy+=this.gravity*dt;
    // Interpolate the first boundary contact so even fast scrolling bursts on-screen.
    const ground=GROUND_Y-this.h/2, left=this.w/2;
    let contact=1;
    if(this.x<=left) contact=Math.min(contact,Math.max(0,(oldX-left)/(oldX-this.x || 1)));
    if(this.y>=ground) contact=Math.min(contact,Math.max(0,(ground-oldY)/(this.y-oldY || 1)));
    if(this.x<=left || this.y>=ground) {
      this.x=oldX+(this.x-oldX)*contact;
      this.y=oldY+(this.y-oldY)*contact;
      this.pendingBurst=true;
      this.sprite.setPosition(this.x,this.y);
    } else this.sprite.setPosition(this.x,this.y);
  }
  afterPlayerCollisions() {
    if(this.pendingBurst && !this.dead) this.explode();
  }
  explode() {
    if(this.dead || this.exploded) return;
    this.exploded=true;
    const n=Phaser.Math.Between(4,6);
    for(let i=0;i<n;i++) {
      const angle=(-30+Math.random()*120)*Math.PI/180, speed=180+Math.random()*120;
      this.scene.entities.push(new EnemyShotEntity(this.scene,this.x,this.y-8,
        Math.cos(angle)*speed,-Math.sin(angle)*speed,
        {type:'petal',tint:0xff9bcd,size:14,screenSpace:true}));
    }
    this.scene.spawnBurst(this.x,this.y,0xff8bc7);
    this.kill();
  }
}

"use strict";
// Isolated combat lab: real entities/collision/dash methods, stationary test player.
class EnemyPreviewScene extends GameScene {
  preload(){ArtAssets.preload(this);}
  create(){
    this.game.audioController={setBiome(){},playSfx(){}};
    BootScene.prototype.createAnimations.call(this);
    ArtAssets.createAnimations(this);
    super.create();
    this.health=99;
    const actions={
      shulker:()=>{
        for(const [i,side] of ['up','down','left','right'].entries()){
          const wall=new WallEntity(this,GAME_W+100+i*120,side==='down',150,66);
          this.entities.push(wall,new ShulkerEntity(this,wall,{side,shotCount:3}));
        }
      },
      jelly:()=>{this.entities.push(new HellJellyEntity(this,460,230));},
      slime:()=>{this.entities.push(new FlowerSlimeEntity(this,850,220));},
      left:()=>{this.entities.push(new FlowerSlimeEntity(this,90,120,{vx:-240,vy:-100}));},
      sticky:()=>{this.entities.push(new EnemyShotEntity(this,this.playerX,this.playerY,0,0,
        {type:'sticky',dashLockSeconds:3,tint:0xead8a8}));},
    };
    for(const [id,action] of Object.entries(actions)) document.querySelector('#'+id).onclick=()=>{
      this.entities.forEach(e=>e.kill());this.entities=[];
      this.invincible=0;this.dashTimer=0;this.dashCooldown=0;this.dashLockTimer=0;
      this.lastEvent=document.querySelector('#'+id).textContent;
      action();
    };
    document.querySelector('#destroy').onclick=()=>{
      const enemy=this.entities.find(e=>!e.dead&&['helljelly','flowerslime'].includes(e.kind));
      if(enemy){this.dashTimer=.25;this.destroyEntity(enemy);this.lastEvent='冲刺击毁 '+enemy.kind;}
    };
    document.querySelector('#dash').onclick=()=>{
      this.tryDash();this.lastEvent=this.dashTimer>0?'冲刺成功':'冲刺被阻止';
    };
    this.lastEvent='就绪';
  }
  update(_time,delta){
    if(!this.entities || this.paused) return;
    const dt=Math.min(delta/1000,.04);
    this.updateDashLock(dt);
    this.dashTimer=Math.max(0,this.dashTimer-dt);
    this.dashCooldown=Math.max(0,this.dashCooldown-dt);
    this.invincible=Math.max(0,this.invincible-dt);
    this.updateEntities(dt);this.checkCollisions();this.cleanupEntities();this.updateUI();
    const bullets=this.entities.filter(e=>e.kind==='enemyshot').length;
    document.querySelector('#status').textContent=`${this.lastEvent}；生命 ${this.health}；禁冲刺 ${this.dashLockTimer.toFixed(1)} 秒；子弹 ${bullets}`;
  }
}
new Phaser.Game({type:Phaser.AUTO,parent:'preview',width:GAME_W,height:GAME_H,pixelArt:true,
  scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[EnemyPreviewScene]});

"use strict";

/* =========================================================================
 * [H] 生成管理器
 *
 * 三条相互独立的生成线：
 *   1. obstacle —— 墙体 / 浮岛 / 藤蔓（由 obstacleWeights + 障碍概率控制）
 *   2. enemy    —— 敌人（由 biome.enemySlots 槽位选型 + enemyInterval 控制）
 *   3. projectile —— 抛射物（由 biome.projectileSlots 槽位选型 + projectileInterval 控制）
 * 敌人 / 抛射物各自独立计数、独立生成，互不影响。
 *
 * ★ 扩展接口：
 *   - 新增敌人类型：在 biome.enemySlots 里加 {type,weight}，并在 spawnEnemy 分发新 case
 *   - 新增抛射物类型：在 biome.projectileSlots 里加 {type,weight}，并在 spawnProjectile 分发新 case
 *   - 缩小/放弃某个槽位：直接从对应 slots 数组中删改即可
 * ========================================================================= */

/* 时间错开：敌人与障碍物不要在相近时间生成（相近时间 → 生成 x 相近）。
 * gap 秒内二者只生成其一，避免重叠；延迟有上限，不会互相饿死。 */
const ENEMY_OBSTACLE_GAP = 0.15;

class SpawnManager {
  constructor(scene) {
    this.scene = scene;

    this.timer = 0.8;         // 障碍物计时器
    this.enemyTimer = 2.5;    // 敌人独立计时器
    this.projTimer = 2.5;     // 抛射物独立计时器

    this.clock = 0;             // 生成时钟（累计秒）
    this.lastObstacleAt = -999; // 上次生成障碍物/奖励时的时钟
    this.lastEnemyAt = -999;    // 上次生成敌人时的时钟
  }

  update(dt) {
    const scene = this.scene;
    if (scene.state !== 'playing' || scene.transitioning) return;

    this.clock += dt;

    this.updateObstacles(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
  }

  /* ---------------- 障碍物生成线 ---------------- */

  updateObstacles(dt) {
    const scene = this.scene;

    this.timer -= dt;
    if (this.timer > 0) return;

    // 敌人刚在相近时间生成时，推迟障碍物（时间错开，最多延迟 gap 秒）
    if (this.clock - this.lastEnemyAt < ENEMY_OBSTACLE_GAP) return;

    const interval = scene.getCurrentSpawnInterval();
    this.timer = interval * Phaser.Math.FloatBetween(0.85, 1.15);
    this.lastObstacleAt = this.clock;

    if (Math.random() < scene.getCurrentObstacleWeight()) {
      this.spawnObstacle();
    } else {
      this.spawnReward();
    }
  }

  spawnReward() {
    // 生命宝石概率 0.15 → 提升 50% 到 0.225
    if (Math.random() < 0.225) this.spawnLifeCrystal();
    else this.spawnEmeralds();
  }

  spawnObstacle() {
    const weights = this.scene.biome.obstacleWeights;

    /* 仅墙壁式 / 自由 / 脆弱三类障碍参与加权（enemy、projectile 已独立出去） */
    const kinds = ['wall', 'free', 'vine'];

    let total = 0;
    for (const k of kinds) total += weights[k] || 0;
    if (total <= 0) { this.spawnWall(); return; }

    let r = Math.random() * total;
    let type = 'wall';
    for (const k of kinds) {
      r -= weights[k] || 0;
      if (r <= 0) { type = k; break; }
    }

    switch (type) {
      case 'free': this.spawnFree(); break;
      case 'vine': this.spawnVine(); break;
      default:     this.spawnWall(); break;
    }
  }

  /* ---------------- 墙式障碍 ---------------- */

  spawnWall() {
    if (Math.random() < 0.60) this.spawnWallSingle();
    else this.spawnWallPair();
  }

  spawnWallSingle() {
    const scene = this.scene;
    const x = GAME_W + 100;
    const fromTop = Math.random() < 0.5;
    const width = 66;

    const minGap = 150;
    const maxHeight = GROUND_Y - minGap - 40;
    const height = Phaser.Math.Between(110, Math.max(140, maxHeight));

    this.addWall(new WallEntity(scene, x, fromTop, height, width));
  }

  spawnWallPair() {
    const scene = this.scene;
    const x = GAME_W + 100;
    const width = 66;
    const gap = Phaser.Math.Between(180, 230);
    const gapY = Phaser.Math.Between(gap / 2 + 50, GROUND_Y - gap / 2 - 50);

    const topH = gapY - gap / 2;
    const botH = GROUND_Y - (gapY + gap / 2);

    if (topH > 40) this.addWall(new WallEntity(scene, x, true, topH, width));
    if (botH > 40) this.addWall(new WallEntity(scene, x, false, botH, width));

    scene.entities.push(new EmeraldEntity(scene, x, gapY));
  }

  /* ---------------- 自由障碍 ---------------- */
  addWall(wall) {
    this.scene.entities.push(wall);
    const enabled=this.getEnemySlots().some(slot => slot.type === 'shulker');
    const chance=this.scene.biome.shulkerChance || 0;
    if (!enabled || !chance || Math.random() >= chance) return;
    // The outward end face and both side faces are reachable in the play area.
    const sides=['left','right',wall.fromTop ? 'down' : 'up'];
    this.scene.entities.push(new ShulkerEntity(this.scene,wall,{
      side:sides[Phaser.Math.Between(0,sides.length-1)],along:Phaser.Math.FloatBetween(-.65,.65),
    }));
  }

  spawnFree() {
    const scene = this.scene;
    const x = GAME_W + 130;

    if (Math.random() < 0.5) {
      const y = Phaser.Math.Between(130, GROUND_Y - 130);
      scene.entities.push(new FloaterEntity(scene, x, y, 'tex_lava', 38, 38, {
        amp: Phaser.Math.Between(40, 80),
        freq: 0.9,
      }));
    } else {
      const y = Phaser.Math.Between(130, GROUND_Y - 110);
      scene.entities.push(new FloaterEntity(scene, x, y, 'tex_island', 120, 60, {
        amp: Phaser.Math.Between(10, 26),
        freq: 0.6,
      }));
    }
  }

  /* ---------------- 脆弱障碍（藤蔓） ---------------- */

  spawnVine() {
    const scene = this.scene;
    const x = GAME_W + 100;
    const w = 40;

    const full = Math.random() < 0.5;
    const h = full ? GROUND_Y : Phaser.Math.Between(220, 360);
    const y = h / 2;

    scene.entities.push(new VineEntity(scene, x, y, w, h));
  }

  /* ---------------- 敌人生成线（独立） ---------------- */

  getEnemySlots() {
    return (this.scene.biome.enemySlots || []).filter(slot => {
      const weight = slot.weight === undefined ? 1 : slot.weight;
      return Number.isFinite(weight) && weight > 0;
    });
  }

  updateEnemies(dt) {
    const scene = this.scene;
    // 潜影贝只随墙生成；槽位控制启用，shulkerChance 控制每面墙的概率。
    const slots = this.getEnemySlots().filter(slot => slot.type !== 'shulker');
    if (!slots || slots.length === 0) return;

    this.enemyTimer -= dt;
    if (this.enemyTimer > 0) return;

    // 障碍物刚在相近时间生成时，推迟敌人（时间错开，最多延迟 gap 秒）
    if (this.clock - this.lastObstacleAt < ENEMY_OBSTACLE_GAP) return;

    this.enemyTimer = scene.biome.enemyInterval * Phaser.Math.FloatBetween(0.8, 1.2);
    this.lastEnemyAt = this.clock;
    this.spawnEnemy(this.pickFromSlots(slots));
  }

  /* 敌人分发入口：未来新增敌人类型时在此扩展 case */
  spawnEnemy(type) {
    switch (type) {
      case 'heli':    this.spawnHeli();    break;
      case 'bee':     this.spawnBee();     break;
      case 'bat':     this.spawnBat();     break;
      case 'phantom': this.spawnPhantom(); break;
      case 'glow':    this.spawnGlow();    break;
      case 'ghast':   this.spawnGhast();   break;
      case 'helljelly': this.spawnHellJelly(); break;
      case 'flowerslime': this.spawnFlowerSlime(); break;
      case 'shulker': // 由 addWall 处理，不能作为游离敌人生成。
      default: break; // 未注册类型不能变成群系未配置的直升机。
    }
  }

  spawnHeli() {
    const scene = this.scene;
    const x = GAME_W + 110;
    const y = Phaser.Math.Between(110, GROUND_Y - 120);

    scene.entities.push(new EnemyEntity(scene, x, y, {
      amp: Phaser.Math.Between(30, 70),
      trackSpeed: 0.35 + Math.min(0.4, scene.elapsed / 300),
    }));
  }

  spawnHellJelly() {
    this.scene.entities.push(new HellJellyEntity(this.scene,GAME_W+70,
      Phaser.Math.Between(110,GROUND_Y-110)));
  }

  spawnFlowerSlime() {
    this.scene.entities.push(new FlowerSlimeEntity(this.scene,GAME_W+50,
      Phaser.Math.Between(180,GROUND_Y-100)));
  }

  /* 蜜蜂：缓慢小范围上下移动 */
  spawnBee() {
    const scene = this.scene;
    const x = GAME_W + 80;
    const y = Phaser.Math.Between(120, GROUND_Y - 120);
    scene.entities.push(new BeeEntity(scene, x, y));
  }

  /* 蝙蝠：快速小范围上下移动 */
  spawnBat() {
    const scene = this.scene;
    const x = GAME_W + 80;
    const y = Phaser.Math.Between(120, GROUND_Y - 120);
    scene.entities.push(new BatEntity(scene, x, y));
  }

  /* 幻翼：从两侧中上部进场，穿过玩家列的中段高度 */
  spawnPhantom() {
    const scene = this.scene;
    const fromRight = Math.random() < 0.5;
    const x = fromRight ? GAME_W + 40 : -40;
    const y = Phaser.Math.Between(Math.round(GROUND_Y * 0.28), Math.round(GROUND_Y * 0.38));
    scene.entities.push(new PhantomEntity(scene, x, y, {
      speed: Phaser.Math.Between(280, 360),
    }));
  }

  /* 荧光怪：右方发弹后左移 */
  spawnGlow() {
    const scene = this.scene;
    const x = GAME_W + 60;
    const y = Phaser.Math.Between(140, GROUND_Y - 140);
    scene.entities.push(new GlowEntity(scene, x, y, {
      fireCount: Phaser.Math.Between(3, 5),
    }));
  }

  /* 恶魂：固定屏幕右方发射火球；同屏只保留一只 */
  spawnGhast() {
    const scene = this.scene;
    for (const e of scene.entities) {
      if (!e.dead && e.kind === 'ghast') return;
    }
    const y = Phaser.Math.Between(120, GROUND_Y - 120);
    scene.entities.push(new GhastEntity(scene, GAME_W - 190, y));
  }

  /* ---------------- 抛射物生成线（独立） ---------------- */

  updateProjectiles(dt) {
    const scene = this.scene;
    const slots = scene.biome.projectileSlots;
    if (!slots || slots.length === 0) return;

    this.projTimer -= dt;
    if (this.projTimer > 0) return;

    this.projTimer = scene.biome.projectileInterval * Phaser.Math.FloatBetween(0.8, 1.2);
    this.spawnProjectile(this.pickFromSlots(slots));
  }

  /* 抛射物分发入口：未来新增抛射物类型时在此扩展 case */
  spawnProjectile(type) {
    switch (type) {
      case 'stone': this.spawnProjectileEntity('stone', 'tex_stone', true); break;
      case 'lava':  this.spawnProjectileEntity('lava', 'tex_lava', false); break;
      default:      this.spawnProjectileEntity('lava', 'tex_lava', false); break;
    }
  }

  spawnProjectileEntity(type, tex, breakable) {
    const scene = this.scene;
    const x = GAME_W + 60;
    const y = Phaser.Math.Between(140, 320);

    const vx = -(260 + Math.random() * 100);
    const vy = -(180 + Math.random() * 80);
    const gravity = 420;

    scene.entities.push(
      new ProjectileEntity(scene, x, y, tex, 36, 36, vx, vy, gravity, { type, breakable })
    );
  }

  /* ---------------- 槽位加权随机选型 ---------------- */

  pickFromSlots(slots) {
    let total = 0;
    for (const s of slots) total += s.weight || 1;

    let r = Math.random() * total;
    for (const s of slots) {
      r -= s.weight || 1;
      if (r <= 0) return s.type;
    }
    return slots[0] && slots[0].type;
  }

  /* ---------------- 绿宝石 ---------------- */

  spawnEmeralds() {
    const scene = this.scene;
    const x = GAME_W + 80;
    const count = Phaser.Math.Between(2, 4);
    const baseY = Phaser.Math.Between(100, GROUND_Y - 100);
    const gapY = 36;

    for (let i = 0; i < count; i++) {
      const y = baseY + (i - (count - 1) / 2) * gapY;
      if (y < 60 || y > GROUND_Y - 40) continue;

      let blocked = false;
      for (const e of scene.entities) {
        // 只对静态障碍物做遮挡检测（奖励可与移动的敌人/抛射物共存）
        if (e.kind !== 'wall' && e.kind !== 'free' && e.kind !== 'fragile') continue;
        if (Math.abs(e.x - x) < 120 && Math.abs(e.y - y) < 120) {
          blocked = true; break;
        }
      }
      if (blocked) continue;

      scene.entities.push(new EmeraldEntity(scene, x, y));
    }
  }

  /* ---------------- 生命水晶 ---------------- */

  spawnLifeCrystal() {
    const scene = this.scene;
    const x = GAME_W + 80;
    const y = Phaser.Math.Between(100, GROUND_Y - 100);

    for (const e of scene.entities) {
      // 只对静态障碍物做遮挡检测（奖励可与移动的敌人/抛射物共存）
      if (e.kind !== 'wall' && e.kind !== 'free' && e.kind !== 'fragile') continue;
      if (Math.abs(e.x - x) < 120 && Math.abs(e.y - y) < 120) {
        return; // 位置被障碍占用，放弃本次生成
      }
    }

    scene.entities.push(new LifeCrystalEntity(scene, x, y));
  }
}

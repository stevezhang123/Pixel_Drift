"use strict";

/* =========================================================================
 * [J] GameScene —— 核心玩法
 * ========================================================================= */

class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.charKey = data.character || 'blue';
    this.charCfg = CHARACTERS[this.charKey];
  }

  create() {
    /* ---- 游戏状态 ---- */
    this.state = 'playing';
    this.paused = false;

    /* ---- 数值状态 ---- */
    this.elapsed = 0;
    this.score = 0;
    this.health = TUNING.health.max;
    this.invincible = 0;
    this.windTime = 0;

    this.baseSpeed = TUNING.world.baseScrollSpeed;
    this.scrollSpeed = TUNING.world.baseScrollSpeed;

    /* ---- 玩家物理 ---- */
    this.playerX = PLAYER_X;
    this.playerY = GAME_H * 0.42;
    this.vy = 0;

    /* ---- 冲刺 ---- */
    this.dashTimer = 0;
    this.dashCooldown = 0;

    /* ---- 实体容器 ---- */
    this.entities = [];

    /* ---- 生物群系 ---- */
    this.biomeIndex = 0;
    this.biomeTimer = 0;
    this.biome = BIOMES[0];
    this.game.audioController.setBiome(this.biome.id);
    this.transitioning = false;

    /* ---- 背景 ---- */
    this.bgManager = new BackgroundManager(this);
    this.bgManager.applyBiome(this.biome, true);

    /* ---- 玩家 ---- */
    this.playerSprite = this.add.sprite(
      this.playerX, this.playerY, `tex_player_${this.charKey}_0`
    ).setDepth(20).setScale(1.6 * ArtAssets.playerScale);
    this.playerSprite.play('fly_' + this.charKey);

    /* ---- 系统 ---- */
    this.spawnManager = new SpawnManager(this);

    /* ---- UI ---- */
    this.createUI();
    this.createPauseOverlay();

    /* ---- 输入 ---- */
    this.setupInput();

    /* ---- 开场 ---- */
    this.cameras.main.fadeIn(400);
    this.showBiomeTitle(this.biome.name);
  }

  /* ---------------------------------------------------------------------
   *  输入
   * ------------------------------------------------------------------- */
  setupInput() {
    this.input.on('pointerdown', () => {
      if (this.paused || this.state !== 'playing') return;
      this.flap();
    });

    this.input.keyboard.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.P,
    ]);

    this.input.keyboard.on('keydown-SPACE', (e) => {
      e.preventDefault();
      if (this.paused || this.state !== 'playing') return;
      this.tryDash();
    });

    this.input.keyboard.on('keydown-P', () => {
      if (this.state !== 'playing') return;
      this.togglePause();
    });
  }

  flap() {
    const f = TUNING.flight;
    const c = this.charCfg;

    const target = -f.flapImpulse * c.flapMul;
    this.vy = Phaser.Math.Linear(this.vy, target, f.flapSmoothing);
    this.vy = Math.max(this.vy, -f.maxUpSpeed);

    this.tweens.add({
      targets: this.playerSprite,
      scaleX: 1.45 * ArtAssets.playerScale, scaleY: 1.45 * ArtAssets.playerScale,
      duration: 70, yoyo: true,
      onComplete: () => this.playerSprite.setScale(1.6 * ArtAssets.playerScale),
    });
  }

  tryDash() {
    if (this.dashCooldown > 0) return;

    const d = TUNING.dash;
    this.dashTimer = d.duration;
    this.dashCooldown = d.cooldown * this.charCfg.dashCdMul;
    this.game.audioController.playSfx('dash');

    for (let i = 0; i < 5; i++) {
      const ghost = this.add.image(this.playerX, this.playerY, `tex_player_${this.charKey}_0`)
        .setScale(1.6 * ArtAssets.playerScale).setTint(0x9fe8ff).setAlpha(0.55).setDepth(18);
      this.tweens.add({
        targets: ghost,
        x: this.playerX + 90 + i * 24,
        alpha: 0,
        duration: 320,
        delay: i * 35,
        onComplete: () => ghost.destroy(),
      });
    }
  }

  /* ---------------------------------------------------------------------
   *  难度曲线
   * ------------------------------------------------------------------- */
  updateDifficulty(dt) {
    this.elapsed += dt;
    const w = TUNING.world;

    /* --- 卷轴速度：前 accelStartTime 秒恒定，之后线性加速，有上限 --- */
    if (this.elapsed <= w.accelStartTime) {
      this.baseSpeed = w.baseScrollSpeed;
    } else {
      const t = this.elapsed - w.accelStartTime;
      this.baseSpeed = Math.min(
        w.baseScrollSpeed + t * w.accelPerSecond,
        w.maxScrollSpeed
      );
    }

    /* --- 冲刺时整体加速 --- */
    this.scrollSpeed = this.dashTimer > 0
      ? this.baseSpeed * TUNING.dash.speedMultiplier
      : this.baseSpeed;

    /* --- 距离分 --- */
    this.score += TUNING.score.distancePoints * this.scrollSpeed * dt;
  }

  /** 计算当前生成间隔（含生物群系倍率） */
  getCurrentSpawnInterval() {
    const s = TUNING.spawn;
    const base = Math.max(s.minInterval, s.baseInterval - this.elapsed * s.intervalDecay);
    return Math.max(s.minInterval * 0.7, base * this.biome.spawnIntervalMul);
  }

  /** 计算当前障碍物概率（含生物群系加成） */
  getCurrentObstacleWeight() {
    const s = TUNING.spawn;
    const w = s.obstacleWeightStart + this.elapsed * s.obstacleWeightGrow + this.biome.obstacleWeightBonus;
    return Phaser.Math.Clamp(w, 0, s.obstacleWeightMax);
  }

  /* ---------------------------------------------------------------------
   *  风筝物理
   * ------------------------------------------------------------------- */
  updatePlayerPhysics(dt) {
    const f = TUNING.flight;
    const c = this.charCfg;

    /* --- 风力：垂直方向正弦扰动 --- */
    this.windTime += dt;
    const wind = Math.sin(this.windTime * f.windFrequency * Math.PI * 2) * f.windStrength;

    /* --- 重力 --- */
    this.vy += f.gravity * c.gravityMul * dt;

    /* --- 风力 --- */
    this.vy += wind * dt;

    /* --- 空气阻尼（风筝手感：保留惯性，滑翔更久）--- */
    this.vy *= Math.pow(f.airDamp, dt * 60);

    /* --- 限速 --- */
    this.vy = Phaser.Math.Clamp(this.vy, -f.maxUpSpeed, f.maxDownSpeed);

    /* --- 积分位置 --- */
    this.playerY += this.vy * dt;

    /* --- 顶部边界（封顶群系触碰视为碰撞） --- */
    const topY = 30;
    if (this.playerY < topY) {
      this.playerY = topY;
      this.vy = Math.max(this.vy, 0);
      if (this.biome.capped) this.damagePlayer();
    }

    /* --- 底部：撞地扣血并弹起 --- */
    if (this.playerY > GROUND_Y - 14) {
      this.playerY = GROUND_Y - 14;
      this.vy = -280;
      this.damagePlayer();
    }

    /* --- 冲刺计时 --- */
    if (this.dashTimer > 0)    this.dashTimer    -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;

    /* --- 冲刺时向右位移（视觉反馈）--- */
    const targetX = this.dashTimer > 0
      ? PLAYER_X + TUNING.dash.forwardOffset
      : PLAYER_X;
    this.playerX = Phaser.Math.Linear(this.playerX, targetX, Math.min(1, dt * 9));

    /* --- 同步精灵 --- */
    this.playerSprite.setPosition(this.playerX, this.playerY);
    this.playerSprite.setRotation(Phaser.Math.Clamp(this.vy / 1400, -0.45, 0.45));

    /* --- 冲刺高亮 --- */
    if (this.dashTimer > 0) this.playerSprite.setTint(0xfff2a0);
    else this.playerSprite.clearTint();
  }

  /* ---------------------------------------------------------------------
   *  实体更新 / 回收
   * ------------------------------------------------------------------- */
  updateEntities(dt) {
    for (const e of this.entities) {
      if (!e.dead) e.update(dt, this.scrollSpeed);
    }
  }

  cleanupEntities() {
    this.entities = this.entities.filter(e => {
      if (e.dead) return false;
      if (e.offscreen()) { e.kill(); return false; }
      return true;
    });
  }

  /* ---------------------------------------------------------------------
   *  碰撞检测
   * ------------------------------------------------------------------- */
  getPlayerRect() {
    const w = 18, h = 16;
    return new Phaser.Geom.Rectangle(
      this.playerX - w / 2,
      this.playerY - h / 2,
      w, h
    );
  }

  checkCollisions() {
    const pr = this.getPlayerRect();
    const dashing = this.dashTimer > 0;

    for (const e of this.entities) {
      if (e.dead) continue;
      if (!Phaser.Geom.Intersects.RectangleToRectangle(pr, e.rect())) continue;

      if (e.kind === 'emerald') {
        this.collectEmerald(e);
      } else if (e.kind === 'life') {
        this.collectLifeCrystal(e);
      } else if (e.kind === 'fireball') {
        this.playerVsFireball(e, dashing);
      } else if (e.breakable || e.kind === 'enemy') {
        if (dashing) this.destroyEntity(e);
        else this.damagePlayer();
      } else {
        this.damagePlayer();
      }
    }

    this.checkReboundFireballs();
  }

  /* 玩家碰上火球：冲刺 → 反弹飞向恶魂；否则 → 扣血 */
  playerVsFireball(e, dashing) {
    if (e.reversed) return; // 已反弹的火球不再伤害玩家
    if (dashing) {
      e.rebound();
      this.spawnFloatText(e.x, e.y, '反弹', '#9be36a');
    } else {
      e.kill();
      this.damagePlayer();
    }
  }

  /* 反弹火球命中恶魂 → 消灭恶魂 */
  checkReboundFireballs() {
    for (const fb of this.entities) {
      if (fb.dead || fb.kind !== 'fireball' || !fb.reversed) continue;
      for (const g of this.entities) {
        if (g.dead || g.kind !== 'ghast') continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(fb.rect(), g.rect())) {
          this.killGhastByFireball(g, fb);
          break;
        }
      }
    }
  }

  killGhastByFireball(ghast, fb) {
    ghast.kill();
    fb.kill();
    this.score += TUNING.score.destroyPoints;
    this.spawnFloatText(ghast.x, ghast.y, '+' + TUNING.score.destroyPoints, '#ffd76a');
    this.spawnBurst(ghast.x, ghast.y, 0xff9a6a);
    this.cameras.main.shake(120, 0.008);
  }

  collectEmerald(e) {
    e.kill();
    this.game.audioController.playSfx('collect');
    this.score += TUNING.score.emeraldPoints;
    this.spawnFloatText(e.x, e.y, '+' + TUNING.score.emeraldPoints, '#7dffb0');

    this.tweens.add({
      targets: this.playerSprite,
      scaleX: 1.75 * ArtAssets.playerScale, scaleY: 1.75 * ArtAssets.playerScale,
      duration: 80, yoyo: true,
      onComplete: () => this.playerSprite.setScale(1.6 * ArtAssets.playerScale),
    });
  }

  collectLifeCrystal(e) {
    e.kill();

    this.health++;
    this.spawnFloatText(e.x, e.y, '+1 生命', '#ff9a9a');

    this.updateHealthUI();
    this.spawnBurst(e.x, e.y, 0xff4d4d);
  }

  destroyEntity(e) {
    if (e instanceof EnemyEntity && this.dashTimer > 0) this.game.audioController.playSfx('helicopter');
    e.kill();
    this.score += TUNING.score.destroyPoints;
    this.spawnFloatText(e.x, e.y, '+' + TUNING.score.destroyPoints, '#ffd76a');
    this.spawnBurst(e.x, e.y, e.kind === 'enemy' ? 0xff9a6a : 0x9be36a);
    this.cameras.main.shake(90, 0.005);
  }

  spawnBurst(x, y, color) {
    for (let i = 0; i < 7; i++) {
      const p = this.add.rectangle(x, y, 7, 7, color).setDepth(50);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-70, 70),
        y: y + Phaser.Math.Between(-70, 70),
        alpha: 0, angle: Phaser.Math.Between(-180, 180),
        duration: 420, ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  spawnFloatText(x, y, text, color) {
    const t = makeText(this, x, y, text, {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '20px', color, fontStyle: 'bold',
      stroke: '#0b2233', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: t, y: y - 46, alpha: 0,
      duration: 620, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  /* ---------------------------------------------------------------------
   *  受伤 / 死亡
   * ------------------------------------------------------------------- */
  damagePlayer() {
    if (this.state !== 'playing') return;
    if (this.invincible > 0) return;

    this.health--;
    this.game.audioController.playSfx('hurt');
    this.invincible = TUNING.health.invincibleTime;

    this.cameras.main.shake(200, 0.014);
    this.updateHealthUI();

    this.tweens.add({
      targets: this.playerSprite,
      alpha: 0.2, duration: 110, yoyo: true,
      repeat: Math.max(1, Math.floor(TUNING.health.invincibleTime / 0.22)),
      onComplete: () => this.playerSprite.setAlpha(1),
    });

    if (this.health <= 0) this.gameOver();
  }

  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.game.audioController.playSfx('fail');

    this.tweens.add({
      targets: this.playerSprite,
      y: GROUND_Y - 12, angle: 100, alpha: 0.55,
      duration: 720, ease: 'Quad.easeIn',
    });

    this.cameras.main.flash(220, 255, 90, 90);
    this.cameras.main.shake(300, 0.02);

    this.time.delayedCall(900, () => {
      this.scene.pause();
      this.scene.launch('GameOverScene', {
        score: Math.floor(this.score),
        character: this.charKey,
      });
    });
  }

  /* ---------------------------------------------------------------------
   *  暂停
   * ------------------------------------------------------------------- */
  togglePause() {
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    if (this.paused) {
      this.pauseOverlay.setAlpha(0);
      this.tweens.add({ targets: this.pauseOverlay, alpha: 1, duration: 150 });
    }
  }

  /* ---------------------------------------------------------------------
   *  生物群系切换
   * ------------------------------------------------------------------- */
  updateBiome(dt) {
    if (this.transitioning) return;

    this.biomeTimer += dt;
    if (this.biomeTimer < this.biome.duration) return;

    // 触发切换
    this.biomeTimer = 0;
    this.transitioning = true;

    const camera = this.cameras.main;
    const fadeOut = TUNING.biome.fadeOutTime;
    const fadeIn = TUNING.biome.fadeInTime;

    // 淡出 → 换群系 → 淡入
    camera.fadeOut(fadeOut, 0, 0, 0);

    this.time.delayedCall(fadeOut, () => {
      // 循环切换
      this.biomeIndex = (this.biomeIndex + 1) % BIOMES.length;
      this.biome = BIOMES[this.biomeIndex];
      this.game.audioController.setBiome(this.biome.id);

      // 应用新群系视觉
      this.bgManager.applyBiome(this.biome, true);

      // Replace existing obstacle materials without touching their geometry or motion.
      for (const e of this.entities) {
        if (!e.dead && e.applyBiome) e.applyBiome(this.biome);
      }

      // 显示群系名称飘字
      this.showBiomeTitle(this.biome.name);

      camera.fadeIn(fadeIn, 0, 0, 0);

      this.time.delayedCall(fadeIn, () => {
        this.transitioning = false;
      });
    });
  }

  /** 群系名称飘字（画面中央偏上） */
  showBiomeTitle(name) {
    const t = makeText(this, GAME_W / 2, GAME_H * 0.32, name, {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '56px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#12314a', strokeThickness: 10,
    }).setOrigin(0.5).setDepth(250).setAlpha(0);

    this.tweens.add({
      targets: t, alpha: 1, y: GAME_H * 0.30,
      duration: 320, ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: t, alpha: 0, y: GAME_H * 0.26,
          duration: 900, delay: 900, ease: 'Quad.easeIn',
          onComplete: () => t.destroy(),
        });
      },
    });
  }

  /* ---------------------------------------------------------------------
   *  UI
   * ------------------------------------------------------------------- */
  createUI() {
    this.scoreText = makeText(this, 24, 18, '分数 0', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#12314a', strokeThickness: 6,
    }).setDepth(100);

    this.biomeText = makeText(this, 24, 54, '平原', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '16px', color: '#dff3ff',
      stroke: '#12314a', strokeThickness: 4,
    }).setDepth(100);

    // 红心贴图 + 计数式生命值显示（❤ ×N）
    if (!this.textures.exists('tex_heart')) {
      const g = makeGfx(this);
      const S = 32;
      g.fillStyle(0xff4d4d, 1);
      g.fillCircle(S * 0.30, S * 0.30, S * 0.30);
      g.fillCircle(S * 0.70, S * 0.30, S * 0.30);
      g.fillTriangle(S * 0.02, S * 0.42, S * 0.98, S * 0.42, S * 0.50, S * 0.98);
      g.fillStyle(0xff8a8a, 1);
      g.fillCircle(S * 0.24, S * 0.22, S * 0.10);
      bake(g, 'tex_heart', S, S);
    }

    this.heartIcon = this.add.sprite(46, 96, 'tex_heart').setDepth(100);
    this.heartText = makeText(this, 70, 96, '×' + this.health, {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '30px', color: '#ff6b6b', fontStyle: 'bold',
      stroke: '#12314a', strokeThickness: 6,
    }).setOrigin(0, 0.5).setDepth(101);

    const barW = 130, barX = GAME_W - 24 - barW, barY = 30;

    this.add.rectangle(barX + barW / 2, barY, barW, 18, 0x12314a, 0.85)
      .setStrokeStyle(3, 0x8fd3ff).setDepth(100);

    this.dashBar = this.add.rectangle(barX + 2, barY, barW - 4, 10, 0x4fd1ff)
      .setOrigin(0, 0.5).setDepth(101);

    makeText(this, barX + barW / 2, barY + 24, '冲刺 [空格]', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '14px', color: '#dff3ff',
      stroke: '#12314a', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(100);
  }

  updateHealthUI() {
    this.heartText.setText('×' + this.health);
  }

  updateUI() {
    this.scoreText.setText('分数 ' + Math.floor(this.score));
    this.biomeText.setText(this.biome.name);

    const ready = this.dashCooldown <= 0;
    const ratio = ready ? 1 : 1 - (this.dashCooldown / (TUNING.dash.cooldown * this.charCfg.dashCdMul));
    this.dashBar.setScale(Phaser.Math.Clamp(ratio, 0, 1), 1);
    this.dashBar.setFillStyle(ready ? 0x4fd1ff : 0x2b6b8a);
  }

  createPauseOverlay() {
    const bg = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x06121c, 0.62)
      .setDepth(300);

    const t1 = makeText(this, GAME_W / 2, GAME_H / 2 - 34, '已暂停', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '54px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#12314a', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(301);

    const t2 = makeText(this, GAME_W / 2, GAME_H / 2 + 2, '按 P 继续', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '22px', color: '#9fd8ff',
    }).setOrigin(0.5).setDepth(301);

    const restart = makeButton(this, GAME_W / 2 - 110, GAME_H / 2 + 92, '重新开始', () => {
      this.scene.stop('GameScene');
      this.scene.start('GameScene', { character: this.charKey });
    }, { width: 190, height: 58, color: 0x2e7d32, fontSize: '22px' });

    const toMenu = makeButton(this, GAME_W / 2 + 110, GAME_H / 2 + 92, '返回主菜单', () => {
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    }, { width: 190, height: 58, color: 0x37474f, fontSize: '22px' });

    this.pauseOverlay = this.add.container(0, 0, [bg, t1, t2, restart.bg, restart.txt, toMenu.bg, toMenu.txt])
      .setDepth(300).setVisible(false);
  }

  /* ---------------------------------------------------------------------
   *  主循环
   * ------------------------------------------------------------------- */
  update(time, delta) {
    const dt = Math.min(delta / 1000, 1 / 30);

    if (this.paused || this.state !== 'playing') return;

    if (this.invincible > 0) this.invincible -= dt;

    this.updateDifficulty(dt);     // 难度 / 卷轴 / 分数
    this.updatePlayerPhysics(dt);  // 风筝物理
    this.bgManager.update(dt, this.scrollSpeed);
    this.updateBiome(dt);          // 群系切换计时
    this.spawnManager.update(dt);  // 生成
    this.updateEntities(dt);
    this.checkCollisions();
    this.cleanupEntities();
    this.updateUI();
  }
}

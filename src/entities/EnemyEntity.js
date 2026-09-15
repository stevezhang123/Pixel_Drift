"use strict";

/* 敌人（直升机） */

class EnemyEntity extends Entity {
  constructor(scene, x, y, opts = {}) {
    // 1.8x visual size and collision box make the helicopter easier to dash through.
    super(scene, 'enemy', x, y, 'tex_enemy', 57.6, 43.2);

    this.baseY = y;
    this.phase = Math.random() * Math.PI * 2;
    this.amp = opts.amp || 45;
    this.trackSpeed = opts.trackSpeed || 0.5;

    this.breakable = true;
  }

  update(dt, scrollSpeed) {
    this.phase += dt * 3;
    const target = this.scene.playerY;
    this.baseY = Phaser.Math.Linear(this.baseY, target, dt * this.trackSpeed);
    this.y = this.baseY + Math.sin(this.phase) * this.amp;
    this.x -= scrollSpeed * dt;

    this.sprite.setPosition(this.x, this.y);
    this.sprite.setRotation(Math.sin(this.phase * 3) * 0.06);
  }
}

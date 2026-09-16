"use strict";

/* 绿宝石 */

class EmeraldEntity extends Entity {
  constructor(scene, x, y) {
    super(scene, 'emerald', x, y, 'tex_emerald', 30, 30);
    this.baseY = y;
    this.phase = Math.random() * Math.PI * 2;
    this.lethal = false;
  }

  update(dt, scrollSpeed) {
    this.phase += dt * 4;
    this.y = this.baseY + Math.sin(this.phase) * 4;
    this.x -= scrollSpeed * dt;

    this.sprite.setPosition(this.x, this.y);
    const s = (1 + Math.sin(this.phase) * 0.10) * 1.5;
    this.sprite.setScale(s, s);
  }
}

"use strict";

/* 蝙蝠：快速、小范围内上下翻飞，并带轻微左右抖动。 */

class BatEntity extends Entity {
  constructor(scene, x, y, opts = {}) {
    super(scene, 'enemy', x, y, 'tex_bat', 43.2, 28.8);

    this.baseY = y;
    this.baseX = x;
    this.phase = Math.random() * Math.PI * 2;
    this.amp = opts.amp || 30;      // 小范围
    this.speed = opts.speed || 6;   // 快速

    this.breakable = true;
  }

  update(dt, scrollSpeed) {
    this.phase += dt * this.speed;
    this.y = this.baseY + Math.sin(this.phase) * this.amp;
    this.baseX -= scrollSpeed * dt;
    this.x = this.baseX + Math.sin(this.phase * 1.6) * 12;

    this.sprite.setPosition(this.x, this.y);
    this.sprite.setRotation(Math.sin(this.phase) * 0.25);
  }
}

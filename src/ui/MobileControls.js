"use strict";

class MobileControls {
  constructor(game) {
    this.game = game;
    this.root = document.querySelector('#mobile-controls');
    this.button = document.querySelector('#mobile-dash');
    this.label = document.querySelector('#mobile-dash-state');
    this.touchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    this.button.addEventListener('pointerdown', event => {
      event.preventDefault();
      event.stopPropagation();
      if (!this.canDash()) return;
      this.game.audioController.unlock();
      this.scene.tryDash();
      this.update();
    });
    this.onStep = () => this.update();
    game.events.on('poststep', this.onStep);
    game.events.once('destroy', () => game.events.off('poststep', this.onStep));
  }

  bind(scene) {
    this.scene = scene;
    this.root.hidden = !this.touchDevice;
    document.documentElement.classList.toggle('mobile-controls-active', this.touchDevice);
    this.game.scale.getParentBounds();
    this.game.scale.refresh();
    this.update();
  }

  unbind(scene) {
    if (this.scene !== scene) return;
    this.scene = null;
    this.root.hidden = true;
    document.documentElement.classList.remove('mobile-controls-active');
    this.game.scale.getParentBounds();
    this.game.scale.refresh();
  }

  canDash() {
    return this.touchDevice && this.scene && this.scene.sys.isActive()
      && this.scene.state === 'playing' && !this.scene.paused && !this.scene.transitioning
      && this.scene.dashTimer <= 0 && this.scene.dashCooldown <= 0 && !(this.scene.dashLockTimer > 0);
  }

  update() {
    if (!this.touchDevice || !this.scene) return;
    this.button.disabled = !this.canDash();
    const cooldown = this.scene.dashCooldown;
    this.label.textContent = this.scene.dashLockTimer > 0 ? '禁冲刺 ' + this.scene.dashLockTimer.toFixed(1) + ' 秒'
      : this.scene.dashTimer > 0 ? '冲刺中' : cooldown > 0 ? cooldown.toFixed(1) + ' 秒'
      : this.button.disabled ? '暂停' : '就绪';
  }
}

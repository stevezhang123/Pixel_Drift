"use strict";

/* =========================================================================
 * [I] BootScene —— 加载素材、注册动画、初始化音频与设置
 * ========================================================================= */

class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    ArtAssets.preload(this);
  }

  create() {
    TextureFactory.build(this);
    this.createAnimations();
    ArtAssets.createAnimations(this);
    this.game.audioController = new AudioController();
    this.game.settingsUI = new SettingsUI(this.game, this.game.audioController);
    this.game.tutorialUI = new TutorialUI(this.game, this.game.audioController);
    this.game.events.once('destroy', () => this.game.audioController.destroy());
    this.scene.start('MenuScene');
  }

  createAnimations() {
    Object.keys(CHARACTERS).forEach(key => {
      if (this.anims.exists('fly_' + key)) return;
      this.anims.create({
        key: 'fly_' + key,
        frames: [
          { key: `tex_player_${key}_0` },
          { key: `tex_player_${key}_1` },
        ],
        frameRate: 9,
        repeat: -1,
      });
    });
  }
}

"use strict";

/* =========================================================================
 * [I] MenuScene —— 主菜单
 * ========================================================================= */

class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }

  create() {
    this.game.audioController.setBiome('plain');
    this.game.settingsUI.showMenuAudio(true);
    this.game.tutorialUI.showButton(true);
    this.events.once('shutdown', () => {
      this.game.settingsUI.showMenuAudio(false);
      this.game.tutorialUI.showButton(false);
    });
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;

    this.cameras.main.setBackgroundColor('#87ceeb');
    this.cameras.main.fadeIn(300);

    this.bgManager = new BackgroundManager(this);
    this.bgManager.applyBiome(BIOMES[0], true);
    this.bgManager.bgFar.setDepth(-2);
    this.bgManager.ground.setDepth(-1);

    const title = makeText(this, cx, cy - 130, '像素飘流', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '76px', color: '#ffffff', fontStyle: 'bold',
      stroke: '#1b3a57', strokeThickness: 10,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scaleX: 1.04, scaleY: 1.04,
      duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    makeText(this, cx, cy - 62, 'P I X E L   G L I D E R', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '20px', color: '#dff3ff',
      stroke: '#1b3a57', strokeThickness: 4,
    }).setOrigin(0.5);

    const demo = this.add.sprite(cx - 210, cy - 20, 'tex_player_blue_0')
      .setScale(3 * ArtAssets.playerScale).setDepth(20);
    demo.play('fly_blue');
    this.tweens.add({
      targets: demo, y: cy - 50,
      duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const btn = makeButton(this, cx - 140, cy + 130, '进入游戏', () => {
      this.cameras.main.fadeOut(260, 20, 32, 44);
      this.time.delayedCall(280, () => this.scene.start('CharacterSelectScene'));
    }, { width: 260, height: 70, color: 0x2e7d32, fontSize: '30px' });

    this.tweens.add({
      targets: [btn.bg, btn.txt],
      scaleX: 1.05, scaleY: 1.05,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // 退出游戏：点击后关闭当前页面
    makeButton(this, cx + 140, cy + 130, '退出游戏', () => {
      window.close();
    }, { width: 260, height: 70, color: 0xb71c1c, fontSize: '30px' });

    makeText(this, cx, GAME_H - 34, '空格 = 冲刺    鼠标/触摸 = 上升    P = 暂停', {
      fontFamily: '"Courier New", Consolas, monospace',
      fontSize: '16px', color: '#e8f6ff',
      stroke: '#1b3a57', strokeThickness: 4,
    }).setOrigin(0.5);
  }
}

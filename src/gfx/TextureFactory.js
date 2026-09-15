"use strict";

/* =========================================================================
 * [E] 占位素材工厂
 *  - 全部贴图都用 Graphics 程序化生成，项目零外部素材依赖。
 *  - 后期替换真实 sprite 时：
 *    1) 把图片放进 assets/（命名见 assets/README.md）
 *    2) 在 BootScene.preload() 中 this.load.image(key, url)
 *    3) 注释掉下方对应 makeXxx 方法
 * ========================================================================= */

const TextureFactory = {

  build(scene) {
    // The requested scenery, obstacles, enemies and shots are loaded from PNGs.
    // Keep only the player and pickups, which are outside this art replacement.
    this.makePlayers(scene);
    //this.makeEmerald(scene);
    //this.makeLifeCrystal(scene);
  },

  /* 远景云层：480 x 260，白-灰系（可染色） */
  makeClouds(scene) {
    const W = 480, H = 260;
    const g = makeGfx(scene);
    const clouds = [
      [ 30,  70, 64, 16], [ 40,  54, 40, 16],
      [190,  40, 72, 16], [206,  24, 40, 16],
      [330, 100, 56, 16], [344,  84, 32, 16],
      [120, 160, 88, 16], [142, 144, 48, 16],
      [290, 190, 64, 16], [306, 174, 36, 16],
    ];
    clouds.forEach(([x, y, w, h]) => {
      g.fillStyle(0xffffff, 0.75);
      g.fillRect(x, y, w, h);
    });
    bake(g, 'tex_clouds', W, H);
  },

  /* 近景山丘：480 x 200 */
  makeHills(scene) {
    const W = 480, H = 200;
    const g = makeGfx(scene);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(60,  H, 96);
    g.fillCircle(230, H, 128);
    g.fillCircle(410, H, 104);
    g.fillStyle(0xd8d8d8, 1);
    g.fillCircle(150, H, 84);
    g.fillCircle(330, H, 100);
    bake(g, 'tex_hills', W, H);
  },

  /* 地面：128 x 64 */
  makeGround(scene) {
    const W = 128, H = 64;
    const g = makeGfx(scene);
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, W, H);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(10, 26, 10, 7); g.fillRect(44, 40, 12, 7);
    g.fillRect(78, 22, 10, 7); g.fillRect(100, 46, 12, 7);
    g.fillRect(24, 50, 10, 6); g.fillRect(62, 18, 8, 6);
    bake(g, 'tex_ground', W, H);
  },

  /* 天花板：128 x 64（封顶群系时显示，可染色） */
  makeCeiling(scene) {
    const W = 128, H = 64;
    const g = makeGfx(scene);
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, W, H);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(10, 4, 10, 7); g.fillRect(44, 8, 12, 7);
    g.fillRect(78, 2, 10, 7); g.fillRect(100, 6, 12, 7);
    g.fillRect(24, 10, 10, 6); g.fillRect(62, 2, 8, 6);
    bake(g, 'tex_ceiling', W, H);
  },

  /* 玩家飞行器：每个角色 2 帧（20x20） */
  makePlayers(scene) {
    Object.keys(CHARACTERS).forEach(key => {
      const c = CHARACTERS[key];
      for (let frame = 0; frame < 2; frame++) {
        const S = 20;
        const g = makeGfx(scene);

        g.fillStyle(c.dark, 1);   g.fillRect(2, 2, 16, 16);
        g.fillStyle(c.color, 1);  g.fillRect(3, 3, 14, 14);
        g.fillStyle(c.accent, 1); g.fillRect(7, 6, 6, 5);
        g.fillStyle(0xffffff, 1); g.fillRect(8, 7, 2, 2);

        g.fillStyle(c.dark, 1);
        if (frame === 0) {
          g.fillRect(0, 8, 3, 7);  g.fillRect(17, 8, 3, 7);
        } else {
          g.fillRect(0, 5, 3, 7);  g.fillRect(17, 11, 3, 7);
        }
        g.fillStyle(0xffd76a, frame === 0 ? 1 : 0.7);
        g.fillRect(1, 17, 6, 3);

        bake(g, `tex_player_${key}_${frame}`, S, S);
      }
    });
  },

  /* 绿宝石：12 x 12 菱形 */
  makeEmerald(scene) {
    const S = 12;
    const g = makeGfx(scene);
    g.fillStyle(0x1f7a4d, 1);
    g.fillTriangle(S / 2, 0, S, S / 2, S / 2, S);
    g.fillTriangle(S / 2, 0, 0, S / 2, S / 2, S);
    g.fillStyle(0x2ecc71, 1);
    g.fillTriangle(S / 2, 2, S - 2, S / 2, S / 2, S - 2);
    g.fillTriangle(S / 2, 2, 2, S / 2, S / 2, S - 2);
    g.fillStyle(0x9df5c4, 1);
    g.fillRect(S / 2 - 1, 3, 2, 3);
    bake(g, 'tex_emerald', S, S);
  },

  /* 生命水晶：16 x 16 红色菱形 */
  makeLifeCrystal(scene) {
    const S = 16;
    const g = makeGfx(scene);
    g.fillStyle(0x7a1515, 1);
    g.fillTriangle(S / 2, 0, S, S / 2, S / 2, S);
    g.fillTriangle(S / 2, 0, 0, S / 2, S / 2, S);
    g.fillStyle(0xff4d4d, 1);
    g.fillTriangle(S / 2, 2, S - 2, S / 2, S / 2, S - 2);
    g.fillTriangle(S / 2, 2, 2, S / 2, S / 2, S - 2);
    g.fillStyle(0xffb3b3, 1);
    g.fillRect(S / 2 - 1, 3, 2, 3);
    bake(g, 'tex_life', S, S);
  },

  /* 墙式障碍：64 x 64 砖块 */
  makeWall(scene) {
    const S = 64;
    const g = makeGfx(scene);
    g.fillStyle(0xdddddd, 1); g.fillRect(0, 0, S, S);
    g.fillStyle(0xffffff, 1); g.fillRect(2, 2, S - 4, S - 4);
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(0, S / 2 - 2, S, 4);
    g.fillRect(S / 2 - 2, 0, 4, S / 2);
    g.fillRect(S / 4 - 2, S / 2, 4, S / 2);
    g.fillRect(S * 3 / 4 - 2, S / 2, 4, S / 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(4, 4, 8, 8); g.fillRect(38, 4, 8, 8);
    g.fillRect(20, 36, 8, 8); g.fillRect(48, 36, 8, 8);
    bake(g, 'tex_wall', S, S);
  },

  /* 浮空岛 72 x 40 */
  makeIsland(scene) {
    const W = 72, H = 40;
    const g = makeGfx(scene);
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, W, 10);
    g.fillStyle(0xeeeeee, 1); g.fillRect(0, 0, W, 4);
    g.fillStyle(0xdddddd, 1); g.fillRect(0, 10, W, H - 10);
    g.fillStyle(0xcccccc, 1);
    g.fillRect(6, 18, 12, 8); g.fillRect(28, 24, 14, 8); g.fillRect(50, 16, 12, 8);
    bake(g, 'tex_island', W, H);
  },

  /* 落石 32 x 32 岩块 */
  makeStone(scene) {
    const S = 32, R = S / 2;
    const g = makeGfx(scene);
    g.fillStyle(0x6a6a72, 1); g.fillCircle(R, R, R);
    g.fillStyle(0x8a8a94, 1); g.fillCircle(R, R, R - 5);
    g.fillStyle(0xa8a8b2, 1); g.fillCircle(R - 4, R - 4, 6);
    g.fillStyle(0x4a4a52, 1);
    g.fillRect(10, 18, 6, 3); g.fillRect(19, 11, 5, 3);
    g.fillRect(7, 8, 4, 3);   g.fillRect(22, 23, 5, 3);
    bake(g, 'tex_stone', S, S);
  },

  /* 岩浆球 30 x 30（保留原色） */
  makeLava(scene) {
    const S = 30, R = S / 2;
    const g = makeGfx(scene);
    g.fillStyle(0xd83a12, 1); g.fillCircle(R, R, R);
    g.fillStyle(0xff7a1a, 1); g.fillCircle(R, R, R - 4);
    g.fillStyle(0xffd23f, 1); g.fillCircle(R, R, R - 9);
    g.fillStyle(0xfff3b0, 1); g.fillCircle(R - 3, R - 3, 3);
    bake(g, 'tex_lava', S, S);
  },

  /* 藤蔓 32 x 32 */
  makeVine(scene) {
    const W = 32, H = 32;
    const g = makeGfx(scene);
    g.fillStyle(0xbbbbbb, 1); g.fillRect(0, 0, W, H);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(2, 2, 11, 13); g.fillRect(18, 5, 12, 11);
    g.fillRect(5, 18, 12, 12); g.fillRect(20, 20, 10, 10);
    g.fillStyle(0xffffff, 1);
    g.fillRect(4, 4, 4, 4); g.fillRect(22, 8, 4, 4);
    g.fillRect(8, 22, 4, 4); g.fillRect(24, 24, 4, 4);
    bake(g, 'tex_vine', W, H);
  },

  /* 敌人：直升机 34 x 26 */
  makeEnemy(scene) {
    const W = 34, H = 26;
    const g = makeGfx(scene);
    g.fillStyle(0x3b4450, 1); g.fillRect(5, 9, 24, 13);
    g.fillStyle(0x5b6675, 1); g.fillRect(7, 11, 20, 9);
    g.fillStyle(0xff4d4d, 1); g.fillRect(26, 13, 7, 5);
    g.fillStyle(0x2a3038, 1);
    g.fillRect(2, 3, 30, 3);
    g.fillRect(16, 6, 3, 3);
    g.fillRect(4, 23, 8, 3); g.fillRect(22, 23, 8, 3);
    g.fillStyle(0x9fd8ff, 1); g.fillRect(10, 13, 6, 5);
    bake(g, 'tex_enemy', W, H);
  },

  /* 多样敌人与子弹贴图 */
  makeEnemySprites(scene) {
    /* 蜜蜂 22x18 */
    {
      const S = 22, H = 18;
      const g = makeGfx(scene);
      g.fillStyle(0xffe066, 1); g.fillCircle(10, 10, 7);      // 身体
      g.fillStyle(0x2a2a2a, 1); g.fillRect(6, 8, 9, 4);        // 黑条纹
      g.fillStyle(0xd6f2ff, 1);
      g.fillCircle(2, 4, 4); g.fillCircle(19, 5, 4);           // 双翼
      g.fillStyle(0x2a2a2a, 1); g.fillCircle(14, 8, 1.4);      // 眼
      bake(g, 'tex_bee', S, 18);
    }

    /* 幻翼 30x22（暗色带烈焰尾） */
    {
      const W = 30, H = 22;
      const g = makeGfx(scene);
      g.fillStyle(0x1c2430, 1); g.fillCircle(20, 11, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(17, 8, 2); g.fillCircle(24, 8, 2);          // 眼
      g.fillStyle(0xff7a2a, 1); g.fillRect(0, 8, 12, 6);       // 烈焰尾
      g.fillStyle(0xffd76a, 1); g.fillRect(8, 9, 6, 4);
      bake(g, 'tex_phantom', W, H);
    }

    /* 蝙蝠 24x16 */
    {
      const W = 24, H = 16;
      const g = makeGfx(scene);
      g.fillStyle(0x241c28, 1);
      g.fillRect(9, 4, 7, 8);        // 身
      g.fillRect(4, 1, 4, 8); g.fillRect(16, 1, 4, 8);  // 翅
      g.fillStyle(0x8a2a2a, 1);
      g.fillCircle(10, 6, 1.4); g.fillCircle(14, 6, 1.4);       // 眼
      bake(g, 'tex_bat', W, H);
    }

    /* 荧光怪 34x30（绿色发光眼） */
    {
      const W = 34, H = 30;
      const g = makeGfx(scene);
      g.fillStyle(0x3a5a3a, 1); g.fillCircle(17, 16, 13);
      g.fillStyle(0x66ff88, 1);
      g.fillCircle(12, 13, 4); g.fillCircle(23, 13, 4);         // 发光眼
      g.fillStyle(0xd6ffd6, 1);
      g.fillRect(15, 20, 6, 3);
      bake(g, 'tex_glow', W, H);
    }

    /* 恶魂 40x34（白色鬼面） */
    {
      const W = 45, H = 38;
      const g = makeGfx(scene);
      g.fillStyle(0xf4f4f4, 1); g.fillCircle(20, 18, 16);
      g.fillStyle(0x9a9a9a, 1); g.fillRect(12, 14, 9, 10); g.fillRect(22, 14, 9, 10); // 眼窝
      g.fillStyle(0x333333, 1); g.fillCircle(16, 18, 3); g.fillCircle(26, 18, 3);     // 眼
      g.fillStyle(0x555555, 1); g.fillRect(18, 24, 5, 2);                              // 嘴
      g.fillStyle(0xcccccc, 1); g.fillCircle(10, 2, 6); g.fillCircle(3, 12, 4);       // 触须
      bake(g, 'tex_ghast', W, H);
    }

    /* 火球 20x20 */
    {
      const S = 20;
      const g = makeGfx(scene);
      g.fillStyle(0xff6a2a, 1); g.fillCircle(10, 10, 9);
      g.fillStyle(0xffd76a, 1); g.fillCircle(10, 10, 5);
      g.fillStyle(0xfff2c0, 1); g.fillCircle(8, 8, 2.4);
      bake(g, 'tex_fireball', S, S);
    }

    /* 荧光怪子弹 14x10 */
    {
      const W = 14, H = 10;
      const g = makeGfx(scene);
      g.fillStyle(0x8affc0, 1); g.fillCircle(7, 5, 7);
      g.fillStyle(0xd6ffd6, 1); g.fillCircle(8, 5, 4);
      bake(g, 'tex_bullet', W, H);
    }
  },
};

"use strict";

/* =========================================================================
 * [C] 生物群系数据
 * ========================================================================= */

class Biome {
  constructor(cfg) {
    this.id = cfg.id;
    this.name = cfg.name;
    this.skyColor = cfg.skyColor;
    this.cloudTint = cfg.cloudTint;
    this.hillTint = cfg.hillTint;
    this.groundTint = cfg.groundTint;
    this.grassTint = cfg.grassTint;
    this.wallTint = cfg.wallTint || 0xdddddd;
    this.obstacleWeights = cfg.obstacleWeights;
    this.spawnIntervalMul = cfg.spawnIntervalMul !== undefined ? cfg.spawnIntervalMul : 1;
    this.obstacleWeightBonus = cfg.obstacleWeightBonus || 0;
    this.capped = cfg.capped || false;

    /* ---- 新增：敌人 / 抛射物 独立生成配置 ---- */
    // 槽位 = 数组中每项 { type, weight }，生成时按 weight 加权随机选类型。
    // 该生态下敌人/抛射物可选哪些种类、占比如何，就由各自槽位决定。
    this.enemySlots = cfg.enemySlots || [];
    this.projectileSlots = cfg.projectileSlots || [];
    this.enemyInterval = cfg.enemyInterval || TUNING.spawn.enemyInterval;
    this.projectileInterval = cfg.projectileInterval || TUNING.spawn.projectileInterval;

    this.duration = cfg.duration || TUNING.biome.duration;
  }
}

const BIOMES = [
  // 1. 平原 —— 最温和，无抛射物
  new Biome({
    id: 'plain', name: '平原',
    skyColor: 0x87ceeb,
    cloudTint: 0xffffff,
    hillTint: 0x7aae54,
    groundTint: 0x9c7040,
    grassTint: 0x5db03c,
    wallTint: 0xcfcfcf,
    obstacleWeights: { wall: 6, free: 3, vine: 1 },
    enemySlots: [{ type: 'bee', weight: 2 }, { type: 'bat', weight: 1 }],
    projectileSlots: [],
    enemyInterval: 4.5,
    spawnIntervalMul: 1.30,
    obstacleWeightBonus: -0.10,
  }),

  // 2. 海边 —— 开阔，有熔岩抛射
  new Biome({
    id: 'beach', name: '海边',
    skyColor: 0x6ec6f5,
    cloudTint: 0xffffff,
    hillTint: 0x3a9ad9,
    groundTint: 0xe0c88a,
    grassTint: 0xf2dfa8,
    wallTint: 0xe8d9a0,
    obstacleWeights: { wall: 5, free: 4, vine: 1 },
    enemySlots: [{ type: 'bee', weight: 2 }, { type: 'bat', weight: 2 }, { type: 'heli', weight: 1 }],
    projectileSlots: [],
    enemyInterval: 3.6,
    projectileInterval: 3.4,
    spawnIntervalMul: 1.20,
    obstacleWeightBonus: -0.06,
  }),

  // 3. 森林 —— 藤蔓多，洞顶落石
  new Biome({
    id: 'forest', name: '森林',
    skyColor: 0x7ab87a,
    cloudTint: 0xd8f0d8,
    hillTint: 0x3d6b30,
    groundTint: 0x5a4a2f,
    grassTint: 0x3d8a3d,
    wallTint: 0x6f8a4a,
    obstacleWeights: { wall: 4, free: 3, vine: 3 },
    enemySlots: [{ type: 'bee', weight: 2 }, { type: 'bat', weight: 1 }, { type: 'phantom', weight: 1 }],
    projectileSlots: [{ type: 'stone', weight: 2 }],
    enemyInterval: 3.8,
    projectileInterval: 3.2,
    spawnIntervalMul: 1.10,
    obstacleWeightBonus: -0.02,
  }),

  // 4. 洞穴 —— 落石为主，封闭环境
  new Biome({
    id: 'cave', name: '洞穴',
    skyColor: 0x2a2a3e,
    cloudTint: 0x4a4a5c,
    hillTint: 0x3a3a4a,
    groundTint: 0x5a5a5a,
    grassTint: 0x6a6a6a,
    wallTint: 0x9a9a9a,
    obstacleWeights: { wall: 6, free: 2, vine: 2 },
    enemySlots: [{ type: 'bat', weight: 2 }, { type: 'phantom', weight: 1 }, { type: 'glow', weight: 1 }],
    projectileSlots: [{ type: 'stone', weight: 2 }, { type: 'lava', weight: 1 }],
    enemyInterval: 3.2,
    projectileInterval: 2.8,
    spawnIntervalMul: 0.90,
    obstacleWeightBonus: 0.06,
    capped: true,
  }),

  // 5. 下界荒地 —— 熔岩弹幕密集
  new Biome({
    id: 'nether', name: '下界荒地',
    skyColor: 0x6b1414,
    cloudTint: 0x8a2020,
    hillTint: 0x4a1010,
    groundTint: 0x5a1a1a,
    grassTint: 0x8a2525,
    wallTint: 0x8a3030,
    obstacleWeights: { wall: 4, free: 4, vine: 1 },
    enemySlots: [{ type: 'ghast', weight: 1 }, { type: 'glow', weight: 2 }, { type: 'phantom', weight: 1 }],
    projectileSlots: [{ type: 'lava', weight: 1 }],
    enemyInterval: 2.8,
    projectileInterval: 2.8,
    spawnIntervalMul: 0.85,
    obstacleWeightBonus: 0.08,
    capped: true,
  }),

  // 6. 玄武岩三角洲 —— 最难，混合抛射物
  new Biome({
    id: 'basalt', name: '玄武岩三角洲',
    skyColor: 0x2a2a35,
    cloudTint: 0x4a4a5a,
    hillTint: 0x33333f,
    groundTint: 0x3a3a42,
    grassTint: 0x55556a,
    wallTint: 0x6a6a78,
    obstacleWeights: { wall: 4, free: 4, vine: 1 },
    enemySlots: [{ type: 'ghast', weight: 1 }, { type: 'glow', weight: 2 }, { type: 'phantom', weight: 1 }],
    projectileSlots: [ { type: 'lava', weight: 3 }],
    enemyInterval: 2.6,
    projectileInterval: 2.5,
    spawnIntervalMul: 0.80,
    obstacleWeightBonus: 0.10,
    capped: true,
  }),
];

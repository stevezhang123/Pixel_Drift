"use strict";

/* =========================================================================
 * [A] 全局常量 & 可调参数
 * ========================================================================= */

const GAME_W = 960;
const GAME_H = 540;

const GROUND_H = 64;
const GROUND_Y = GAME_H - GROUND_H;   // 476

const PLAYER_X = 220;

/** ★★★ 核心可调参数（README 中逐一说明） ★★★ */
const TUNING = {

  /* ---------- 世界 / 卷轴滚动 ---------- */
  world: {
    baseScrollSpeed: 180,     // 基础滚动速度 px/s（前 accelStartTime 秒恒定）
    accelStartTime: 40,       // 开始加速的时间点（秒）。改成 120 即"2 分钟后加速"
    accelPerSecond: 5,        // 加速阶段每秒增加的速度 px/s（加速度）
    maxScrollSpeed: 480,      // 滚动速度上限 px/s
    bgFarFactor: 0.18,        // 远景云层视差系数
    bgNearFactor: 0.45,       // 近景山丘视差系数
  },

  /* ---------- 飞行物理（风筝手感） ---------- */
  flight: {
    gravity: 900,             // 重力加速度 px/s²（越小越飘）
    airDamp: 0.98,            // 风筝阻尼：每帧速度保留系数（越大滑翔越久）
    flapImpulse: 420,         // 每次点击的向上冲量 px/s
    flapSmoothing: 0.88,      // 冲量插值系数（1=瞬间提速，越小越"软"）
    maxUpSpeed: 430,          // 上升速度上限 px/s
    maxDownSpeed: 560,        // 下落速度上限 px/s
    windStrength: 55,         // 风力强度（垂直方向正弦扰动）
    windFrequency: 0.5,       // 风力变化频率 Hz
  },

  /* ---------- 冲刺 ---------- */
  dash: {
    cooldown: 0.5,            // 冷却时间（秒）
    duration: 0.32,           // 冲刺持续时间（秒）
    speedMultiplier: 2.6,     // 冲刺期间卷轴速度倍率
    forwardOffset: 46,        // 冲刺时飞行器向右位移（视觉反馈）
  },

  /* ---------- 生成系统 ---------- */
  spawn: {
    baseInterval: 1.6,       // 初始生成间隔（秒）
    minInterval: 0.80,        // 最小生成间隔（难度上限）
    intervalDecay: 0.025,     // 每秒缩短的生成间隔（秒/秒）
    obstacleWeightStart: 0.50,// 初始"生成障碍物"的概率
    obstacleWeightMax: 0.80,  // 障碍物概率上限
    obstacleWeightGrow: 0.005,// 每秒增长的概率

    enemyInterval: 3.2,       // ★ 敌人独立生成的基础间隔（秒），可被群系覆盖
    projectileInterval: 3.0,  // ★ 抛射物独立生成的基础间隔（秒），可被群系覆盖
  },

  /* ---------- 分数 ---------- */
  score: {
    distancePoints: 0.08,     // 每前进 1px 获得多少分
    emeraldPoints: 10,        // 每颗绿宝石分数
    destroyPoints: 15,        // 击碎脆弱障碍 / 击杀敌人奖励
  },

  /* ---------- 生命 ---------- */
  health: {
    max: 3,                   // 初始生命值 / 生命上限起点
    maxStorage: 6,            // ★ 硬上限：任何情况下生命上限都不得超过 6
    invincibleTime: 1.5,      // 受伤后的无敌时间（秒）
  },

  /* ---------- 生物群系 ---------- */
  biome: {
    duration: 30,             // 每个群系持续秒数
    fadeOutTime: 320,         // 切换过场：淡出时长（毫秒）
    fadeInTime: 320,          // 切换过场：淡入时长（毫秒）
  },
};

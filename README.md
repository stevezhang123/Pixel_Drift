# 像素飘流 · Pixel Glider

一个用 **JavaScript + Phaser 3** 写的 2D 横版飞行躲避小游戏。原始版本是单个 HTML 大文件，现已拆分为 `index.html` + `src/` 模块目录 + `assets/` 素材目录。

## 运行

直接双击项目根目录的 `index.html` 即可启动。Phaser、图片、背景音乐和音效均已随项目打包，不需要联网，也不需要安装 npm 依赖或执行构建。

开发和调试时也可以启动本地 HTTP 服务：

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

打开 [游戏](http://127.0.0.1:8080/index.html) 或 [六群系美术预览](http://127.0.0.1:8080/art-preview.html)。

`index.html` 用普通 `<script>`（非 ES Module）按依赖顺序加载 `src/`。`vendor/phaser.min.js` 是固定版本的 Phaser 3.70.0；`assets/offline.js` 把运行时图片和音频保存为 data URL，避开 `file://` 下的 XHR 与跨域限制。修改运行时素材后执行 `node tools/pack-assets.cjs` 更新离线包。

> 也可以使用 VS Code Live Server 或部署到静态托管。

### 加载顺序（重要）

各文件的顶层 `const` / `class` 处于同一个全局词法作用域，互相直接可见——这也是不需要 import/export 的原因。代价是**顺序不能乱**：被依赖的文件必须排在依赖它的文件前面。`index.html` 中每个 `<script>` 上方都注明了该文件依赖谁。

新增模块时请插到正确位置；`src/main.js` 必须始终是最后一个，因为它在加载时就会执行 `new Phaser.Game()`。


## 目录结构

```
index.html                     页面外壳：加载本地 Phaser、离线素材包和 src 脚本
vendor/                        Phaser 3.70.0 与许可证
assets/                        PNG 美术资源、样板图与生成提示词
  offline.js                   可供 file:// 使用的运行时图片和音频包
art-preview.html               独立美术预览：六群系、碰撞框与运行时回归检查
src/
  main.js                      [L] 入口：PhaserConfig + new Phaser.Game()
  style.css                    页面样式
  config/
    constants.js               [A] 画布尺寸 / 地面高度 / ★ TUNING 全部可调参数
    characters.js              [B] CHARACTERS 三个角色数值
    biomes.js                  [C] Biome 类 + BIOMES 六个生物群系
  utils/
    helpers.js                 [D] makeGfx / bake / shadeColor / makeButton
  gfx/
    TextureFactory.js          [E] 保留的旧程序化素材参考
    ArtAssets.js               [E] PNG 加载清单、群系映射与怪物动画
    RenderQuality.js           [E] 高 DPI 画布、清晰文字和系统中文字体
  entities/                    [F] 实体系统（一文件一类）
    Entity.js                  基类：位置、速度、包围盒、回收
    WallEntity.js              墙式障碍
    FloaterEntity.js           自由障碍（浮空岛 / 漂浮岩浆）
    VineEntity.js              脆弱障碍（藤蔓，可被冲刺击碎）
    EnemyEntity.js             敌人（直升机会追踪玩家高度）
    ProjectileEntity.js        抛物线抛射物
    EmeraldEntity.js           绿宝石
  systems/
    BackgroundManager.js       [G] 六群系循环全景 + 独立滚动地面 / 洞顶
    SpawnManager.js            [H] 按生物群系权重生成障碍 / 宝石
    AudioController.js         [H] BGM、音效、音量和浏览器播放解锁
  ui/SettingsUI.js             音频开关及主菜单音量拖动条
  scenes/
    BootScene.js               [I] 生成贴图、注册 fly_* 动画
    MenuScene.js               [I] 主菜单
    CharacterSelectScene.js    [I] 选角界面
    GameScene.js               [J] 核心玩法主循环
    GameOverScene.js           [K] 结算界面
```

## 玩法

- **鼠标点击 / 触摸屏幕** —— 上升（风筝式物理，有惯性和风扰）
- **空格** —— 冲刺（短暂无敌，可击碎藤蔓和敌人、加分）
- **P** —— 暂停 / 继续

撞到墙体、浮空岛、岩浆会扣 1 点生命（受伤后 1.5 秒无敌，撞地也会扣血）。吃绿宝石 +10 分，冲刺击碎脆弱障碍 / 敌人 +15 分，飞行距离也计分。

每 30 秒切换一次生物群系（平原 → 海边 → 森林 → 洞穴 → 下界荒地 → 玄武岩三角洲，循环），不同群系的天空 / 地面配色、障碍类型权重、生成密度都不同，难度递增。前三个群系的障碍生成间隔分别放宽到 1.30×、1.20×、1.10×，同时降低障碍事件概率，让前期难度更平缓。

## 调参

所有可调数值集中在 **`src/config/constants.js` → `TUNING`**，每项都有中文注释：

- `TUNING.world` —— 卷轴速度、加速时间点（`accelStartTime`，改成 120 即 2 分钟后才开始加速）、视差系数
- `TUNING.flight` —— 重力、空气阻尼、拍翅冲量、风力
- `TUNING.dash` —— 冲刺冷却 / 时长 / 倍率
- `TUNING.spawn` —— 生成间隔衰减、障碍概率曲线
- `TUNING.score` —— 各类得分
- `TUNING.health` —— 生命上限、无敌时间
- `TUNING.biome` —— 群系持续时长、过场淡入淡出

角色数值在 `src/config/characters.js`，生物群系在 `src/config/biomes.js`。

## 替换美术资源

背景、墙体、脆弱障碍、浮岛、怪物、抛射物、拾取物和三色鹦鹉玩家均使用像素风 PNG。规格、材质对应关系、动画和验证方式见 [`assets/README.md`](assets/README.md)。

静态检查：`node tests/art-contract.cjs`。运行时检查：打开美术预览页的「资源与行为验证」，涵盖材质切换、原有碰撞框、恶魂发射时机、火球反弹速度和抛物线轨迹。

### 美术与幻翼修订

- 蜜蜂与发光鱿鱼的显示／碰撞尺寸均扩大两倍，分别为 70×50 和 68×60。
- 直升机和蝙蝠的显示／碰撞尺寸均扩大为原来的 1.8 倍，分别为 57.6×43.2 和 43.2×28.8。
- 幻翼从两侧中上部进场，冲刺穿过玩家列的中段高度；地图高速滚动不再抵消左侧进场的飞行。
- 六群系脆弱障碍换为 32×320 的细长贴图；墙面换为 64×64 的手绘像素材质，并配套边缘。
- 美术预览增加左右俯冲演示按钮；`node --test tests/art-fixes.cjs` 验证尺寸、进场、轨迹和回收。

## 鹦鹉与音频设置

- 三种自机参考团队提供的蓝、绿、红鹦鹉样板，采用 ImageGen 制作的展翅上扬／下拍两帧 PNG（每帧 40×40），以 9 帧/秒循环拍翼。贴图宽高较上一版扩大 1.6 倍，实机显示框从 32×32 变为 51.2×51.2；18×16 玩家碰撞框及角色参数保持不变，保留悬浮、飞行倾斜与冲刺残影。
- 主菜单右上角提供背景音乐和游戏音效音量拖动条；右下角「⚙ 设置」可以独立开关两类声音。音量与开关均自动保存到本机。
- 主菜单左下角提供「新手教程」，以一张图说明上升、下落、冲刺，以及冲刺可撞碎绿色藤蔓和敌人、不可撞碎石墙与浮岛的规则。
- 音效来自 `assets/样板音效/`：点击、冲刺、受伤、失败、收集绿宝石，以及仅直升机被冲刺击毁时播放的 `man.mp3`。
- 绿宝石与生命值拾取物使用 `assets/art/emerald.png` 和 `assets/art/life.png` 两张 16×16 像素贴图，显示及碰撞尺寸保持不变。
- 背景音乐连续循环播放 `assets/鹦鹉穿风.mp3`；六群系通过平滑调整高低频和音量区分氛围，不改变曲速、不重头播放。
- 首次点击或按键会解锁浏览器音频；音效使用同一个已解锁的音频上下文播放，避免游戏事件触发时被浏览器拦截。切到后台会暂停声音。
- 美术预览页新增三色鹦鹉与音频试听，群系按钮可用于对比音乐音色。逻辑测试：`node tests/audio-game.cjs`。
- 双击启动、开发服务和测试方法见 [本地测试指南](本地测试指南.md)。

## 显示清晰度

游戏逻辑尺寸保持 960×540，实际画布会根据窗口缩放和屏幕像素密度提高到最多 4 倍分辨率，再由相机保持原有坐标系。文字纹理使用相同分辨率绘制，并优先选择系统中文字体；PNG 继续使用最近邻像素渲染。因此在高分辨率和非整数缩放窗口下，文字与轮廓不会再由低分辨率画布直接拉伸。

## 自动检查

```powershell
node --test tests/*.cjs
node tools/pack-assets.cjs --check
```

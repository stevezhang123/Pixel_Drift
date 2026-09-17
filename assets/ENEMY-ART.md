# 新敌人与子弹美术

使用内置 ImageGen 制作，延续 Minecraft 方块轮廓与清晰像素着色。原图集保存在 `assets/source/new-enemies/`，运行时 PNG 保存在 `assets/art/`，由 `tools/import-enemy-art.cjs` 裁切导出。

| 文件 | 尺寸 | 用途 |
| --- | --- | --- |
| shulker / shulker_open / shulker_fire | 48×48 | 潜影贝闭壳、开壳、发射，随贴墙方向旋转 |
| helljelly / helljelly_1 | 48×56 | 暗红伞盖与熔火触须，4 帧/秒 |
| flowerslime / flowerslime_1 | 48×48 | 粉色方形胶体与花朵，6 帧/秒 |
| sticky / jellyfire / petal | 24×24 | 米色粘液、橙红火球、粉色花瓣弹 |

10 张 PNG 合计约 17 KiB，全部含透明通道。使用最近邻缩放、128 色调色板和清晰透明轮廓。同组动画统一裁切边界，避免逐帧独立裁切造成位置跳动。潜影贝以现有发射计时选择状态，其余两个敌人仅播放外观动画，碰撞框和移动／爆炸／减益逻辑不变。

## 生成提示词

共同约束：Minecraft-inspired polished pixel-art game sprite strip; genuine transparent alpha background; crisp square pixel clusters; rich hand-shaded block textures; equal square cells; no text, labels, grid, floor, external shadow or glow halo; readable at 24–56 pixels.

- **shulker.png**：Three equal cells in a horizontal row. Same purple shulker enemy, same camera, pixel scale, shell width and bottom anchor. Left closed purple cuboid shell with geometric rim and seam. Middle lid raised exposing beige cube head and two dark eyes. Right fully raised lid, exposed beige head firing with open mouth and warm cream highlight. Opens upward; slight three-quarter front view. Lavender highlights, dark violet crevices. No separate projectile.
- **helljelly.png**：Two equal cells, stable upper bell anchor. Cuboid dark burgundy umbrella bell with stepped rim, coral-red luminous fissures, warm orange core, five segmented ember-orange and dark-plum tentacles. Left tentacles spreading, right curling inward with gently contracted bell. Floating Nether jellyfish silhouette, not squid or ghast.
- **flowerslime.png**：Two equal cells. Same translucent pink cuboid slime, violet square eyes and tiny mouth, darker inner cube, small pink blossom with yellow center and green leaves on top. Left airborne elongated cube; right squashed wider cube. Rosy highlights and purple side shadows, same flower identity.
- **shots.png**：Three equal cells. Left beige sticky slime glob with dangling droplet, ivory highlights and caramel shadows. Middle compact orange-red fireball, pale yellow core and stepped flame tips. Right magenta-pink faceted seed enclosed by rose petals, pale pink highlights and plum edges. No long trails.

## 重建与测试

配置 Sharp 后执行 `node tools/import-enemy-art.cjs`，再执行 `node tools/pack-assets.cjs`。无需生成工具即可运行游戏。

打开根目录 `enemy-preview.html` 检查四向潜影贝、漂浮水母、史莱姆和子弹。测试命令：`node tests/new-enemies.cjs`、`node tests/art-contract.cjs`、`node tests/offline-start.cjs`。

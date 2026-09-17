# 第一批群系扩展：生成记录

使用内置 ImageGen；项目源图保存在 `assets/source/biome-expansion/`，运行时文件保存在 `assets/art/`。Sharp 仅完成技术导出，不程序化绘制景物。

## 参考来源

- 风格：现有 `art/background_forest.png` 与 `source/polished-walls.png`。
- 花开尖塔：团队 `花开尖塔样板/` 中的截图、粉色苔、十纹木；[绽花尖峰资料](https://www.mcmod.cn/item/404925.html)。
- 哭嚎炼狱：团队 `哀嚎炼狱样板/` 中的截图、皂石、哀嚎草；[哀嚎庭园资料](https://www.mcmod.cn/item/446534.html)。素材按用户指定的游戏名称命名。

## 提示词集

### background_end.png

Create a polished Minecraft-inspired PIXEL ART game background, landscape 1536x768, no text no borders no characters. THE END biome: immense dark violet void, subtle lavender mist, floating pale cream yellow-green porous endstone islands, very tall black obsidian square towers in distance, branching purple chorus plants on lowest islands. Side scrolling 2D game side view with atmospheric depth, distant objects muted. Central 65% of height is mostly open navigable sky, landscape detail predominantly bottom 20% with a few peripheral distant pillars. Crisp squared pixel clusters and rich shaded block textures, limited sophisticated palette, not smooth digital painting, match provided forest background's detailed pixel game aesthetic. Edges should be suitable for horizontal looping. No UI, no enemies, no dragon, no moon. Reference image is STYLE ONLY, change forest subject entirely to The End.

### background_snow.png

Use case stylized-concept. Create one polished Minecraft-inspired PIXEL ART 2D side-scrolling background 1536x768 landscape. SNOW FOREST biome. Dense distant snowy spruce forest, tiered cuboid branches with thick white snow, silver blue mist, icy blue shadows and dark teal needles, a few muted warm brown trunks. Delicate sparse square snowflakes. Foreground snowy ledges bottom 15%, tall pines at outer edges, central area mostly spacious pale winter haze with far silhouettes, readable flight corridor. Ref image STYLE ONLY: match its detailed square pixel textures, layered atmospheric depth, rich yet restrained shading and pixel game aesthetic. No characters animals enemies buildings text UI or border. No smooth painting or photorealism. Continuous forest across left/right suitable for horizontal looping.

### background_blossom.png

Create a polished Minecraft-inspired PIXEL ART 2D side scrolling background 1536x768 landscape. BLOSSOMING SPIRES modded END biome. Image1 subject reference: retain its pink lavender atmosphere, towering pale yellow-green porous endstone tapered pillars and floating upside-down spires, purple/pink moss shelves and broad pink flowering canopies on branching wood trunks, dangling violet vines. Image2 style reference: match its crisp blocky pixel texture, carefully shaded small square clusters and atmospheric depth, not screenshot photorealism. Compose for game: quiet open pink-lavender mist across middle 60%, small distant floating islands, foreground pale stone ledges and pink moss bottom 18%, larger spires and blossom trees mostly to sides. Ethereal soft luminous pink ambient lighting, muted distant silhouettes, brighter detailed edges. Sparse tiny square light motes. No UI text borders animals characters. All scenery, no game obstacles drawn across central flight path.

### background_wailing.png

Create polished Minecraft-inspired PIXEL ART 2D side scrolling background 1536x768 landscape for WAILING GARTH / WAILING INFERNO Nether biome. Image1 subject reference: gloomy blue-purple cavern, brown-red netherrack ceiling, dark charcoal soapstone huge rectangular CHAIN-LINK formations rising like stone arches, purple ground-cover grass with small teal tips, pale cream giant mushroom stems with dark red/brown umbrella caps. Soulsoil earthy ground. Image2 STYLE ONLY: matching richly shaded crisp pixel blocks, atmospheric layered depth. Central 60% height stays mostly open dark indigo-violet fog with dim distant pillars, largest mushroom trunks and stone chains at sides, lower 18% has blue-purple grass and stepped stone ledges, thin irregular cavern ceiling upper edge. Subtle cyan accents, soft violet reflected light, enough midtone clarity to distinguish landscape. No bright lava ocean, no swamp water, no green overworld forest. No mobs characters UI text border. Square pixel clusters, not smooth painting or photoreal screenshot.

### materials.png

Create one production PIXEL ART material texture atlas, exactly FOUR equal columns and TWO equal rows, landscape 1536x1024. Eight rectangular panels, touching with no gaps no border no labels no perspective, each panel fills its cell completely. Rich hand-shaded pixel rock textures matching reference image1 style. Exact cell contents left to right: TOP ROW: 1 pale creamy yellow-green porous END STONE, chunky angular pitted layered rocks; 2 frosty blue-gray snowy rock with small ice cracks and snowy highlights; 3 pale endstone with subtle violet mineral cracks, rosy seams, no grass cover; 4 dark charcoal gray SOAPSTONE with angular chunky relief and subdued violet reflected highlights, NOT lava. BOTTOM ROW: 1 pale endstone ground face with pale bright upper lip across first 12% of cell; 2 snowy stone ground face, white snow cap across upper 15%, blue ice below; 3 pink moss turf on pale endstone, rosy magenta moss cap across top 15% and short purple hanging moss fringe below, rest pale rock; 4 wailing ground: purple grass cap across upper15%, dark blue violet dirt and soapstone below, sparse tiny teal grass tips at top. All textures seamless left-to-right, top row also vertically tileable. Strong readable squared pixel clusters, faceted blocks, shadows and highlights. No photographic noise, no smooth gradients, no isolated cubes. Image2 soapstone color reference only, Image3 pink moss color reference only.

### vines.png

Create a game sprite atlas with EXACTLY FOUR separate long THIN vertical hanging obstacle sprites, evenly spaced in four columns on a genuinely TRANSPARENT alpha background. Square canvas 1024x1024. Each single sprite extends from y=40 to y=980, width ONLY70-90px, approximately 1:11 aspect. NO horizontal branching, no scenery, no labels, no shadows on background, no checkerboard baked in. All hang from top and taper downward. Left to right: 1 End biome: pale ivory yellow-green porous endstone stalactite, some thin violet chorus roots twisting around it, sharp lower tip; 2 snow forest: long blue-white faceted ice stalactite with a small snow cap at top, subtle crystal facets; 3 blossoming spires: one slender twisting purplish brown woody vine with vertically spaced SMALL pink-purple leaves, occasional tiny magenta flowers, elegant dangling root tip; 4 wailing Nether: one long tapered dark charcoal soapstone stalactite interwoven with purple roots and tiny violet grass tufts, muted teal accents, pointed bottom. Beautiful MC-inspired crisp hand shaded PIXEL ART, squared pixel edges and rich depth, not smooth illustration. Each has a continuous visible core entire length and restrained narrow silhouette, uniform comparable widths. Transparent outside the 4 silhouettes.

### islands.png

Create one production game sprite atlas with EXACTLY FOUR floating rock islands, arranged TWO columns TWO rows, each fully inside its equal cell, on genuinely TRANSPARENT alpha background. Canvas1536x1024. Each island wide low silhouette approx2:1, flat grassy/stone top with angular tapered bottom, side view with slightly visible top, no trees tall objects or background. Rich crisp hand-shaded Minecraft inspired PIXEL ART, square rock facets, deep shadow crevices, tiny detailed pixel highlights, restrained palettes. TOP LEFT: The End floating island, pale yellow cream green porous endstone with a few tiny purple chorus sprouts. TOP RIGHT: snow forest island, blue-gray stone and translucent blue ice bottom, thick white snow cap, three very short spruce grass tufts. BOTTOM LEFT: blossoming spires island, pale yellow-green endstone with violet shadows, pink magenta moss turf, tiny pink flowers and several short dangling purple vines. BOTTOM RIGHT: wailing inferno island, dark charcoal soapstone layered rock with brown soulsoil, violet grass carpet and a few tiny teal grass tips, two tiny cream mushrooms, no lava. Keep each island separate, margins all around, consistent size and lighting. No labels text grid ground plane or baked checkerboard. True transparency outside silhouettes.

追加透明背景修订：

Background extraction edit. Preserve the FOUR islands exactly in their 2 by 2 grid positions, colors, sizes and silhouettes. Remove ALL backdrop and ALL colored halos, replace everything outside the four island silhouettes with actual transparent alpha pixels. The output must be a PNG with a genuinely transparent background. No solid background, no checkerboard pattern, no fog or glow behind islands. Keep opaque islands and delicate hanging vines/grass crisp. Do not add or redraw anything. These are isolated sprites for a video game, so transparency is essential.

## 导出规格

背景压缩源为 1024×512，运行时缩至 512×256 并镜像拼接为 1024×256，接缝两侧像素相同。材质源为 768×512 的 4×2 图集；墙面 64×64，地面 32×32，墙边 64×8。细长障碍源为 640×640 的四列图集，按 alpha 裁切后输出 32×320。浮岛源为 768×512 的 2×2 图集，按 alpha 裁切后输出 80×40。全部使用最近邻缩放、128 色 PNG；透明轮廓二值化，不参与碰撞计算。

// 生成三只新敌人（潜影贝、地狱水母、开花史莱姆）及其子弹的正式像素贴图。
// 无 npm 依赖（仅用 node 内置 zlib 手写 PNG），风格对齐现有 MC 像素美术：透明背景 + 硬边缘。
// 运行：node tools/generate-enemy-art.cjs
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT = path.resolve(__dirname, '..', 'assets', 'art');

// 调色板：字符 -> [r,g,b,a]
const P = {
  '.': null, // 透明
  // 潜影贝 Shulker
  'S': [0xc6, 0x9b, 0xd8, 255], // 外壳淡紫
  's': [0x8e, 0x5f, 0xb0, 255], // 壳边框深紫
  'D': [0x5a, 0x33, 0x80, 255], // 内部深紫
  'W': [0xe9, 0xd4, 0xf2, 255], // 高光
  'H': [0xff, 0xd2, 0x4a, 255], // 发射暖黄
  // 地狱水母 HellJelly
  'J': [0xe8, 0x5d, 0x2a, 255], // 伞盖橙红
  'j': [0xb8, 0x42, 0x1f, 255], // 伞盖深红
  'K': [0xff, 0x9a, 0x3d, 255], // 亮橙
  'T': [0xff, 0xc1, 0x45, 255], // 触手黄
  't': [0xd9, 0x6e, 0x1e, 255], // 触手深橙
  'L': [0xff, 0xe0, 0x8a, 255], // 发光高光
  // 开花史莱姆 FlowerSlime
  'F': [0xff, 0x9b, 0xc5, 255], // 花瓣粉
  'f': [0xe0, 0x6a, 0x9b, 255], // 花瓣深粉
  'C': [0xff, 0xd9, 0x4a, 255], // 花蕊黄
  'G': [0x6b, 0xbf, 0x59, 255], // 茎绿
  'B': [0xff, 0xb3, 0xd9, 255], // 史莱姆体粉
  'b': [0xe8, 0x84, 0xb5, 255], // 史莱姆阴影
  'R': [0xff, 0xd9, 0xea, 255], // 高光
  // 子弹
  'Y': [0xea, 0xd8, 0xa8, 255], // sticky 淡黄
  'y': [0xcb, 0xbf, 0x8a, 255], // sticky 阴影
  'O': [0xff, 0x8c, 0x42, 255], // jellyfire 橙
  'o': [0xe0, 0x66, 0x2a, 255], // jellyfire 深
  'M': [0xff, 0x9b, 0xcd, 255], // petal 粉
  'm': [0xe2, 0x70, 0xa8, 255], // petal 深
};

// 精灵定义：{ file, rows[], scale }
const sprites = [
  // ---- 潜影贝（三状态，16x16 -> 48x48）----
  { file: 'shulker.png', scale: 3, rows: [
    '................',
    '..ssssssssssss..',
    '.sSSSSSSSSSSSSs.',
    '.sSWSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    'ssssssssssssssss',
    'ssssssssssssssss',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSWSSSSs.',
    '.sSSSSSSSSSSSSs.',
    '..ssssssssssss..',
    '................',
    '................',
  ]},
  { file: 'shulker_open.png', scale: 3, rows: [
    '................',
    '..ssssssssssss..',
    '.sSSSSSSSSSSSSs.',
    '.sSWSSSSSSSSSSs.',
    'ssssssssssssssss',
    'sSSSSSWSSSSSSSSs',
    'sSSSSSSSSSSSSSSs',
    'sSSDDDDDDDDDDSSs',
    'sSSDDDDWDDDDDSSs',
    'sSSDDDDDDDDDDSSs',
    'sSSDDDDDDDDDDSSs',
    'ssssssssssssssss',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSWSSSSSSs.',
    '..ssssssssssss..',
    '................',
  ]},
  { file: 'shulker_fire.png', scale: 3, rows: [
    '................',
    '..ssssssssssss..',
    '.sSSSSSSSSSSSSs.',
    '.sSSSSSSSWSSSSs.',
    'ssssssssssssssss',
    'sSSSSSSSSSSSSSSs',
    'sSSSSSSSSSSSSSSs',
    'sSSDDDDDDDDDDSSs',
    'sSSDDHHHHHDDSSs',
    'sSSDHHHHHHHDDSs',
    'sSSDDHHHHHDDSSs',
    'ssssssssssssssss',
    '.sSSSSSSSSSSSSs.',
    '.sSSSWSSSSSSSSs.',
    '..ssssssssssss..',
    '................',
  ]},
  // ---- 地狱水母（两帧，12x14 -> 48x56）----
  { file: 'helljelly.png', scale: 4, rows: [
    '...jjjjjj...',
    '..jJJJJJJj..',
    '.jJJJJJJJJj.',
    '.jJJKLLLLJJj.',
    'jJJJJJJJJJJj',
    'jJJJJJJJJJJj',
    'jJKJJJJJJJJj',
    '.jJJJJJJJJj.',
    '.t.t.t.t.t.',
    '..T.T.T.T..',
    '..t.t.t.t..',
    '..T.T.T.T..',
    '...t.t.t...',
    '....T.T....',
  ]},
  { file: 'helljelly_1.png', scale: 4, rows: [
    '...jjjjjj...',
    '..jJJJJJJj..',
    '.jJJJJJJJJj.',
    '.jJJLLJJJJj.',
    'jJJJJJJJJJJj',
    'jJJJJKJJJJJj',
    'jJJJJJJJJJJj',
    'jKJJJJJJJJj.',
    '.t.t.t.t.t.',
    '..T.T.T.T..',
    '.t.t.t.t.t.',
    '..T.T.T.T..',
    '...t.t.t...',
    '....T.T....',
  ]},
  // ---- 开花史莱姆（两帧，12x12 -> 48x48）----
  { file: 'flowerslime.png', scale: 4, rows: [
    '....ffff....',
    '...fFFFFf...',
    '...fFCFFf...',
    '....fFFf....',
    '.....GG.....',
    '...bbbbbb...',
    '..bBBBBBBb..',
    '.bBBBBBBBBb.',
    '.bBRBBBBBBb.',
    '.bBBBBBBBBb.',
    '..bBBBBBBb..',
    '...bbbbbb...',
  ]},
  { file: 'flowerslime_1.png', scale: 4, rows: [
    '....ffff....',
    '...fFFFFf...',
    '...fFFCFf...',
    '....fFFf....',
    '.....GG.....',
    '...bbbbbb...',
    '..bBBBBBBb..',
    '.bBBBBBBBBb.',
    '.bBBBRBBBBb.',
    '.bBBBBBBBBb.',
    '..bBBBBBBb..',
    '...bbbbbb...',
  ]},
  // ---- 子弹（12x12 -> 24x24）----
  { file: 'sticky.png', scale: 2, rows: [
    '............',
    '....yyyy....',
    '..yYYYYYYy..',
    '.yYYYYYYYYy.',
    '.yYYWYYYYYy.',
    '.yYYYYYYYYy.',
    '.yYYYYYYYYy.',
    '..yYYYYYYy..',
    '....yyyy....',
    '............',
    '............',
    '............',
  ]},
  { file: 'jellyfire.png', scale: 2, rows: [
    '............',
    '....oooo....',
    '..oOOOOOOo..',
    '.oOOOOOOOOo.',
    '.oOOHHOOOOo.',
    '.oOHHHHOOOo.',
    '.oOHHHHOOoo.',
    '..oOOOOOOo..',
    '....oooo....',
    '............',
    '............',
    '............',
  ]},
  { file: 'petal.png', scale: 2, rows: [
    '............',
    '....mmmm....',
    '..mMMMMMMm..',
    '.mMMMMMMMMm.',
    '.mMMMMMMMMm.',
    '..mMMMMMMm..',
    '....mmmm....',
    '............',
    '............',
    '............',
    '............',
    '............',
  ]},
];

// ---- PNG 编码（RGBA，8bit，无依赖）----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
function render(rows, scale) {
  const h = rows.length, w = rows[0].length;
  const rgba = Buffer.alloc(w * scale * h * scale * 4);
  for (let y = 0; y < h; y++) {
    const line = rows[y];
    for (let x = 0; x < w; x++) {
      const col = P[line[x]];
      if (!col) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const o = ((y * scale + dy) * w * scale + (x * scale + dx)) * 4;
          rgba[o] = col[0]; rgba[o + 1] = col[1]; rgba[o + 2] = col[2]; rgba[o + 3] = col[3];
        }
      }
    }
  }
  return encodePng(w * scale, h * scale, rgba);
}

fs.mkdirSync(OUT, { recursive: true });
for (const s of sprites) {
  const buf = render(s.rows, s.scale);
  fs.writeFileSync(path.join(OUT, s.file), buf);
  console.log('wrote ' + s.file + ' (' + s.rows[0].length * s.scale + 'x' + s.rows.length * s.scale + ')');
}
console.log('done: ' + sprites.length + ' PNGs');
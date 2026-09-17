// Technical export only: crop ImageGen sheets, resize, quantize alpha and PNG palette.
// NODE_PATH must expose Sharp when regenerating. Runtime has no dependency on Sharp.
const sharp = require('sharp');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets/source/biome-expansion');
const out = path.join(root, 'assets/art');
const ids = ['end', 'snow', 'blossom', 'wailing'];
const grounds = ['endstone', 'snow', 'pink_moss', 'wailing_grass'];

async function png(input, width, height, opaque = false) {
  let pipeline = sharp(input).resize(width, height, {fit:'fill', kernel:'nearest'});
  if (opaque) pipeline = pipeline.removeAlpha();
  else {
    const {data, info} = await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    for (let i = 3; i < data.length; i += 4) {
      data[i] = data[i] >= 110 ? 255 : 0;
      if (!data[i]) data[i-1] = data[i-2] = data[i-3] = 0;
    }
    pipeline = sharp(data, {raw:info});
  }
  return pipeline.png({palette:true, colours:128, dither:0, compressionLevel:9}).toBuffer();
}

async function cell(file, col, row, cols, rows) {
  const input = path.join(source, file + '.png');
  const {width, height} = await sharp(input).metadata();
  const left = Math.round(width * col / cols), top = Math.round(height * row / rows);
  return sharp(input).extract({left, top,
    width:Math.round(width * (col+1) / cols)-left,
    height:Math.round(height * (row+1) / rows)-top}).png().toBuffer();
}

async function trim(input) {
  const {data, info} = await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let left = info.width, top = info.height, right = -1, bottom = -1, transparent = false;
  for (let y=0; y<info.height; y++) for(let x=0; x<info.width; x++) {
    if (data[(y*info.width+x)*4+3] >= 110) {
      left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
    } else transparent = true;
  }
  if (right < left || !transparent) throw Error('Expected an isolated sprite with real transparency');
  return sharp(input).extract({left, top, width:right-left+1, height:bottom-top+1}).png().toBuffer();
}

async function main() {
  await fs.mkdir(out, {recursive:true});
  for (let i=0; i<ids.length; i++) {
    const id=ids[i];
    const half=await png(path.join(source, 'background_'+id+'.png'),512,256,true);
    const mirror=await sharp(half).flop().png().toBuffer();
    await sharp({create:{width:1024,height:256,channels:3,background:'#000'}})
      .composite([{input:half,left:0,top:0},{input:mirror,left:512,top:0}])
      .png({palette:true,colours:128,dither:0,compressionLevel:9}).toFile(path.join(out,'background_'+id+'.png'));
    const wall=await cell('materials',i,0,4,2);
    const ground=await cell('materials',i,1,4,2);
    await fs.writeFile(path.join(out,'wall_'+id+'.png'),await png(wall,64,64,true));
    await fs.writeFile(path.join(out,'material_'+grounds[i]+'.png'),await png(ground,32,32,true));
    const groundMeta=await sharp(ground).metadata();
    const cap=await sharp(ground).extract({left:0,top:0,width:groundMeta.width,height:Math.round(groundMeta.height*.16)}).png().toBuffer();
    await fs.writeFile(path.join(out,'wallcap_'+id+'.png'),await png(cap,64,8,true));
    await fs.writeFile(path.join(out,'vine_'+id+'.png'),await png(await trim(await cell('vines',i,0,4,1)),32,320));
    await fs.writeFile(path.join(out,'island_'+id+'.png'),await png(await trim(await cell('islands',i%2,Math.floor(i/2),2,2)),80,40));
  }
  console.log('Exported 24 PNGs for End, snow forest, blossoming spires and wailing inferno.');
}
main().catch(error => {console.error(error); process.exitCode=1;});

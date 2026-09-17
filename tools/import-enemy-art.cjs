// ImageGen atlas export: fixed animation bounds preserve anchors between poses.
const sharp=require('sharp');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'assets/source/new-enemies');
const output=path.join(root,'assets/art');
const groups=[
  {name:'shulker',frames:['shulker','shulker_open','shulker_fire'],w:48,h:48},
  {name:'helljelly',frames:['helljelly','helljelly_1'],w:48,h:56},
  {name:'flowerslime',frames:['flowerslime','flowerslime_1'],w:48,h:48},
  {name:'shots',frames:['sticky','jellyfire','petal'],w:24,h:24},
];
async function clean(input,w,h){
  const {data,info}=await sharp(input).resize(w,h,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=3;i<data.length;i+=4){data[i]=data[i]>=110?255:0;if(!data[i])data[i-1]=data[i-2]=data[i-3]=0;}
  return sharp(data,{raw:info}).png({palette:true,colours:128,dither:0,compressionLevel:9}).toBuffer();
}
async function main(inputs){
  if(inputs.length&&inputs.length!==4)throw Error('Supply shulker, jelly, slime, projectile source strips, or no arguments to rebuild.');
  await fs.mkdir(source,{recursive:true});
  for(const [g,group] of groups.entries()){
    const file=path.join(source,group.name+'.png'),n=group.frames.length;
    if(inputs[g])await fs.writeFile(file,await clean(inputs[g],n*256,256));
    const cells=[];
    let left=256,top=256,right=-1,bottom=-1;
    for(let i=0;i<n;i++){
      const cell=await sharp(file).extract({left:i*256,top:0,width:256,height:256}).png().toBuffer();
      cells.push(cell);
      const {data}=await sharp(cell).ensureAlpha().raw().toBuffer({resolveWithObject:true});
      let clear=0;
      for(let y=0;y<256;y++)for(let x=0;x<256;x++){
        if(data[(y*256+x)*4+3]>=110){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}else clear++;
      }
      if(clear<256*256*.1)throw Error('Atlas must have genuine transparent backgrounds: '+file);
    }
    if(right<left)throw Error('Empty atlas: '+file);
    const bounds={left,top,width:right-left+1,height:bottom-top+1};
    for(let i=0;i<n;i++){
      const crop=await sharp(cells[i]).extract(bounds).png().toBuffer();
      await fs.writeFile(path.join(output,group.frames[i]+'.png'),await clean(crop,group.w,group.h));
    }
  }
  console.log('Exported 10 compact enemy and projectile PNGs.');
}
main(process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});

"use strict";

// ImageGen scenery/enemies and team-supplied parrot PNGs.
const ArtAssets = {
  playerScale: 0.8, // 1.6x the previous visual size; collision geometry is unchanged.
  biomeIds: ['plain', 'beach', 'forest', 'cave', 'nether', 'basalt', 'end', 'snow', 'blossom', 'wailing'],
  materials: {
    plain: ['dirt', 'grass'], beach: ['sandstone', 'sand'],
    forest: ['oak', 'moss'], cave: ['stone', 'stone'],
    nether: ['netherrack', 'nether_magma'], basalt: ['basalt', 'basalt_magma'],
    end: ['endstone', 'endstone'], snow: ['snowstone', 'snow'],
    blossom: ['endstone', 'pink_moss'], wailing: ['soapstone', 'wailing_grass'],
  },
  animations: { tex_bee: 12, tex_bat: 10, tex_phantom: 7, tex_glow: 4,
    tex_helljelly: 4, tex_flowerslime: 6 },
  get images() {
    const list = [];
    const add = (key, file) => list.push({key, url: 'assets/art/' + file + '.png'});
    for (const color of ['blue', 'green', 'red']) {
      for (let frame = 0; frame < 2; frame++) add(`tex_player_${color}_${frame}`, `player_${color}_${frame}`);
    }
    add('tex_emerald', 'emerald');
    add('tex_life', 'life');
    for (const name of ['shulker','shulker_open','shulker_fire','helljelly','helljelly_1',
      'flowerslime','flowerslime_1','sticky','jellyfire','petal']) add('tex_'+name,name);
    for (const id of this.biomeIds) {
      for (const kind of ['background', 'vine', 'island']) add('tex_' + kind + '_' + id, kind + '_' + id);
      add('tex_wall_' + id, 'wall_' + id);
      add('tex_wallcap_' + id, 'wallcap_' + id);
      add('tex_ground_' + id, 'material_' + this.materials[id][1]);
    }
    for (const name of ['bee','bee_1','bat','bat_1','phantom','phantom_1','glow','glow_1',
      'ghast','ghast_charge','ghast_fire','enemy','stone','lava','fireball','bullet']) add('tex_' + name, name);
    // Legacy menu keys now resolve to the new art as well.
    add('tex_clouds', 'background_plain');
    add('tex_ground', 'material_grass');
    add('tex_island', 'island_plain');
    add('tex_wall', 'wall_plain');
    add('tex_vine', 'vine_plain');
    add('tex_oak_end', 'material_oak_end');
    add('tex_magma_block', 'wall_magma');
    return list;
  },
  biomeKey(kind, biome) { return 'tex_' + kind + '_' + (biome ? biome.id : 'plain'); },
  wallCapKey(biome) { return this.biomeKey('wallcap', biome); },
  preload(scene) {
    // Embedded data URLs work in both file:// and HTTP without XHR/CORS.
    scene.load.imageLoadType = 'HTMLImageElement';
    for (const {key, url} of this.images) {
      const embedded = window.GAME_ASSETS?.[url];
      if (!embedded) { scene.load.image(key, url); continue; }
      // Phaser 3.70's built-in image loader rejects data URLs. Keep its queue
      // and cache handling, but decode the embedded image directly.
      const file = new Phaser.Loader.FileTypes.ImageFile(scene.load, key, embedded);
      file.load = function () {
        this.state = Phaser.Loader.FILE_LOADING;
        this.data = new Image();
        this.data.onload = () => {
          this.state = Phaser.Loader.FILE_LOADED;
          this.loader.nextFile(this, true);
        };
        this.data.onerror = () => this.loader.nextFile(this, false);
        this.data.src = embedded;
      };
      scene.load.addFile(file);
    }
  },
  createAnimations(scene) {
    for (const [key, frameRate] of Object.entries(this.animations)) {
      if (!scene.anims.exists('art_' + key)) scene.anims.create({
        key: 'art_' + key, frames: [{key}, {key: key + '_1'}], frameRate, repeat: -1,
      });
    }
  },
  animate(sprite, key) {
    if (this.animations[key]) sprite.play('art_' + key);
  },
  ghastFrame(timer, flash) {
    return flash > 0 ? 'tex_ghast_fire' : timer <= 0.55 ? 'tex_ghast_charge' : 'tex_ghast';
  },
};

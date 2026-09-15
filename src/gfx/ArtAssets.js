"use strict";

// Original ImageGen PNG art. Gameplay reads only existing entity dimensions/timers.
const ArtAssets = {
  biomeIds: ['plain', 'beach', 'forest', 'cave', 'nether', 'basalt'],
  materials: {
    plain: ['dirt', 'grass'], beach: ['sandstone', 'sand'],
    forest: ['oak', 'moss'], cave: ['stone', 'stone'],
    nether: ['netherrack', 'nether_magma'], basalt: ['basalt', 'basalt_magma'],
  },
  animations: { tex_bee: 12, tex_bat: 10, tex_phantom: 7, tex_glow: 4 },
  get images() {
    const list = [];
    const add = (key, file) => list.push({key, url: 'assets/art/' + file + '.png'});
    for (const id of this.biomeIds) {
      for (const kind of ['background', 'vine', 'island']) add('tex_' + kind + '_' + id, kind + '_' + id);
      add('tex_wall_' + id, 'wall_' + id);
      add('tex_wallcap_' + id, 'wallcap_' + id);
      add('tex_ground_' + id, 'material_' + this.materials[id][1]);
    }
    for (const name of ['bee','bee_1','bat','bat_1','phantom','phantom_1','glow','glow_1',
      'ghast','ghast_charge','ghast_fire','enemy','stone','lava','fireball','bullet','emerald','life']) add('tex_' + name, name);
    // Legacy menu keys now resolve to the new art as well.
    add('tex_clouds', 'background_plain');
    add('tex_ground', 'material_grass');
    add('tex_island', 'island_plain');
    add('tex_wall', 'wall_plain');
    add('tex_vine', 'vine_plain');
    add('tex_oak_end', 'material_oak_end');
    add('tex_magma_block', 'wall_magma');
    add('tex_emerald', 'emerald');
    add('tex_life', 'life');
    return list;
  },
  biomeKey(kind, biome) { return 'tex_' + kind + '_' + (biome ? biome.id : 'plain'); },
  wallCapKey(biome) { return this.biomeKey('wallcap', biome); },
  preload(scene) {
    // HTMLImageElement loading avoids Phaser's default XHR for local images.
    // HTTP remains recommended; no browser security flags are needed.
    scene.load.imageLoadType = 'HTMLImageElement';
    for (const {key, url} of this.images) scene.load.image(key, url + '?v=art2');
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

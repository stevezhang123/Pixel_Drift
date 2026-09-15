const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function tuningFixture() {
  const context = vm.createContext({});
  for (const file of ['src/config/constants.js', 'src/config/biomes.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
  }
  return vm.runInContext('({TUNING, BIOMES})', context);
}

test('The first three stages space obstacles farther apart and lower obstacle probability', () => {
  const {BIOMES} = tuningFixture();
  assert.deepEqual(Array.from(BIOMES.slice(0, 3), biome => biome.spawnIntervalMul), [1.3, 1.2, 1.1]);
  assert.deepEqual(Array.from(BIOMES.slice(0, 3), biome => biome.obstacleWeightBonus), [-0.1, -0.06, -0.02]);
  assert.ok(BIOMES.slice(0, 3).every(biome => biome.spawnIntervalMul > 1));
});

test('Health storage has a hard limit of six', () => {
  const {TUNING} = tuningFixture();
  assert.equal(TUNING.health.maxStorage, 6);
  assert.ok(TUNING.health.max <= TUNING.health.maxStorage);
});

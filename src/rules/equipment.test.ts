import { describe, expect, it } from 'vitest';
import { MATERIAL_IDS, type Equipment } from '../data/items.ts';
import { SLOT_CAPACITY, addMaterial, countObjects, equipmentBonuses, objectFor } from './equipment.ts';
import { computeCombatStats } from './stats.ts';
import { makeUnit } from '../test-utils/factories.ts';

describe('addMaterial', () => {
  it('pose un matériau dans un emplacement libre', () => {
    expect(addMaterial([], 'bone', 3)).toEqual([{ kind: 'material', material: 'bone' }]);
  });

  it('fusionne deux matériaux en un objet', () => {
    const first = addMaterial([], 'bone', 3) ?? [];
    expect(addMaterial(first, 'gem', 3)).toEqual([{ kind: 'object', materials: ['bone', 'gem'] }]);
  });

  it('remplit les 3 emplacements d’un chasseur', () => {
    let equipment: Equipment = [];
    for (const material of ['bone', 'bone', 'gem', 'gem', 'horn', 'fang'] as const) {
      equipment = addMaterial(equipment, material, SLOT_CAPACITY.hunter) ?? equipment;
    }
    expect(countObjects(equipment)).toBe(3);
    expect(addMaterial(equipment, 'feather', SLOT_CAPACITY.hunter)).toBeNull();
  });

  it('ne laisse qu’un emplacement à un monstre', () => {
    const fused = addMaterial(addMaterial([], 'carapace', 1) ?? [], 'carapace', 1) ?? [];
    expect(fused).toEqual([{ kind: 'object', materials: ['carapace', 'carapace'] }]);
    expect(addMaterial(fused, 'bone', SLOT_CAPACITY.monster)).toBeNull();
  });
});

describe('objectFor', () => {
  it('reconnaît un objet signature quel que soit l’ordre des matériaux', () => {
    expect(objectFor(['membrane', 'bone']).name).toBe('Bonus critique');
    expect(objectFor(['bone', 'membrane']).name).toBe('Bonus critique');
  });

  it('les 36 combinaisons de matériaux donnent toutes un objet codé (plus aucun objet générique)', () => {
    for (const a of MATERIAL_IDS) for (const b of MATERIAL_IDS) expect(objectFor([a, b]).generic, `${a} + ${b}`).toBe(false);
  });
});

describe('equipmentBonuses', () => {
  it('compte les deux matériaux et l’effet propre d’un objet', () => {
    const stats = computeCombatStats(makeUnit({ stats: { attack: 50 } }).stats, equipmentBonuses([{ kind: 'object', materials: ['bone', 'bone'] }]));
    expect(stats.attack).toBe(50 + 15 + 15 + 20);
  });
});

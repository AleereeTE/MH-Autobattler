import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../combat/simulate.ts';
import { objectFor } from '../rules/equipment.ts';
import { unitTraitIds } from '../rules/traits.ts';
import { createDemoSetup, squadPlacements } from '../sandbox/presets.ts';
import { MATERIAL_IDS, SIGNATURE_OBJECTS } from './items.ts';
import { DEMO_PLAYER_TEAM, ENEMY_SQUADS } from './squads.ts';
import { findTrait } from './traits.ts';
import { UNITS } from './units/index.ts';

/** Vérifie que le contenu du prototype respecte ce qui a été validé (docs/prototype-content.md). */
describe('contenu du prototype', () => {
  it('contient 6 chasseurs et 6 monstres, de coût 1 à 3', () => {
    expect(UNITS.filter((u) => u.kind === 'hunter')).toHaveLength(6);
    expect(UNITS.filter((u) => u.kind === 'monster')).toHaveLength(6);
    for (const unit of UNITS) expect([1, 2, 3]).toContain(unit.cost);
  });

  it('a des identifiants uniques', () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
  });

  it('répartit les rôles : 3 tanks, 3 bruisers, 4 DPS, 2 supports', () => {
    const count = (role: string) => UNITS.filter((u) => u.role === role).length;
    expect([count('tank'), count('bruiser'), count('dps'), count('support')]).toEqual([3, 3, 4, 2]);
  });

  it('a 3 unités par trait d’élément', () => {
    for (const id of ['fire', 'thunder', 'ice', 'neutral']) {
      expect(UNITS.filter((u) => unitTraitIds(u)[0] === id), id).toHaveLength(3);
    }
  });

  it('n’utilise que des traits existants, en respectant les traits réservés', () => {
    for (const unit of UNITS) {
      for (const id of unitTraitIds(unit)) {
        const trait = findTrait(id);
        expect(trait, `${unit.name} : trait ${id}`).toBeDefined();
        if (trait?.restrictedTo !== undefined) expect(unit.kind, `${unit.name} : ${trait.name}`).toBe(trait.restrictedTo);
      }
      expect(unit.traits.length, unit.name).toBeGreaterThanOrEqual(1);
      expect(unit.traits.length, unit.name).toBeLessThanOrEqual(2);
    }
  });

  it('donne un objet à chacune des 36 combinaisons de matériaux, dont 8 objets avec effet propre', () => {
    const ids = new Set<string>();
    for (const a of MATERIAL_IDS) for (const b of MATERIAL_IDS) ids.add(objectFor([a, b]).id);
    expect(ids.size).toBe(36);
    expect(SIGNATURE_OBJECTS).toHaveLength(8);
  });

  it('a des escouades valides, qui se terminent toutes par une élimination', () => {
    for (const squad of [...ENEMY_SQUADS, DEMO_PLAYER_TEAM]) expect(() => squadPlacements(squad)).not.toThrow();
    for (const squad of ENEMY_SQUADS) {
      const result = simulateCombat(createDemoSetup(squad.id), 1);
      expect(result.reason, squad.name).toBe('elimination');
    }
  });
});

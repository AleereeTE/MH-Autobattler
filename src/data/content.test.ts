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
  it('contient 8 chasseurs et 15 monstres, de coût 1 à 6', () => {
    expect(UNITS.filter((u) => u.kind === 'hunter')).toHaveLength(8);
    expect(UNITS.filter((u) => u.kind === 'monster')).toHaveLength(15);
    const count = (cost: number) => UNITS.filter((u) => u.cost === cost).length;
    expect([1, 2, 3, 4, 5, 6].map(count)).toEqual([5, 4, 3, 5, 3, 3]);
  });

  it('réserve le coût 6 aux 3 Dragons noirs, qui ne sont pas Dragons anciens', () => {
    const blackDragons = UNITS.filter((u) => u.cost === 6);
    expect(blackDragons.map((u) => u.id).sort()).toEqual(['alatreon', 'dire-miralis', 'fatalis']);
    for (const unit of blackDragons) {
      expect(unit.kind).toBe('monster');
      expect(unit.traits).toEqual(['black-dragon']);
    }
  });

  it('réserve le coût 5 aux 3 Dragons anciens, qui sont des monstres', () => {
    const elders = UNITS.filter((u) => u.traits.includes('elder-dragon'));
    expect(elders.map((u) => u.id).sort()).toEqual(['namielle', 'safi-jiiva', 'teostra']);
    expect(UNITS.filter((u) => u.cost === 5)).toEqual(elders);
    for (const elder of elders) expect(elder).toMatchObject({ kind: 'monster', cost: 5 });
  });

  it('donne à chaque compétence une valeur de base croissante pour ★1, ★2 et ★3', () => {
    for (const unit of UNITS) {
      for (const effect of unit.skill.effects) {
        if (!('base' in effect)) continue;
        const [one, two, three] = effect.base;
        expect(one, unit.name).toBeGreaterThan(0);
        expect(two, unit.name).toBeGreaterThan(one);
        expect(three, unit.name).toBeGreaterThan(two);
      }
    }
  });

  it('a des identifiants uniques', () => {
    expect(new Set(UNITS.map((u) => u.id)).size).toBe(UNITS.length);
  });

  it('répartit les rôles : 5 tanks, 8 bruisers, 6 DPS, 4 supports', () => {
    const count = (role: string) => UNITS.filter((u) => u.role === role).length;
    expect([count('tank'), count('bruiser'), count('dps'), count('support')]).toEqual([5, 8, 6, 4]);
  });

  it('a 5 unités Feu, 4 Foudre, Glace et Dragon, 3 Sans élément et Eau', () => {
    const expected: Record<string, number> = { fire: 5, thunder: 4, ice: 4, neutral: 3, water: 3, dragon: 4 };
    for (const [id, count] of Object.entries(expected)) {
      expect(UNITS.filter((u) => unitTraitIds(u)[0] === id), id).toHaveLength(count);
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

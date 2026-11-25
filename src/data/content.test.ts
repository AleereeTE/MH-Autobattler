import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../combat/simulate.ts';
import { objectFor } from '../rules/equipment.ts';
import { unitTraitIds } from '../rules/traits.ts';
import { createDemoSetup, squadPlacements } from '../sandbox/presets.ts';
import { BALANCE } from './balance.ts';
import { MATERIAL_IDS, SIGNATURE_OBJECTS } from './items.ts';
import { DEMO_PLAYER_TEAM, ENEMY_SQUADS } from './squads.ts';
import { findTrait } from './traits.ts';
import { UNITS } from './units/index.ts';

/** Vérifie que le contenu du prototype respecte ce qui a été validé (docs/prototype-content.md). */
describe('contenu du prototype', () => {
  it('contient 12 chasseurs et 23 monstres, de coût 1 à 6', () => {
    expect(UNITS.filter((u) => u.kind === 'hunter')).toHaveLength(12);
    expect(UNITS.filter((u) => u.kind === 'monster')).toHaveLength(23);
    const count = (cost: number) => UNITS.filter((u) => u.cost === cost).length;
    expect([1, 2, 3, 4, 5, 6].map(count)).toEqual([8, 7, 6, 6, 5, 3]);
  });

  it('réserve le coût 6 aux 3 Dragons noirs, qui ne sont pas Dragons anciens', () => {
    const blackDragons = UNITS.filter((u) => u.cost === 6);
    expect(blackDragons.map((u) => u.id).sort()).toEqual(['alatreon', 'dire-miralis', 'fatalis']);
    for (const unit of blackDragons) {
      expect(unit.kind).toBe('monster');
      expect(unit.traits).toEqual(['black-dragon']);
    }
  });

  it('le coût 5 réunit les 4 Dragons anciens (des monstres) et Lea, seule chasseuse de ce coût', () => {
    const elders = UNITS.filter((u) => u.traits.includes('elder-dragon'));
    expect(elders.map((u) => u.id).sort()).toEqual(['kirin', 'namielle', 'safi-jiiva', 'teostra']);
    for (const elder of elders) expect(elder).toMatchObject({ kind: 'monster', cost: 5 });
    expect(UNITS.filter((u) => u.cost === 5).map((u) => u.id).sort()).toEqual(['kirin', 'lea', 'namielle', 'safi-jiiva', 'teostra']);
    expect(UNITS.find((u) => u.id === 'lea')).toMatchObject({ kind: 'hunter', element: 'fire', traits: ['guild', 'berserker'], weapon: 'Grande épée' });
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

  it('répartit les rôles : 7 tanks, 12 bruisers, 11 DPS, 5 supports', () => {
    const count = (role: string) => UNITS.filter((u) => u.role === role).length;
    expect([count('tank'), count('bruiser'), count('dps'), count('support')]).toEqual([7, 12, 11, 5]);
  });

  it('range les monstres dans leurs familles : 3 Léviathans et 3 Wyvernes brutes', () => {
    const family = (id: string) => UNITS.filter((u) => u.traits.includes(id)).map((u) => u.id).sort();
    expect(family('leviathan')).toEqual(['lagiacrus', 'mizutsune', 'royal-ludroth']);
    expect(family('brute-wyvern')).toEqual(['anjanath', 'barroth', 'deviljho']);
  });

  it('a 5 unités Glace, 6 Feu, Foudre, Sans élément, Eau et Dragon', () => {
    const expected: Record<string, number> = { fire: 6, thunder: 6, ice: 5, neutral: 6, water: 6, dragon: 6 };
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

  it('donne un objet à chacune des 36 combinaisons de matériaux ; chaque objet codé a sa propre combinaison', () => {
    const ids = new Set<string>();
    for (const a of MATERIAL_IDS) for (const b of MATERIAL_IDS) ids.add(objectFor([a, b]).id);
    expect(ids.size).toBe(36);
    const pairs = SIGNATURE_OBJECTS.map((object) => [...object.materials].sort().join('+'));
    expect(new Set(pairs).size).toBe(SIGNATURE_OBJECTS.length);
    expect(new Set(SIGNATURE_OBJECTS.map((object) => object.id)).size).toBe(SIGNATURE_OBJECTS.length);
  });

  it('a des escouades valides, qui se terminent toutes par une élimination', () => {
    for (const squad of [...ENEMY_SQUADS, DEMO_PLAYER_TEAM]) expect(() => squadPlacements(squad)).not.toThrow();
    for (const squad of ENEMY_SQUADS) {
      const result = simulateCombat(createDemoSetup(squad.id), 1);
      expect(result.reason, squad.name).toBe('elimination');
    }
  });
});

describe('descriptions des compétences', () => {
  it('affichent chaque pourcentage de statistique à ses 3 rangs (×1, ×1,25, ×1,5)', () => {
    for (const unit of UNITS) {
      for (const effect of unit.skill.effects) {
        if (!('ratios' in effect)) continue;
        for (const { ratio } of effect.ratios) {
          const percent = Math.round(ratio * 100);
          const text = BALANCE.skillRatioRankMultipliers.map((multiplier) => Math.floor(percent * multiplier + 0.5)).join('/');
          expect(unit.skill.description, unit.name).toContain(`${text} %`);
        }
      }
    }
  });
});

describe('compétences secrètes des Dragons noirs (★3)', () => {
  const blackDragons = UNITS.filter((unit) => unit.cost === 6);

  it('seuls les trois Dragons noirs en ont une', () => {
    expect(UNITS.filter((unit) => unit.masterSkill !== undefined).map((unit) => unit.id).sort()).toEqual(['alatreon', 'dire-miralis', 'fatalis']);
  });

  it('visent tout le plateau avec 5 fois les dégâts de la compétence ★3', () => {
    for (const unit of blackDragons) {
      const normal = unit.skill.effects.find((effect) => effect.kind === 'damage');
      const master = unit.masterSkill?.effects.find((effect) => effect.kind === 'damage');
      if (normal?.kind !== 'damage' || master?.kind !== 'damage') throw new Error(`${unit.name} : effet de dégâts manquant`);
      expect(master.base[2], unit.name).toBe(normal.base[2] * 5);
      expect(master.ratios[0]?.ratio, unit.name).toBeCloseTo((normal.ratios[0]?.ratio ?? 0) * 5);
      expect(master.radius, unit.name).toBe(10);
    }
  });

  it('affichent leurs pourcentages au ★3 (×1,5)', () => {
    for (const unit of blackDragons) {
      for (const effect of unit.masterSkill?.effects ?? []) {
        if (!('ratios' in effect)) continue;
        for (const { ratio } of effect.ratios) {
          const text = Math.floor(Math.round(ratio * 100) * 1.5 + 0.5);
          expect(unit.masterSkill?.description, unit.name).toContain(`${text} %`);
        }
      }
    }
  });
});

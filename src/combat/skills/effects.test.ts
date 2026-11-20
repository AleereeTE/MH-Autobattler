import { describe, expect, it } from 'vitest';
import type { DamageEffect } from '../../data/definitions.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { createCombatState } from '../setup.ts';
import type { CombatState } from '../state.ts';
import { applySkillEffect } from './effects.ts';

function damagedUids(state: CombatState): number[] {
  return state.events.flatMap((event) => (event.type === 'damage' ? [event.targetUid] : []));
}

describe('applySkillEffect — dégâts', () => {
  it('touche aussi les ennemis dans le rayon autour de la cible principale', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit({ stats: { elementalPower: 100 } }), 3, 7)],
        enemy: [
          place(makeUnit({ stats: { hp: 100 } }), 3, 2), // cible principale (moins de PV)
          place(makeUnit(), 2, 2), // voisine de la cible
          place(makeUnit(), 6, 0), // trop loin
        ],
      },
      1,
    );
    const effect: DamageEffect = {
      kind: 'damage',
      target: 'lowestHpEnemy',
      damageType: 'elemental',
      base: 10,
      ratios: [{ stat: 'elementalPower', ratio: 1 }],
      radius: 1,
    };
    const caster = state.units[0];
    if (caster === undefined) throw new Error('lanceur manquant');

    applySkillEffect(state, caster, effect);

    expect(damagedUids(state)).toEqual([2, 3]);
    const amounts = state.events.flatMap((event) => (event.type === 'damage' ? [event.amount] : []));
    expect(amounts).toEqual([110, 110]);
  });

  it('ne fait jamais de coup critique', () => {
    const state = createCombatState(
      { player: [place(makeUnit({ stats: { critChance: 1 } }), 3, 4)], enemy: [place(makeUnit(), 3, 3)] },
      1,
    );
    const caster = state.units[0];
    if (caster === undefined) throw new Error('lanceur manquant');

    applySkillEffect(state, caster, {
      kind: 'damage',
      target: 'currentTarget',
      damageType: 'physical',
      base: 100,
      ratios: [],
    });

    const damage = state.events.find((event) => event.type === 'damage');
    expect(damage).toMatchObject({ amount: 100, isCrit: false });
  });
});

import { describe, expect, it } from 'vitest';
import { ENERGY_PROFILES } from '../../data/energy-profiles.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { createCombatState } from '../setup.ts';
import type { CombatUnit } from '../state.ts';
import { dealDamage } from './damage.ts';

function duel(targetOverrides: Parameters<typeof makeUnit>[0]) {
  const state = createCombatState(
    { player: [place(makeUnit(), 3, 4)], enemy: [place(makeUnit(targetOverrides), 3, 3)] },
    1,
  );
  const [source, target] = state.units as [CombatUnit, CombatUnit];
  return { state, source, target };
}

describe('dealDamage', () => {
  it('réduit les dégâts physiques avec l’armure', () => {
    const { state, source, target } = duel({ stats: { armor: 100, elementalResist: 0 } });
    expect(dealDamage(state, source, target, { amount: 100, type: 'physical', isCrit: false, cause: 'attack' })).toBe(50);
    expect(target.hp).toBe(450);
  });

  it('réduit les dégâts élémentaires avec la résistance élémentaire', () => {
    const { state, source, target } = duel({ stats: { armor: 0, elementalResist: 100 } });
    expect(dealDamage(state, source, target, { amount: 100, type: 'elemental', isCrit: false, cause: 'attack' })).toBe(50);
  });

  it('donne de l’énergie à un tank qui subit un coup', () => {
    const { state, source, target } = duel({ role: 'tank' });
    dealDamage(state, source, target, { amount: 10, type: 'physical', isCrit: false, cause: 'attack' });
    expect(target.energy).toBe(ENERGY_PROFILES.tank.perHitTaken);
  });

  it('ne donne pas d’énergie pendant une incantation', () => {
    const { state, source, target } = duel({ role: 'tank' });
    target.cast = { remainingTicks: 10, skill: target.def.skill };
    dealDamage(state, source, target, { amount: 10, type: 'physical', isCrit: false, cause: 'attack' });
    expect(target.energy).toBe(0);
  });

  it('enregistre un événement de dégâts', () => {
    const { state, source, target } = duel({});
    dealDamage(state, source, target, { amount: 80, type: 'physical', isCrit: true, cause: 'attack' });
    expect(state.events.at(-1)).toEqual({
      type: 'damage',
      tick: 0,
      sourceUid: source.uid,
      targetUid: target.uid,
      amount: 80,
      absorbed: 0,
      damageType: 'physical',
      cause: 'attack',
      isCrit: true,
      hpAfter: 420,
    });
  });

  it('laisse le bouclier absorber les dégâts avant les PV', () => {
    const { state, source, target } = duel({});
    target.shields.push({ amount: 30, remainingTicks: 100 });
    dealDamage(state, source, target, { amount: 50, type: 'physical', isCrit: false, cause: 'attack' });
    expect(target.hp).toBe(480);
    expect(target.shields).toEqual([]);
    expect(state.events.at(-1)).toMatchObject({ amount: 50, absorbed: 30 });
  });

  it('applique la réduction de dégâts (Bastion)', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit(), 3, 4)],
        enemy: [
          place(makeUnit({ id: 'a', traits: ['bastion'] }), 3, 3),
          place(makeUnit({ id: 'b', traits: ['bastion'] }), 4, 3),
        ],
      },
      1,
    );
    const [source, target] = state.units as [CombatUnit, CombatUnit];
    expect(target.stats.damageReduction).toBeCloseTo(0.15);
    expect(dealDamage(state, source, target, { amount: 100, type: 'physical', isCrit: false, cause: 'attack' })).toBeCloseTo(85);
  });
});

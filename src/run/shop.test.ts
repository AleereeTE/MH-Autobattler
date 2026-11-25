import { describe, expect, it } from 'vitest';
import { bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { buy, levelUp, refreshShop, reroll } from './shop.ts';

const totalInPool = (pool: ReadonlyMap<string, number>): number => [...pool.values()].reduce((sum, n) => sum + n, 0);

describe('boutique', () => {
  it('propose 5 unités, retirées du stock tant qu’elles sont affichées', () => {
    const state = makeRun();
    const shown = state.shop.filter((id) => id !== null).length;
    expect(state.shop).toHaveLength(5);
    expect(shown).toBe(5);
    const before = totalInPool(state.pool);
    refreshShop(state);
    // Les 5 anciennes offres sont revenues, 5 nouvelles sont parties : le total ne change pas.
    expect(totalInPool(state.pool)).toBe(before);
  });

  it('achète une unité : zennys payés, unité en réserve, emplacement vidé', () => {
    const state = makeRun({ zennys: 10 });
    state.shop = ['khezu', 'olivia', null, null, null];
    expect(buy(state, 0).ok).toBe(true);
    expect(state.zennys).toBe(9);
    expect(state.shop[0]).toBeNull();
    expect(state.units).toMatchObject([{ unitId: 'khezu', rank: 1, location: bench(0) }]);
    expect(buy(state, 0).ok).toBe(false);
  });

  it('refuse un achat sans assez de zennys', () => {
    const state = makeRun({ zennys: 2 });
    state.shop = ['rathalos', null, null, null, null];
    expect(buy(state, 0)).toMatchObject({ ok: false });
    expect(state.units).toEqual([]);
  });

  it('fusionne aussitôt le 3e exemplaire acheté, même réserve pleine', () => {
    const state = makeRun();
    giveUnit(state, 'hinoa', bench(0));
    giveUnit(state, 'hinoa', bench(1));
    for (let index = 2; index < 10; index++) giveUnit(state, 'minoto', bench(index), 3);
    state.shop = ['hinoa', 'khezu', null, null, null];

    expect(buy(state, 1).ok).toBe(false); // réserve pleine, pas de fusion
    expect(buy(state, 0).ok).toBe(true);
    expect(state.units.find((unit) => unit.unitId === 'hinoa')).toMatchObject({ rank: 2, location: bench(0) });
  });

  it('relance pour 2 zennys', () => {
    const state = makeRun({ zennys: 3 });
    expect(reroll(state).ok).toBe(true);
    expect(state.zennys).toBe(1);
    expect(reroll(state).ok).toBe(false);
  });

  it('améliore la boutique au prix du niveau, jusqu’au niveau 10', () => {
    const state = makeRun({ zennys: 12, level: 2 });
    expect(levelUp(state).ok).toBe(true);
    expect(state).toMatchObject({ level: 3, zennys: 8 });
    expect(levelUp(state).ok).toBe(true);
    expect(state).toMatchObject({ level: 4, zennys: 0 });
    expect(levelUp(state).ok).toBe(false);
    state.level = 9;
    state.zennys = 64;
    expect(levelUp(state).ok).toBe(true);
    expect(state).toMatchObject({ level: 10, zennys: 0 });
    state.zennys = 999;
    expect(levelUp(state).ok).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng.ts';
import { UNITS } from '../data/units/index.ts';
import { board, bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { completedUnitIds } from './completed.ts';
import { createPool, drawUnitId } from './pool.ts';
import { drawRewards } from './rewards.ts';
import { sellUnit } from './roster.ts';
import { buy, refreshShop } from './shop.ts';

/** Toutes les unités de coût 1 sauf Hinoa : en les excluant, seul Hinoa peut sortir aux niveaux 1 et 2. */
const COST_1_EXCEPT_SYLVAIN = UNITS.filter((u) => u.cost === 1 && u.id !== 'hinoa').map((u) => u.id);

describe('unités obtenues au ★3', () => {
  it('ne sont jamais tirées', () => {
    const pool = createPool();
    const excluded = new Set(COST_1_EXCEPT_SYLVAIN);
    const rng = createRng(2);
    for (let i = 0; i < 200; i++) expect(drawUnitId(pool, 1, rng, excluded)).toBe('hinoa');
  });

  it('ne sont plus proposées par la boutique ni par les récompenses', () => {
    const state = makeRun({ level: 1 });
    for (const [index, id] of COST_1_EXCEPT_SYLVAIN.entries()) giveUnit(state, id, bench(index), 3);
    expect(completedUnitIds(state)).toEqual(new Set(COST_1_EXCEPT_SYLVAIN));

    for (let i = 0; i < 20; i++) {
      refreshShop(state);
      expect(state.shop.every((id) => id === null || id === 'hinoa')).toBe(true);
      const unit = drawRewards(state).find((option) => option.kind === 'unit');
      expect(unit?.kind === 'unit' ? unit.unitId : 'hinoa').toBe('hinoa');
    }
  });

  it('disparaissent de la boutique affichée dès que le ★3 se forme', () => {
    const state = makeRun();
    giveUnit(state, 'rathalos', board(3, 5), 2);
    giveUnit(state, 'rathalos', bench(0), 2);
    giveUnit(state, 'rathalos', bench(1));
    giveUnit(state, 'rathalos', bench(2));
    state.shop = ['rathalos', 'rathalos', 'khezu', null, null];
    const before = state.pool.get('rathalos') ?? 0;

    expect(buy(state, 0).ok).toBe(true);

    expect(state.units.filter((unit) => unit.unitId === 'rathalos')).toMatchObject([{ rank: 3 }]);
    expect(state.shop).toEqual([null, null, 'khezu', null, null]);
    expect(state.pool.get('rathalos')).toBe(before + 1); // l'offre retirée retourne au stock
  });

  it('peuvent revenir si le ★3 est revendu', () => {
    const state = makeRun();
    const star3 = giveUnit(state, 'hinoa', bench(0), 3);
    expect(completedUnitIds(state).has('hinoa')).toBe(true);
    sellUnit(state, star3.uid);
    expect(completedUnitIds(state).has('hinoa')).toBe(false);
  });
});

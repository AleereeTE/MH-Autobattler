import { describe, expect, it } from 'vitest';
import { board, bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { canReceive, moveUnit, receiveUnit, sellUnit } from './roster.ts';

describe('réserve et plateau', () => {
  it('range les unités reçues dans la première place libre', () => {
    const state = makeRun();
    giveUnit(state, 'khezu', bench(0));
    expect(receiveUnit(state, 'helga').ok).toBe(true);
    expect(state.units.at(-1)?.location).toEqual(bench(1));
  });

  it('refuse une unité réserve pleine, sauf si elle fusionne aussitôt', () => {
    const state = makeRun();
    giveUnit(state, 'barroth', bench(0));
    giveUnit(state, 'barroth', bench(1));
    for (let index = 2; index < 10; index++) giveUnit(state, 'lysa', bench(index), 3); // ★3 : ne fusionnent plus

    expect(canReceive(state, 'khezu')).toBe(false);
    expect(receiveUnit(state, 'khezu').ok).toBe(false);
    expect(receiveUnit(state, 'barroth').ok).toBe(true);
    expect(state.units.find((unit) => unit.unitId === 'barroth')).toMatchObject({ rank: 2, location: bench(0) });
  });

  it('compte la place libérée par une fusion quand plusieurs exemplaires arrivent', () => {
    const state = makeRun();
    giveUnit(state, 'barroth', bench(0));
    giveUnit(state, 'barroth', bench(1));
    for (let index = 2; index < 10; index++) giveUnit(state, 'lysa', bench(index), 3); // ★3 : ne fusionnent plus
    // Le 1er exemplaire fusionne (et libère la place 1), le 2e s'y installe.
    expect(canReceive(state, 'barroth', 2)).toBe(true);
    expect(canReceive(state, 'barroth', 3)).toBe(false);
    // La simulation ne touche pas à l'état réel.
    expect(state.units).toHaveLength(10);
  });

  it('pose une unité sur le plateau dans la limite du niveau', () => {
    const state = makeRun({ level: 2 });
    const a = giveUnit(state, 'khezu', bench(0));
    const b = giveUnit(state, 'helga', bench(1));
    const c = giveUnit(state, 'lysa', bench(2));
    expect(moveUnit(state, a.uid, board(2, 4)).ok).toBe(true);
    expect(moveUnit(state, b.uid, board(3, 4)).ok).toBe(true);
    expect(moveUnit(state, c.uid, board(4, 4)).ok).toBe(false);
    // Échanger avec une unité du plateau reste possible.
    expect(moveUnit(state, c.uid, board(2, 4)).ok).toBe(true);
    expect(a.location).toEqual(bench(2));
  });

  it('refuse le camp ennemi', () => {
    const state = makeRun();
    const unit = giveUnit(state, 'khezu', bench(0));
    expect(moveUnit(state, unit.uid, board(3, 3)).ok).toBe(false);
  });

  it('vend une unité : zennys, exemplaires rendus au stock, équipement à l’inventaire', () => {
    const state = makeRun({ zennys: 0 });
    const before = state.pool.get('anjanath') ?? 0;
    const unit = giveUnit(state, 'anjanath', board(1, 5), 2, [{ kind: 'material', material: 'bone' }]);
    expect(sellUnit(state, unit.uid).ok).toBe(true);
    expect(state.zennys).toBe(6); // coût 2 × 3 exemplaires
    expect(state.pool.get('anjanath')).toBe(before + 3);
    expect(state.inventory).toEqual([{ kind: 'material', material: 'bone' }]);
    expect(state.units).toEqual([]);
  });
});

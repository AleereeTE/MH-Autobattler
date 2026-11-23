import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng.ts';
import { MERCHANT } from '../data/run-balance.ts';
import { board, findNode, giveUnit, makeRun, placeOnNode } from '../test-utils/run.ts';
import { copiesForRank } from './economy.ts';
import { generateSquad, huntBudget, maxEnemyUnits } from './enemies.ts';
import { reforge } from './forge.ts';
import { unequip } from './inventory.ts';
import { buyItemRemover, buyMaterial } from './merchant.ts';
import type { RunState } from './state.ts';

function atStop(kind: 'forge' | 'merchant'): RunState {
  const state = makeRun();
  const node = findNode(state, kind);
  if (node === null) throw new Error(`pas de case ${kind} sur la carte`);
  placeOnNode(state, node.step, node.index);
  return state;
}

describe('forge', () => {
  it('retire un objet sans retire-objet', () => {
    const state = atStop('forge');
    const unit = giveUnit(state, 'olivia', board(3, 5), 1, [{ kind: 'object', materials: ['bone', 'bone'] }]);
    expect(unequip(state, unit.uid, 0).ok).toBe(true);
    expect(state.itemRemovers).toBe(0);
    expect(state.inventory).toEqual([{ kind: 'object', materials: ['bone', 'bone'] }]);
  });

  it('hors de la forge, retirer un objet demande toujours un retire-objet', () => {
    const state = makeRun();
    const unit = giveUnit(state, 'olivia', board(3, 5), 1, [{ kind: 'object', materials: ['bone', 'bone'] }]);
    expect(unequip(state, unit.uid, 0)).toMatchObject({ ok: false });
  });

  it('reforge 2 matériaux de l’inventaire au choix, pas un de plus', () => {
    const state = atStop('forge');
    state.inventory = [
      { kind: 'material', material: 'bone' },
      { kind: 'material', material: 'gem' },
      { kind: 'material', material: 'carapace' },
    ];
    expect(reforge(state, 0, 'feather').ok).toBe(true);
    expect(reforge(state, 1, 'gem')).toMatchObject({ ok: false }); // même matériau : refusé, ne compte pas
    expect(reforge(state, 1, 'fang').ok).toBe(true);
    expect(reforge(state, 2, 'extract')).toMatchObject({ ok: false });
    expect(state.inventory.map((slot) => (slot.kind === 'material' ? slot.material : null))).toEqual(['feather', 'fang', 'carapace']);
  });

  it('ne reforge ni hors de la forge, ni un objet', () => {
    const outside = makeRun();
    outside.inventory = [{ kind: 'material', material: 'bone' }];
    expect(reforge(outside, 0, 'gem')).toMatchObject({ ok: false });
    const state = atStop('forge');
    state.inventory = [{ kind: 'object', materials: ['bone', 'bone'] }];
    expect(reforge(state, 0, 'gem')).toMatchObject({ ok: false });
  });
});

describe('marchand', () => {
  it('propose 4 matériaux et un retire-objet', () => {
    const state = atStop('merchant');
    expect(state.merchant?.offers).toHaveLength(MERCHANT.materialsOffered);
    expect(state.merchant?.itemRemoverSold).toBe(false);
  });

  it('vend chaque matériau une fois, 3 zennys pièce', () => {
    const state = atStop('merchant');
    state.zennys = 10;
    const material = state.merchant?.offers[0];
    expect(buyMaterial(state, 0).ok).toBe(true);
    expect(state.zennys).toBe(7);
    expect(state.inventory).toEqual([{ kind: 'material', material }]);
    expect(buyMaterial(state, 0)).toMatchObject({ ok: false });
  });

  it('vend un seul retire-objet, 4 zennys', () => {
    const state = atStop('merchant');
    state.zennys = 10;
    expect(buyItemRemover(state).ok).toBe(true);
    expect(state).toMatchObject({ zennys: 6, itemRemovers: 1 });
    expect(buyItemRemover(state)).toMatchObject({ ok: false });
  });

  it('refuse sans assez de zennys, ou ailleurs que chez le marchand', () => {
    const state = atStop('merchant');
    state.zennys = 2;
    expect(buyMaterial(state, 0)).toMatchObject({ ok: false });
    expect(buyItemRemover(state)).toMatchObject({ ok: false });
    expect(buyMaterial(makeRun(), 0)).toMatchObject({ ok: false });
  });
});

describe('escouade d’une quête urgente', () => {
  const value = (hunt: number, seed: number, extra: number) =>
    generateSquad(hunt, createRng(seed), extra).reduce((sum, placement) => sum + placement.unit.cost * copiesForRank(placement.rank ?? 1), 0);

  it('reçoit le budget et le nombre de monstres de 3 chasses plus loin', () => {
    for (const hunt of [3, 6, 14, 23]) {
      for (const seed of [1, 2, 3]) {
        expect(value(hunt, seed, 3)).toBeLessThanOrEqual(huntBudget(hunt + 3));
        expect(generateSquad(hunt, createRng(seed), 3).length).toBeLessThanOrEqual(maxEnemyUnits(hunt + 3));
      }
    }
    const average = (extra: number) => [1, 2, 3, 4, 5, 6].reduce((sum, seed) => sum + value(6, seed, extra), 0) / 6;
    expect(average(3)).toBeGreaterThan(average(0));
  });

  it('garde les limites du stage (coût 2 et ★2 au plus au stage 1)', () => {
    for (let seed = 1; seed <= 10; seed++) {
      for (const placement of generateSquad(8, createRng(seed), 3)) {
        expect(placement.unit.cost).toBeLessThanOrEqual(2);
        expect(placement.rank ?? 1).toBeLessThanOrEqual(2);
      }
    }
  });
});

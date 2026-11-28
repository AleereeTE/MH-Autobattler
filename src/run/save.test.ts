import { describe, expect, it } from 'vitest';
import { board, giveUnit, makeRun } from '../test-utils/run.ts';
import { chooseNode, chooseReward, fight } from './flow.ts';
import { currentNode } from './map.ts';
import { SAVE_VERSION, restoreRun, serializeRun } from './save.ts';
import { reroll } from './shop.ts';
import type { RunState } from './state.ts';

/** Run en préparation avec deux unités sur le plateau et un peu d'équipement. */
function runInProgress(): RunState {
  const state = makeRun();
  giveUnit(state, 'rathalos', board(3, 5), 2, [{ kind: 'object', materials: ['bone', 'gem'] }]);
  giveUnit(state, 'lea', board(2, 5), 1);
  state.inventory.push({ kind: 'material', material: 'fang' });
  return state;
}

function restored(state: RunState): RunState {
  const copy = restoreRun(serializeRun(state));
  if (copy === null) throw new Error('sauvegarde illisible');
  return copy;
}

describe('sauvegarde d’une run', () => {
  it('reconstruit exactement le même état (carte, escouade, stock, unités)', () => {
    const state = runInProgress();
    const copy = restored(state);
    expect(serializeRun(copy)).toBe(serializeRun(state));
    expect(copy.pool).toEqual(state.pool);
    expect(copy.enemy.map((placement) => placement.unit)).toEqual(state.enemy.map((placement) => placement.unit));
    expect(copy.map.steps[0]?.[0]?.squad[0]?.unit).toBe(state.map.steps[0]?.[0]?.squad[0]?.unit);
    expect(copy.units).toEqual(state.units);
  });

  it('reprise exacte : le hasard continue au même endroit (relance de boutique, combat, récompenses)', () => {
    const state = runInProgress();
    const copy = restored(state);
    for (const run of [state, copy]) {
      reroll(run);
      fight(run);
    }
    expect(copy.shop).toEqual(state.shop);
    expect(copy.phase).toBe(state.phase);
    expect(copy.rewards).toEqual(state.rewards);
    expect(serializeRun(copy)).toBe(serializeRun(state));
  });

  it('garde une récompense en attente, que l’on peut toujours choisir', () => {
    const state = runInProgress();
    fight(state);
    expect(state.phase).toBe('reward');
    const copy = restored(state);
    expect(chooseReward(copy, 0).ok).toBe(true);
    expect(chooseNode(copy, currentNode(copy)?.next[0] ?? 0).ok).toBe(true);
  });

  it('ignore une sauvegarde absente, abîmée, d’une autre version, ou qui cite une unité inconnue', () => {
    expect(restoreRun(null)).toBeNull();
    expect(restoreRun('pas du JSON')).toBeNull();
    expect(restoreRun('null')).toBeNull();
    const saved = JSON.parse(serializeRun(runInProgress())) as { version: number; state: { units: { unitId: string }[] } };
    expect(restoreRun(JSON.stringify({ ...saved, version: SAVE_VERSION + 1 }))).toBeNull();
    const unit = saved.state.units[0];
    if (unit === undefined) throw new Error('aucune unité');
    unit.unitId = 'unite-disparue';
    expect(restoreRun(JSON.stringify(saved))).toBeNull();
  });
});

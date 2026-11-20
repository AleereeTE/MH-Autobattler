import { describe, expect, it } from 'vitest';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { createCombatState } from '../setup.ts';
import type { CombatState, CombatUnit } from '../state.ts';
import { acquireTarget, selectTarget } from './targeting.ts';

function unitAt(state: CombatState, col: number, row: number): CombatUnit {
  const unit = state.units.find((u) => u.position.col === col && u.position.row === row);
  if (unit === undefined) throw new Error(`Aucune unité en (${col},${row})`);
  return unit;
}

describe('acquireTarget', () => {
  it('choisit l’ennemi le plus proche', () => {
    const state = createCombatState(
      { player: [place(makeUnit(), 3, 7)], enemy: [place(makeUnit(), 3, 0), place(makeUnit(), 3, 3)] },
      1,
    );
    const target = acquireTarget(unitAt(state, 3, 7), state.units);
    expect(target?.position).toEqual({ col: 3, row: 3 });
  });

  it('départage deux ennemis à égale distance par le plus petit identifiant', () => {
    const state = createCombatState(
      { player: [place(makeUnit(), 3, 6)], enemy: [place(makeUnit(), 5, 2), place(makeUnit(), 1, 2)] },
      1,
    );
    const target = acquireTarget(unitAt(state, 3, 6), state.units);
    expect(target?.position).toEqual({ col: 5, row: 2 });
  });

  it('garde sa cible tant qu’elle est en vie, même si un autre ennemi est plus proche', () => {
    const state = createCombatState(
      { player: [place(makeUnit(), 3, 7)], enemy: [place(makeUnit(), 3, 0), place(makeUnit(), 3, 3)] },
      1,
    );
    const hunter = unitAt(state, 3, 7);
    hunter.targetUid = unitAt(state, 3, 0).uid;
    expect(acquireTarget(hunter, state.units)?.position).toEqual({ col: 3, row: 0 });
  });
});

describe('selectTarget', () => {
  it('« lowestHpEnemy » vise l’ennemi qui a le moins de PV', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit(), 3, 7)],
        enemy: [place(makeUnit({ stats: { hp: 300 } }), 3, 3), place(makeUnit({ stats: { hp: 100 } }), 0, 0)],
      },
      1,
    );
    expect(selectTarget('lowestHpEnemy', unitAt(state, 3, 7), state.units)?.position).toEqual({ col: 0, row: 0 });
  });

  it('« farthestEnemy » vise l’ennemi le plus éloigné (ligne arrière)', () => {
    const state = createCombatState(
      { player: [place(makeUnit(), 3, 7)], enemy: [place(makeUnit(), 3, 3), place(makeUnit(), 0, 0)] },
      1,
    );
    expect(selectTarget('farthestEnemy', unitAt(state, 3, 7), state.units)?.position).toEqual({ col: 0, row: 0 });
  });
});

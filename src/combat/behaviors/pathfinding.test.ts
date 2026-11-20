import { describe, expect, it } from 'vitest';
import { hexDistance } from '../../core/hex.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { createCombatState } from '../setup.ts';
import { nextStepToward } from './pathfinding.ts';

describe('nextStepToward', () => {
  it('fait un pas qui rapproche de la cible', () => {
    const state = createCombatState({ player: [place(makeUnit(), 3, 7)], enemy: [place(makeUnit(), 3, 0)] }, 1);
    const [mover, target] = state.units;
    if (mover === undefined || target === undefined) throw new Error('unités manquantes');

    const step = nextStepToward(mover, target, state.units);
    expect(step).not.toBeNull();
    if (step === null) return;
    expect(hexDistance(mover.position, step)).toBe(1);
    expect(hexDistance(step, target.position)).toBe(hexDistance(mover.position, target.position) - 1);
  });

  it('renvoie null quand l’unité est entourée par ses alliés', () => {
    const state = createCombatState(
      {
        player: [place(makeUnit(), 0, 7), place(makeUnit(), 1, 7), place(makeUnit(), 1, 6), place(makeUnit(), 0, 6)],
        enemy: [place(makeUnit(), 3, 0)],
      },
      1,
    );
    const [mover] = state.units;
    const target = state.units.find((u) => u.side === 'enemy');
    if (mover === undefined || target === undefined) throw new Error('unités manquantes');

    expect(nextStepToward(mover, target, state.units)).toBeNull();
  });
});

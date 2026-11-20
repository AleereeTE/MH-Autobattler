import { describe, expect, it } from 'vitest';
import { makeUnit, place } from '../test-utils/factories.ts';
import { createCombatState } from './setup.ts';

describe('createCombatState', () => {
  it('crée les unités du joueur puis celles de l’ennemi, avec 0 énergie', () => {
    const state = createCombatState({ player: [place(makeUnit(), 3, 4)], enemy: [place(makeUnit(), 3, 3)] }, 1);
    expect(state.units.map((u) => [u.uid, u.side, u.energy])).toEqual([
      [1, 'player', 0],
      [2, 'enemy', 0],
    ]);
    expect(state.events[0]?.type).toBe('combatStart');
  });

  it('refuse une unité placée dans la zone adverse', () => {
    expect(() => createCombatState({ player: [place(makeUnit(), 3, 2)], enemy: [place(makeUnit(), 3, 0)] }, 1)).toThrow(
      /hors de la zone/,
    );
  });

  it('refuse deux unités sur la même case', () => {
    expect(() =>
      createCombatState(
        { player: [place(makeUnit(), 3, 4), place(makeUnit(), 3, 4)], enemy: [place(makeUnit(), 3, 0)] },
        1,
      ),
    ).toThrow(/même case/);
  });

  it('refuse un camp vide', () => {
    expect(() => createCombatState({ player: [], enemy: [place(makeUnit(), 3, 0)] }, 1)).toThrow(/au moins une unité/);
  });
});

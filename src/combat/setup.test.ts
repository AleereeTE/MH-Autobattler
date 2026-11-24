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

  it('indique le coût de chaque unité au début du combat, pour l’affichage', () => {
    const state = createCombatState({ player: [place(makeUnit({ cost: 4 }), 3, 4)], enemy: [place(makeUnit(), 3, 3)] }, 1);
    const start = state.events[0];
    if (start?.type !== 'combatStart') throw new Error('événement de début manquant');
    expect(start.units.map((unit) => unit.cost)).toEqual([4, 1]);
  });

  it('ajoute le bonus du placement (renforcement du mode infini) aux statistiques', () => {
    const boosted = { ...place(makeUnit({ id: 'renforce' }), 3, 3), bonus: { hpPercent: 0.5, attackPercent: 0.5, elementalPowerPercent: 0.5 } };
    const state = createCombatState({ player: [place(makeUnit(), 3, 4)], enemy: [boosted] }, 1);
    const [player, enemy] = state.units;
    expect(player?.stats.hp).toBe(500);
    expect(enemy?.stats.hp).toBeCloseTo(750);
    expect(enemy?.stats.attack).toBeCloseTo(75);
    expect(enemy?.hp).toBeCloseTo(750);
  });

  it('applique le rang ★ : PV et attaque brute ×1,8 au ★2, ×3,24 au ★3, avant les bonus', () => {
    const unit = makeUnit({ stats: { hp: 500, attack: 50, armor: 20 } });
    const state = createCombatState(
      {
        player: [
          { ...place(unit, 2, 4), rank: 2 },
          { ...place(unit, 4, 4, [{ kind: 'material', material: 'bone' }]), rank: 3 },
        ],
        enemy: [place(unit, 3, 3)],
      },
      1,
    );
    const [two, three, one] = state.units;
    expect(two?.rank).toBe(2);
    expect(two?.stats.hp).toBeCloseTo(900);
    expect(two?.hp).toBeCloseTo(900);
    expect(two?.stats.attack).toBeCloseTo(90);
    expect(two?.stats.armor).toBe(20);
    expect(three?.stats.attack).toBeCloseTo(50 * 3.24 + 15); // l'Os (+15) s'ajoute après le rang
    expect(one?.rank).toBe(1);
    expect(one?.stats.hp).toBe(500);

    const start = state.events[0];
    if (start?.type !== 'combatStart') throw new Error('événement de début manquant');
    expect(start.units.map((u) => u.rank)).toEqual([2, 3, 1]);
  });

  it('refuse un rang invalide', () => {
    const placement = { ...place(makeUnit(), 3, 4), rank: 4 as unknown as 1 };
    expect(() => createCombatState({ player: [placement], enemy: [place(makeUnit(), 3, 3)] }, 1)).toThrow(/rang invalide/);
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

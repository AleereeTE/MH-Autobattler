import { describe, expect, it } from 'vitest';
import { board, bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { applyCombatResult, chooseReward, createRun, fight, startRound } from './flow.ts';
import { buy } from './shop.ts';
import { moveUnit } from './roster.ts';

describe('déroulement d’une run', () => {
  it('commence au niveau 2 avec 10 zennys (5 de départ + le revenu du 1er tour), la boutique et la 1re chasse', () => {
    const state = createRun(7);
    expect(state).toMatchObject({ hunt: 1, defeats: 0, level: 2, zennys: 10, phase: 'prep', outcome: null });
    expect(state.shop.filter((id) => id !== null)).toHaveLength(5);
    expect(state.enemy.length).toBeGreaterThan(0);
  });

  it('refuse de combattre sans unité sur le plateau', () => {
    expect(fight(createRun(7))).toMatchObject({ ok: false });
  });

  it('après une victoire : récompense à choisir, puis tour suivant avec le bonus de victoire', () => {
    const state = makeRun({ zennys: 0 });
    applyCombatResult(state, 'player');
    expect(state).toMatchObject({ phase: 'reward', hunt: 2, defeats: 0 });
    expect(state.rewards?.map((option) => option.kind)).toEqual(['materials', 'zennys', 'unit']);

    const zennysIndex = state.rewards?.findIndex((option) => option.kind === 'zennys') ?? -1;
    expect(chooseReward(state, zennysIndex).ok).toBe(true);
    // 4 zennys de récompense, puis revenu : 5 de base + 1 de victoire (intérêts : 0).
    expect(state).toMatchObject({ phase: 'prep', zennys: 10, rewards: null });
  });

  it('après une défaite contre une chasse classique : pas de récompense, chasse suivante', () => {
    const state = makeRun({ zennys: 0 });
    applyCombatResult(state, 'enemy');
    expect(state).toMatchObject({ phase: 'prep', hunt: 2, defeats: 1, rewards: null, zennys: 5 });
  });

  it('un boss perdu se réaffronte, avec la même escouade', () => {
    const state = makeRun();
    state.hunt = 10;
    startRound(state); // génère l'escouade du boss
    const boss = state.enemy.map((placement) => placement.unit.id);
    applyCombatResult(state, 'enemy');
    expect(state.hunt).toBe(10);
    expect(state.enemy.map((placement) => placement.unit.id)).toEqual(boss);
  });

  it('un boss vaincu donne un retire-objet et des récompenses doublées', () => {
    const state = makeRun();
    state.hunt = 10;
    applyCombatResult(state, 'player');
    expect(state.itemRemovers).toBe(1);
    expect(state.rewards?.find((option) => option.kind === 'zennys')).toMatchObject({ amount: 8 });
    const materials = state.rewards?.find((option) => option.kind === 'materials');
    expect(materials?.kind === 'materials' ? materials.materials : []).toHaveLength(2);
  });

  it('se termine par une défaite au 3e combat perdu', () => {
    const state = makeRun();
    for (let i = 0; i < 3; i++) applyCombatResult(state, 'enemy');
    expect(state).toMatchObject({ phase: 'over', outcome: 'defeat', defeats: 3 });
  });

  it('se termine par une victoire contre le boss de la chasse 30', () => {
    const state = makeRun();
    state.hunt = 30;
    applyCombatResult(state, 'player');
    expect(state).toMatchObject({ phase: 'over', outcome: 'victory' });
  });

  it('enchaîne achat, placement et vrai combat, de façon reproductible', () => {
    const play = () => {
      const state = createRun(21);
      buy(state, 0);
      buy(state, 1);
      state.units.forEach((unit, index) => moveUnit(state, unit.uid, board(2 + index, 5)));
      const outcome = fight(state);
      return { ok: outcome.ok, hunt: state.hunt, defeats: state.defeats, phase: state.phase, zennys: state.zennys };
    };
    const first = play();
    expect(first.ok).toBe(true);
    expect(first.hunt).toBe(2);
    expect(play()).toEqual(first);
  });

  it('ne laisse pas prendre une unité en récompense sans place en réserve', () => {
    const state = makeRun();
    for (let index = 0; index < 10; index++) giveUnit(state, 'odette', bench(index), 3);
    state.phase = 'reward';
    state.rewards = [{ kind: 'unit', unitId: 'khezu', copies: 1 }];
    expect(chooseReward(state, 0)).toMatchObject({ ok: false });
    expect(state.phase).toBe('reward');
  });
});

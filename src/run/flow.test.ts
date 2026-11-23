import { describe, expect, it } from 'vitest';
import { board, bench, findNode, giveUnit, makeRun, placeOnNode } from '../test-utils/run.ts';
import { applyCombatResult, chooseNode, chooseReward, createRun, fight, leaveNode } from './flow.ts';
import { currentNode, reachableNodes } from './map.ts';
import { buy } from './shop.ts';
import { moveUnit } from './roster.ts';

describe('déroulement d’une run', () => {
  it('commence sur la carte du stage 1, au niveau 2 avec 5 zennys, sans boutique ni escouade', () => {
    const state = createRun(7);
    expect(state).toMatchObject({ hunt: 1, defeats: 0, level: 2, zennys: 5, phase: 'map', outcome: null, path: [] });
    expect(state.map.stage).toBe(1);
    expect(state.shop).toEqual([]);
    expect(reachableNodes(state).map((node) => node.kind).every((kind) => kind === 'hunt')).toBe(true);
  });

  it('choisir une case de l’étape 1 lance la préparation : revenu du 1er tour, boutique et escouade de la case', () => {
    const state = createRun(7);
    expect(chooseNode(state, 0).ok).toBe(true);
    expect(state).toMatchObject({ phase: 'prep', zennys: 10, path: [0], hunt: 1 });
    expect(state.shop.filter((id) => id !== null)).toHaveLength(5);
    expect(state.enemy.map((placement) => placement.unit.id)).toEqual(currentNode(state)?.squad.map((placement) => placement.unit.id));
  });

  it('refuse une case qui n’est pas reliée à la position, ou un choix hors de la carte', () => {
    const state = makeRun();
    expect(chooseNode(state, 0)).toMatchObject({ ok: false }); // on est en préparation
    applyCombatResult(state, 'enemy'); // retour à la carte
    const current = currentNode(state);
    const unreachable = state.map.steps[1]?.findIndex((_, index) => !(current?.next ?? []).includes(index)) ?? -1;
    if (unreachable >= 0) expect(chooseNode(state, unreachable)).toMatchObject({ ok: false });
    expect(chooseNode(state, current?.next[0] ?? 0).ok).toBe(true);
    expect(state.hunt).toBe(2);
  });

  it('refuse de combattre sans unité sur le plateau', () => {
    expect(fight(makeRun())).toMatchObject({ ok: false });
  });

  it('après une victoire : récompense, retour à la carte, puis revenu avec le bonus de victoire', () => {
    const state = makeRun({ zennys: 0 });
    applyCombatResult(state, 'player');
    expect(state).toMatchObject({ phase: 'reward', hunt: 2, defeats: 0 });
    expect(state.rewards?.map((option) => option.kind)).toEqual(['materials', 'zennys', 'unit']);

    const zennysIndex = state.rewards?.findIndex((option) => option.kind === 'zennys') ?? -1;
    expect(chooseReward(state, zennysIndex).ok).toBe(true);
    expect(state).toMatchObject({ phase: 'map', zennys: 4, rewards: null });

    chooseNode(state, currentNode(state)?.next[0] ?? 0);
    // 4 zennys de récompense, puis revenu : 5 de base + 1 de victoire (intérêts : 0).
    expect(state).toMatchObject({ phase: 'prep', zennys: 10 });
  });

  it('après une défaite contre une chasse : pas de récompense, retour à la carte pour l’étape suivante', () => {
    const state = makeRun({ zennys: 0 });
    applyCombatResult(state, 'enemy');
    expect(state).toMatchObject({ phase: 'map', hunt: 2, defeats: 1, rewards: null, enemy: [] });
  });

  it('un boss perdu se réaffronte tout de suite, avec la même escouade', () => {
    const state = makeRun();
    placeOnNode(state, 10, 0);
    const boss = state.enemy.map((placement) => placement.unit.id);
    applyCombatResult(state, 'enemy');
    expect(state).toMatchObject({ hunt: 10, phase: 'prep' });
    expect(state.enemy.map((placement) => placement.unit.id)).toEqual(boss);
  });

  it('un boss vaincu donne un retire-objet, des récompenses doublées, puis la carte du stage suivant', () => {
    const state = makeRun();
    placeOnNode(state, 10, 0);
    applyCombatResult(state, 'player');
    expect(state.itemRemovers).toBe(1);
    expect(state.rewards?.find((option) => option.kind === 'zennys')).toMatchObject({ amount: 8 });
    const materials = state.rewards?.find((option) => option.kind === 'materials');
    expect(materials?.kind === 'materials' ? materials.materials : []).toHaveLength(2);

    chooseReward(state, state.rewards?.findIndex((option) => option.kind === 'zennys') ?? 0);
    expect(state).toMatchObject({ phase: 'map', hunt: 11, path: [] });
    expect(state.map.stage).toBe(2);
  });

  it('une quête urgente gagnée double les récompenses (sans retire-objet)', () => {
    const state = makeRun();
    const urgent = findNode(state, 'urgent');
    if (urgent === null) throw new Error('pas de quête urgente sur la carte');
    placeOnNode(state, urgent.step, urgent.index);
    applyCombatResult(state, 'player');
    expect(state.itemRemovers).toBe(0);
    expect(state.rewards?.find((option) => option.kind === 'zennys')).toMatchObject({ amount: 8 });
  });

  it('une case sans combat se quitte pour reprendre la route, sans combat possible', () => {
    const state = makeRun();
    const forge = findNode(state, 'forge');
    if (forge === null) throw new Error('pas de forge sur la carte');
    placeOnNode(state, forge.step, forge.index);
    giveUnit(state, 'barroth', board(3, 5));
    expect(fight(state)).toMatchObject({ ok: false });
    expect(leaveNode(state).ok).toBe(true);
    expect(state).toMatchObject({ phase: 'map', hunt: forge.step + 1, defeats: 0 });
  });

  it('on ne quitte pas une case de combat sans l’avoir livré', () => {
    expect(leaveNode(makeRun())).toMatchObject({ ok: false });
  });

  it('se termine par une défaite au 3e combat perdu', () => {
    const state = makeRun();
    for (let i = 0; i < 3; i++) {
      if (state.phase === 'map') chooseNode(state, currentNode(state)?.next[0] ?? 0);
      applyCombatResult(state, 'enemy');
    }
    expect(state).toMatchObject({ phase: 'over', outcome: 'defeat', defeats: 3 });
  });

  it('se termine par une victoire contre le boss de l’étape 30', () => {
    const state = makeRun();
    state.hunt = 30;
    applyCombatResult(state, 'player');
    expect(state).toMatchObject({ phase: 'over', outcome: 'victory' });
  });

  it('enchaîne choix de case, achat, placement et vrai combat, de façon reproductible', () => {
    const play = () => {
      const state = createRun(21);
      chooseNode(state, 0);
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
    for (let index = 0; index < 10; index++) giveUnit(state, 'minoto', bench(index), 3);
    state.phase = 'reward';
    state.rewards = [{ kind: 'unit', unitId: 'khezu', copies: 1 }];
    expect(chooseReward(state, 0)).toMatchObject({ ok: false });
    expect(state.phase).toBe('reward');
  });
});

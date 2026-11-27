import { describe, expect, it } from 'vitest';
import { REWARDS } from '../data/run-balance.ts';
import { board, bench, findNode, giveUnit, makeRun, placeOnNode, skipTalentChoice } from '../test-utils/run.ts';
import { applyCombatResult, chooseNode, chooseReward, createRun, fight, leaveNode } from './flow.ts';
import { currentNode, reachableNodes } from './map.ts';
import { buy } from './shop.ts';
import { moveUnit } from './roster.ts';
import type { RewardOption, RunState } from './state.ts';

/** Quantité de base de chaque type de récompense (exemplaires, objets, matériaux, retire-objets, zennys). */
const BASE_QUANTITY: Record<RewardOption['kind'], number> = {
  capture: REWARDS.captureCopies,
  unit: REWARDS.unitCopies,
  object: REWARDS.objects,
  materials: REWARDS.materials,
  itemRemovers: REWARDS.itemRemovers,
  zennys: REWARDS.zennys,
};

function quantities(option: RewardOption): number[] {
  switch (option.kind) {
    case 'capture':
      return option.targets.map((target) => target.copies);
    case 'unit':
      return [option.copies];
    case 'object':
      return [option.objects.length];
    case 'materials':
      return [option.materials.length];
    case 'itemRemovers':
    case 'zennys':
      return [option.amount];
  }
}

/** Toutes les récompenses proposées ont leur quantité de base multipliée par `multiplier`. */
function expectMultiplied(state: RunState, multiplier: number): void {
  expect(state.rewards).toHaveLength(3);
  for (const option of state.rewards ?? []) {
    for (const quantity of quantities(option)) expect(quantity, option.kind).toBe(BASE_QUANTITY[option.kind] * multiplier);
  }
}

describe('déroulement d’une run', () => {
  it('commence par un choix de talent, puis la carte du stage 1, au niveau 2 avec 5 zennys, sans boutique ni escouade', () => {
    const state = createRun(7);
    expect(state).toMatchObject({ hunt: 1, defeats: 0, level: 2, zennys: 5, phase: 'talent', outcome: null, path: [], talents: [] });
    expect(state.talentChoice?.offers).toHaveLength(3);
    skipTalentChoice(state);
    expect(state.map.stage).toBe(1);
    expect(state.shop).toEqual([]);
    expect(reachableNodes(state).map((node) => node.kind).every((kind) => kind === 'hunt')).toBe(true);
  });

  it('choisir une case de l’étape 1 lance la préparation : revenu du 1er tour, boutique et escouade de la case', () => {
    const state = skipTalentChoice(createRun(7));
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

  it('après une victoire : capture proposée, retour à la carte, puis revenu avec le bonus de victoire', () => {
    const state = makeRun({ zennys: 0 });
    const target = currentNode(state)?.squad[0]?.unit.id;
    applyCombatResult(state, 'player');
    expect(state).toMatchObject({ phase: 'reward', hunt: 2, defeats: 0 });
    const kinds = state.rewards?.map((option) => option.kind) ?? [];
    expect(kinds).toHaveLength(3);
    expect(kinds[0]).toBe('capture');
    expect(new Set(kinds).size).toBe(3);
    expectMultiplied(state, 1);

    // La capture prend par défaut le premier monstre proposé (le monstre cible).
    const capture = state.rewards?.[0];
    const captured = capture?.kind === 'capture' ? capture.targets[0]?.unitId : undefined;
    expect(captured).toBeDefined();
    if (state.enemy.length === 1) expect(captured).toBe(target);
    expect(chooseReward(state, 0).ok).toBe(true);
    expect(state).toMatchObject({ phase: 'map', zennys: 0, rewards: null });
    expect(state.units).toMatchObject([{ unitId: captured, rank: 1, location: { area: 'bench' } }]);

    chooseNode(state, currentNode(state)?.next[0] ?? 0);
    // Revenu : 5 de base + 1 de victoire (intérêts : 0).
    expect(state).toMatchObject({ phase: 'prep', zennys: 6 });
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
    expectMultiplied(state, 2);
    // ✅ La capture du boss des stages 1 et 2 est toujours proposée : 2 exemplaires ★1, le boss en premier.
    const boss = state.enemy.find((placement) => placement.rank === 3)?.unit.id;
    const capture = state.rewards?.[0];
    expect(capture?.kind).toBe('capture');
    expect(capture?.kind === 'capture' ? capture.targets[0] : null).toEqual({ unitId: boss, copies: 2 });

    expect(chooseReward(state, 0).ok).toBe(true);
    expect(state.units.filter((unit) => unit.unitId === boss)).toHaveLength(2);
    // Le stage 2 s'ouvre sur un choix de talent de chasseur, puis sur sa carte.
    expect(state).toMatchObject({ phase: 'talent', hunt: 11, path: [] });
    expect(state.map.stage).toBe(2);
    skipTalentChoice(state);
    expect(chooseNode(state, 0).ok).toBe(true);
  });

  it('une quête urgente gagnée double les récompenses (sans retire-objet)', () => {
    const state = makeRun();
    const urgent = findNode(state, 'urgent');
    if (urgent === null) throw new Error('pas de quête urgente sur la carte');
    placeOnNode(state, urgent.step, urgent.index);
    applyCombatResult(state, 'player');
    expect(state.itemRemovers).toBe(0);
    expectMultiplied(state, 2);
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
      const state = skipTalentChoice(createRun(21));
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

import { describe, expect, it } from 'vitest';
import { currentNode, reachableNodes } from '../../run/index.ts';
import { board, findNode, giveUnit, placeOnNode, skipTalentChoice } from '../../test-utils/run.ts';
import { RunController } from './controller.ts';
import { memoryRecordStore, type RecordStore } from './infinite-record.ts';

/** Contrôleur en début de run, choix de talent écarté (sur la carte du stage 1). */
function newController(): RunController {
  const controller = new RunController(21, memoryRecordStore());
  skipTalentChoice(controller.state);
  return controller;
}

/** Contrôleur sur la première case de la carte, avec deux unités achetées en réserve. */
function controllerWithUnits(): RunController {
  const controller = newController();
  controller.chooseNode(0);
  controller.buy(0);
  controller.buy(1);
  return controller;
}

describe('RunController', () => {
  it('commence sur la carte : on choisit sa case avant de préparer', () => {
    const controller = newController();
    expect(controller.canChooseNode).toBe(true);
    expect(controller.canPrepare).toBe(false);
    controller.chooseNode(1);
    expect(controller.state.path).toEqual([1]);
    expect(controller.canChooseNode).toBe(false);
    expect(controller.canPrepare).toBe(true);
  });

  it('sélectionne une unité de la réserve puis la pose sur une case libre du plateau', () => {
    const controller = controllerWithUnits();
    controller.clickBench(0);
    const uid = controller.selectedUnit()?.uid;
    expect(uid).toBeDefined();

    controller.clickBoard({ col: 3, row: 5 });

    expect(controller.selectedUnit()?.location).toEqual({ area: 'board', hex: { col: 3, row: 5 } });
    expect(controller.notice).toBeNull();
  });

  it('affiche la raison d’une action refusée', () => {
    const controller = newController();
    controller.chooseNode(0);
    controller.equip(0);
    expect(controller.notice).toMatch(/Sélectionne/);
    controller.launchFight();
    expect(controller.notice).toMatch(/au moins une unité/);
  });

  it('inspecte un monstre ennemi en cliquant dans son camp', () => {
    const controller = newController();
    controller.chooseNode(0);
    const enemy = controller.state.enemy[0];
    if (enemy === undefined) throw new Error('escouade vide');
    controller.clickBoard(enemy.position);
    expect(controller.selection).toEqual({ kind: 'enemy', index: 0 });
  });

  it('lance la chasse, bloque la préparation pendant le visionnage, puis revient à la carte', () => {
    const controller = controllerWithUnits();
    controller.clickBench(0);
    controller.clickBoard({ col: 3, row: 5 });
    controller.launchFight();

    expect(controller.watching).toMatchObject({ hunt: 1, boss: false, kind: 'hunt', before: { defeats: 0, itemRemovers: 0 } });
    expect(controller.canPrepare).toBe(false);

    if (controller.state.phase === 'reward') {
      controller.chooseReward(0);
    } else {
      controller.stopWatching();
    }
    expect(controller.watching).toBeNull();
    expect(controller.state.phase).toBe('map');
    expect(controller.canChooseNode).toBe(true);
    expect(reachableNodes(controller.state).length).toBeGreaterThan(0);
  });

  it('à la forge : choisit un matériau à reforger, le transforme, puis reprend la route', () => {
    const controller = newController();
    const { state } = controller;
    const forge = findNode(state, 'forge');
    if (forge === null) throw new Error('pas de forge sur la carte');
    placeOnNode(state, forge.step, forge.index);
    expect(currentNode(state)?.kind).toBe('forge');

    state.inventory = [{ kind: 'material', material: 'bone' }];
    controller.selectReforge(0);
    expect(controller.reforgeIndex).toBe(0);
    controller.reforge('gem');
    expect(state.inventory).toEqual([{ kind: 'material', material: 'gem' }]);
    expect(controller.reforgeIndex).toBeNull();

    controller.leaveNode();
    expect(state.phase).toBe('map');
    expect(state.hunt).toBe(forge.step + 1);
  });

  /** Run gagnée, mode infini lancé, puis 3e défaite à l'étape 31 avec un seul Fugen ★1 sur le plateau. */
  function loseInInfinite(store: RecordStore): RunController {
    const controller = new RunController(21, store);
    const { state } = controller;
    Object.assign(state, { phase: 'over', outcome: 'victory', hunt: 30, defeats: 2 });
    controller.continueInfinite();
    expect(state).toMatchObject({ phase: 'reward', infinite: true, hunt: 31 });
    controller.chooseReward(0);
    expect(state.map.stage).toBe(4);
    controller.chooseNode(0);
    giveUnit(state, 'fugen', board(3, 5));
    controller.launchFight();
    expect(state).toMatchObject({ phase: 'over', outcome: 'defeat', infinite: true, hunt: 31 });
    return controller;
  }

  it('mode infini : continue après une run gagnée et enregistre un nouveau record à la 3e défaite', () => {
    const store = memoryRecordStore();
    const controller = loseInInfinite(store);
    expect(controller.newRecord).toBe(true);
    expect(controller.infiniteRecord).toBe(31);
    expect(store.load()).toBe(31);
  });

  it('mode infini : un record plus haut est gardé', () => {
    const store = memoryRecordStore(50);
    const controller = loseInInfinite(store);
    expect(controller.newRecord).toBe(false);
    expect(controller.infiniteRecord).toBe(50);
    expect(store.load()).toBe(50);
  });

  it('talents : relance une proposition, puis en prend une et passe à la carte', () => {
    const controller = new RunController(21, memoryRecordStore());
    expect(controller.state.phase).toBe('talent');
    expect(controller.canChooseNode).toBe(false);
    controller.rerollTalent(2);
    expect(controller.state.talentChoice?.offers[2]?.rerolled).toBe(true);
    controller.rerollTalent(2);
    expect(controller.notice).not.toBeNull();
    controller.chooseTalent(0);
    expect(controller.state.talents).toHaveLength(1);
    expect(controller.canChooseNode).toBe(true);
  });

  it('recommence une run de zéro, sur le choix de talent du stage 1', () => {
    const controller = controllerWithUnits();
    controller.newRun(5);
    expect(controller.state.units).toEqual([]);
    expect(controller.state).toMatchObject({ hunt: 1, zennys: 5, seed: 5, phase: 'talent', talents: [] });
  });
});

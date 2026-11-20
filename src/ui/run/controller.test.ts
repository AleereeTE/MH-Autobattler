import { describe, expect, it } from 'vitest';
import { RunController } from './controller.ts';

/** Contrôleur avec deux unités achetées en réserve. */
function controllerWithUnits(): RunController {
  const controller = new RunController(21);
  controller.buy(0);
  controller.buy(1);
  return controller;
}

describe('RunController', () => {
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
    const controller = new RunController(21);
    controller.equip(0);
    expect(controller.notice).toMatch(/Sélectionne/);
    controller.launchFight();
    expect(controller.notice).toMatch(/au moins une unité/);
  });

  it('inspecte un monstre ennemi en cliquant dans son camp', () => {
    const controller = new RunController(21);
    const enemy = controller.state.enemy[0];
    if (enemy === undefined) throw new Error('escouade vide');
    controller.clickBoard(enemy.position);
    expect(controller.selection).toEqual({ kind: 'enemy', index: 0 });
  });

  it('lance la chasse, bloque la préparation pendant le visionnage, puis y revient', () => {
    const controller = controllerWithUnits();
    controller.clickBench(0);
    controller.clickBoard({ col: 3, row: 5 });
    controller.launchFight();

    expect(controller.watching).toMatchObject({ hunt: 1, boss: false, before: { defeats: 0, itemRemovers: 0 } });
    expect(controller.canPrepare).toBe(false);

    if (controller.state.phase === 'reward') {
      const zennys = controller.state.rewards?.findIndex((option) => option.kind === 'zennys') ?? -1;
      controller.chooseReward(zennys);
    } else {
      controller.stopWatching();
    }
    expect(controller.watching).toBeNull();
    expect(controller.state.phase).toBe('prep');
    expect(controller.canPrepare).toBe(true);
  });

  it('recommence une run de zéro', () => {
    const controller = controllerWithUnits();
    controller.newRun(5);
    expect(controller.state.units).toEqual([]);
    expect(controller.state).toMatchObject({ hunt: 1, zennys: 10, seed: 5 });
  });
});

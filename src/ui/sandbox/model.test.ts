import { describe, expect, it } from 'vitest';
import { SandboxModel } from './model.ts';

/** Pose une unité de la liste sur une case et la sélectionne. */
function placeAndSelect(model: SandboxModel, unitId: string, col: number, row: number): void {
  model.selectPalette(unitId);
  model.clickCell({ col, row });
  model.clickCell({ col, row });
}

describe('SandboxModel — rangs ★', () => {
  it('pose les unités au ★1, puis change le rang de l’unité sélectionnée', () => {
    const model = new SandboxModel();
    placeAndSelect(model, 'rathalos', 3, 5);
    expect(model.selectedPlaced()?.rank).toBe(1);

    model.setSelectedRank(3);

    expect(model.selectedPlaced()?.rank).toBe(3);
    expect(model.toSetup().player[0]?.rank).toBe(3);
  });

  it('mémorise le rang et accepte les compositions enregistrées sans rang', () => {
    const model = new SandboxModel();
    placeAndSelect(model, 'khezu', 2, 4);
    model.setSelectedRank(2);
    expect(model.save()).toMatchObject([{ unitId: 'khezu', rank: 2 }]);

    const restored = new SandboxModel();
    restored.restore([
      { unitId: 'khezu', col: 2, row: 4, equipment: [] },
      { unitId: 'barroth', col: 3, row: 4, equipment: [], rank: 7 as unknown as 1 },
      { unitId: 'legiana', col: 4, row: 4, equipment: [], rank: 2 },
    ]);
    expect(restored.placedUnits().map((placed) => placed.rank)).toEqual([1, 1, 2]);
  });
});

describe('SandboxModel — un seul Dragon noir par camp', () => {
  it('refuse d’en poser un 2e dans le même camp, mais pas dans l’autre', () => {
    const model = new SandboxModel();
    model.selectPalette('fatalis');
    model.clickCell({ col: 2, row: 5 });
    model.selectPalette('alatreon');
    model.clickCell({ col: 3, row: 5 });

    expect(model.notice).toBe('Un seul Dragon noir par plateau.');
    expect(model.placedUnits().map((placed) => placed.unit.id)).toEqual(['fatalis']);

    // Alatreon reste choisi dans la liste après le refus : on le pose dans le camp ennemi.
    model.clickCell({ col: 3, row: 2 });
    expect(model.placedUnits().map((placed) => placed.unit.id)).toEqual(['fatalis', 'alatreon']);
  });
});

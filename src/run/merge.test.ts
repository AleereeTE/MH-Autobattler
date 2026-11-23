import { describe, expect, it } from 'vitest';
import { board, bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { regroupEquipment, resolveMerges } from './merge.ts';

describe('fusion automatique', () => {
  it('fusionne 3 exemplaires ★1 en un ★2, à la place de celui posé sur le plateau', () => {
    const state = makeRun();
    giveUnit(state, 'barroth', bench(0));
    const onBoard = giveUnit(state, 'barroth', board(3, 5));
    giveUnit(state, 'barroth', bench(4));
    giveUnit(state, 'khezu', bench(1));

    resolveMerges(state);

    const barroths = state.units.filter((unit) => unit.unitId === 'barroth');
    expect(barroths).toHaveLength(1);
    expect(barroths[0]).toMatchObject({ uid: onBoard.uid, rank: 2, location: board(3, 5) });
    expect(state.units).toHaveLength(2);
  });

  it('garde la place de réserve la plus à gauche si aucun exemplaire n’est sur le plateau', () => {
    const state = makeRun();
    giveUnit(state, 'khezu', bench(6));
    giveUnit(state, 'khezu', bench(2));
    giveUnit(state, 'khezu', bench(9));
    resolveMerges(state);
    expect(state.units).toMatchObject([{ rank: 2, location: bench(2) }]);
  });

  it('enchaîne une fusion ★2 en ★3', () => {
    const state = makeRun();
    giveUnit(state, 'rathalos', bench(0), 2);
    giveUnit(state, 'rathalos', bench(1), 2);
    for (const index of [2, 3, 4]) giveUnit(state, 'rathalos', bench(index));
    resolveMerges(state);
    expect(state.units).toMatchObject([{ unitId: 'rathalos', rank: 3 }]);
  });

  it('ne fusionne pas des rangs différents', () => {
    const state = makeRun();
    giveUnit(state, 'olivia', bench(0), 2);
    giveUnit(state, 'olivia', bench(1));
    giveUnit(state, 'olivia', bench(2));
    resolveMerges(state);
    expect(state.units).toHaveLength(3);
  });

  it('regroupe l’équipement dans la limite des emplacements et rend le surplus à l’inventaire', () => {
    const state = makeRun();
    giveUnit(state, 'anjanath', bench(0), 1, [{ kind: 'object', materials: ['bone', 'bone'] }]);
    giveUnit(state, 'anjanath', bench(1), 1, [{ kind: 'material', material: 'gem' }]);
    giveUnit(state, 'anjanath', bench(2), 1, [{ kind: 'object', materials: ['horn', 'fang'] }]);
    resolveMerges(state);
    // Un monstre n'a qu'un emplacement : il garde son objet, le reste part à l'inventaire.
    expect(state.units[0]?.equipment).toEqual([{ kind: 'object', materials: ['bone', 'bone'] }]);
    expect(state.inventory).toEqual([
      { kind: 'object', materials: ['horn', 'fang'] },
      { kind: 'material', material: 'gem' },
    ]);
  });
});

describe('regroupEquipment', () => {
  it('pose les objets puis les matériaux, qui fusionnent avec un matériau seul', () => {
    const { equipment, overflow } = regroupEquipment(
      [{ kind: 'material', material: 'bone' }],
      [[{ kind: 'material', material: 'gem' }], [{ kind: 'object', materials: ['horn', 'fang'] }]],
      3,
    );
    expect(equipment).toEqual([
      { kind: 'object', materials: ['bone', 'gem'] },
      { kind: 'object', materials: ['horn', 'fang'] },
    ]);
    expect(overflow).toEqual([]);
  });
});

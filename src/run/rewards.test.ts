import { describe, expect, it } from 'vitest';
import type { Placement } from '../combat/index.ts';
import { SIGNATURE_OBJECTS } from '../data/items.ts';
import { REWARDS } from '../data/run-balance.ts';
import { findUnit } from '../data/units/index.ts';
import { makeRun } from '../test-utils/run.ts';
import { applyReward, drawRewards } from './rewards.ts';

function placement(unitId: string): Placement {
  const unit = findUnit(unitId);
  if (unit === undefined) throw new Error(`unité inconnue : ${unitId}`);
  return { unit, position: { col: 0, row: 0 } };
}

describe('drawRewards', () => {
  it('propose toujours la capture en premier, puis deux autres récompenses de types différents', () => {
    const state = makeRun();
    state.enemy = [placement('khezu'), placement('rathalos')];
    for (let i = 0; i < 100; i++) {
      const kinds = drawRewards(state).map((option) => option.kind);
      expect(kinds).toHaveLength(3);
      expect(kinds[0]).toBe('capture');
      expect(new Set(kinds).size).toBe(3);
    }
  });

  it('sans monstre capturable (Dragon ancien seul), tire trois types différents', () => {
    const state = makeRun();
    state.enemy = [placement('kirin')];
    for (let i = 0; i < 100; i++) {
      const kinds = drawRewards(state).map((option) => option.kind);
      expect(kinds).toHaveLength(3);
      expect(kinds).not.toContain('capture');
      expect(new Set(kinds).size).toBe(3);
    }
  });

  it('finit par proposer chaque type de récompense, toujours dans le même ordre d’affichage', () => {
    const state = makeRun();
    state.enemy = [placement('kirin')];
    const order = ['unit', 'object', 'materials', 'itemRemovers', 'zennys'];
    const seen = new Set<string>();
    for (let i = 0; i < 300; i++) {
      const kinds = drawRewards(state).map((option) => option.kind);
      kinds.forEach((kind) => seen.add(kind));
      expect([...kinds].sort((a, b) => order.indexOf(a) - order.indexOf(b))).toEqual(kinds);
    }
    expect([...seen].sort()).toEqual([...order].sort());
  });

  it('les poids de tirage font 100', () => {
    expect(Object.values(REWARDS.weights).reduce((sum, weight) => sum + weight, 0)).toBe(100);
  });
});

describe('applyReward', () => {
  it('un objet fusionné rejoint l’inventaire', () => {
    const state = makeRun();
    const materials = SIGNATURE_OBJECTS[0]?.materials;
    if (materials === undefined) throw new Error('aucun objet');
    expect(applyReward(state, { kind: 'object', objects: [materials, materials] }).ok).toBe(true);
    expect(state.inventory).toEqual([
      { kind: 'object', materials },
      { kind: 'object', materials },
    ]);
  });

  it('les retire-objets et les zennys s’ajoutent tout de suite', () => {
    const state = makeRun({ zennys: 10 });
    applyReward(state, { kind: 'itemRemovers', amount: 2 });
    applyReward(state, { kind: 'zennys', amount: 4 });
    expect(state).toMatchObject({ itemRemovers: 2, zennys: 14 });
  });
});

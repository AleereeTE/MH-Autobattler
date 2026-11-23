import { describe, expect, it } from 'vitest';
import { bench, giveUnit, makeRun } from '../test-utils/run.ts';
import { equipFromInventory, unequip } from './inventory.ts';

describe('inventaire et équipement', () => {
  it('pose des matériaux : le second fusionne avec le premier en objet', () => {
    const state = makeRun();
    const hunter = giveUnit(state, 'olivia', bench(0));
    state.inventory = [
      { kind: 'material', material: 'bone' },
      { kind: 'material', material: 'membrane' },
    ];
    expect(equipFromInventory(state, 0, hunter.uid).ok).toBe(true);
    expect(equipFromInventory(state, 0, hunter.uid).ok).toBe(true);
    expect(hunter.equipment).toEqual([{ kind: 'object', materials: ['bone', 'membrane'] }]);
    expect(state.inventory).toEqual([]);
  });

  it('refuse quand les emplacements sont pleins (1 pour un monstre)', () => {
    const state = makeRun();
    const monster = giveUnit(state, 'khezu', bench(0), 1, [{ kind: 'object', materials: ['gem', 'gem'] }]);
    state.inventory = [{ kind: 'object', materials: ['horn', 'fang'] }];
    expect(equipFromInventory(state, 0, monster.uid).ok).toBe(false);
    expect(state.inventory).toHaveLength(1);
  });

  it('retire un matériau gratuitement, un objet contre un retire-objet', () => {
    const state = makeRun();
    const hunter = giveUnit(state, 'fabius', bench(0), 1, [
      { kind: 'material', material: 'horn' },
      { kind: 'object', materials: ['gem', 'gem'] },
    ]);
    expect(unequip(state, hunter.uid, 0).ok).toBe(true);
    expect(unequip(state, hunter.uid, 0)).toMatchObject({ ok: false });
    state.itemRemovers = 1;
    expect(unequip(state, hunter.uid, 0).ok).toBe(true);
    expect(state.itemRemovers).toBe(0);
    expect(hunter.equipment).toEqual([]);
    expect(state.inventory).toHaveLength(2);
  });
});

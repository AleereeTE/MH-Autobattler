import { describe, expect, it } from 'vitest';
import { UNITS } from '../../data/units/index.ts';
import { makeUnit } from '../../test-utils/factories.ts';
import { availableCosts, paletteGroups, toggleCostFilter } from './palette-groups.ts';

describe('liste des unités du bac à sable', () => {
  const units = [
    makeUnit({ id: 'c', name: 'Zinogre', cost: 4 }),
    makeUnit({ id: 'a', name: 'Kulu', cost: 1 }),
    makeUnit({ id: 'b', name: 'Barroth', cost: 1 }),
    makeUnit({ id: 'd', name: 'Fatalis', cost: 6 }),
  ];

  it('liste les coûts présents, du moins cher au plus cher', () => {
    expect(availableCosts(units)).toEqual([1, 4, 6]);
    expect(availableCosts(UNITS)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('sans filtre, groupe toutes les unités par coût croissant, triées par nom', () => {
    const groups = paletteGroups(units, null);
    expect(groups.map((group) => group.cost)).toEqual([1, 4, 6]);
    expect(groups[0]?.units.map((unit) => unit.name)).toEqual(['Barroth', 'Kulu']);
    expect(groups.flatMap((group) => group.units)).toHaveLength(units.length);
  });

  it('avec un filtre, ne garde que les unités du coût choisi', () => {
    const groups = paletteGroups(UNITS, 5);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.units.length).toBeGreaterThan(0);
    expect(groups[0]?.units.every((unit) => unit.cost === 5)).toBe(true);
    expect(groups[0]?.units).toHaveLength(UNITS.filter((unit) => unit.cost === 5).length);
  });

  it('un filtre sur un coût absent donne une liste vide', () => {
    expect(paletteGroups(units, 2)).toEqual([]);
  });

  it('recliquer sur le coût actif réaffiche toutes les unités', () => {
    expect(toggleCostFilter(null, 3)).toBe(3);
    expect(toggleCostFilter(3, 5)).toBe(5);
    expect(toggleCostFilter(5, 5)).toBeNull();
    expect(toggleCostFilter(5, null)).toBeNull();
  });
});

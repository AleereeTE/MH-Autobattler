import { describe, expect, it } from 'vitest';
import { TRAITS, findTrait } from '../data/traits.ts';
import { UNITS } from '../data/units/index.ts';
import { makeUnit } from '../test-utils/factories.ts';
import { isBlackDragon } from './board-limits.ts';
import { activeTier, countTraits, traitStatuses, unitTraitIds } from './traits.ts';

describe('unitTraitIds', () => {
  it('commence par le trait d’élément, puis les traits secondaires', () => {
    expect(unitTraitIds(makeUnit({ element: 'fire', traits: ['guild'] }))).toEqual(['fire', 'guild']);
  });

  it('donne « Sans élément » aux unités sans élément', () => {
    expect(unitTraitIds(makeUnit({ element: null }))[0]).toBe('neutral');
  });
});

describe('countTraits', () => {
  it('ne compte qu’une fois deux exemplaires de la même unité', () => {
    const anjanath = makeUnit({ id: 'anjanath', element: 'fire' });
    const rathalos = makeUnit({ id: 'rathalos', element: 'fire' });
    expect(countTraits([anjanath, anjanath, rathalos]).get('fire')).toBe(2);
  });
});

describe('activeTier', () => {
  it('renvoie le plus haut palier atteint', () => {
    const guild = findTrait('guild');
    if (guild === undefined) throw new Error('trait Guilde manquant');
    expect(activeTier(guild, 1)).toBeNull();
    expect(activeTier(guild, 3)?.count).toBe(2);
    expect(activeTier(guild, 5)?.count).toBe(4);
  });
});

describe('traitStatuses', () => {
  it('liste les traits actifs en premier', () => {
    const statuses = traitStatuses([
      makeUnit({ id: 'a', element: 'ice', traits: ['bastion'] }),
      makeUnit({ id: 'b', element: 'ice', traits: ['catalyst'] }),
    ]);
    expect(statuses[0]).toMatchObject({ count: 2, trait: { id: 'ice' } });
    expect(statuses.slice(1).every((status) => status.tier === null)).toBe(true);
  });
});

describe('paliers des traits', () => {
  const thresholds = (id: string) => findTrait(id)?.tiers.map((tier) => tier.count);

  it('2 / 4 / 6 pour les traits d’au moins 6 unités, 2 / 4 pour Feu et Glace, 2 / 3 pour les petites familles', () => {
    for (const id of ['thunder', 'water', 'dragon', 'neutral', 'guild', 'berserker', 'bastion', 'catalyst', 'flying-wyvern']) {
      expect(thresholds(id), id).toEqual([2, 4, 6]);
    }
    for (const id of ['fire', 'ice']) expect(thresholds(id), id).toEqual([2, 4]);
    for (const id of ['leviathan', 'brute-wyvern']) expect(thresholds(id), id).toEqual([2, 3]);
    expect(thresholds('elder-dragon')).toEqual([1, 2, 3]);
    expect(thresholds('black-dragon')).toEqual([1]);
  });

  it('chaque palier peut être atteint avec les unités du jeu (un seul Dragon noir par plateau)', () => {
    for (const trait of TRAITS) {
      const members = UNITS.filter((unit) => unitTraitIds(unit).includes(trait.id));
      const blackDragons = members.filter(isBlackDragon).length;
      const reachable = members.length - blackDragons + Math.min(1, blackDragons);
      const highest = trait.tiers.at(-1)?.count ?? 0;
      expect(reachable, trait.name).toBeGreaterThanOrEqual(highest);
    }
  });
});

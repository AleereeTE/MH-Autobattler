import { describe, expect, it } from 'vitest';
import { findTrait } from '../data/traits.ts';
import { makeUnit } from '../test-utils/factories.ts';
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

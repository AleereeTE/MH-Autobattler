import { describe, expect, it } from 'vitest';
import { findTrait, type TraitDefinition } from '../../data/traits.ts';
import { activeTier } from '../../rules/traits.ts';
import { traitMedal } from './trait-medals.ts';

function trait(id: string): TraitDefinition {
  const found = findTrait(id);
  if (found === undefined) throw new Error(`trait ${id} manquant`);
  return found;
}

/** Couleur obtenue avec `count` unités du trait. */
const medalAt = (id: string, count: number) => traitMedal(trait(id), activeTier(trait(id), count));

describe('couleur des paliers de trait', () => {
  it('trait à 3 paliers : bronze, argent puis or', () => {
    expect(medalAt('water', 1)).toBeNull();
    expect(medalAt('water', 2)).toBe('bronze');
    expect(medalAt('water', 3)).toBe('bronze');
    expect(medalAt('water', 4)).toBe('silver');
    expect(medalAt('water', 6)).toBe('gold');
  });

  it('trait à 2 paliers : bronze puis or (le dernier palier est toujours or)', () => {
    expect(medalAt('fire', 2)).toBe('bronze');
    expect(medalAt('fire', 4)).toBe('gold');
    expect(medalAt('leviathan', 3)).toBe('gold');
  });

  it('trait à 1 seul palier : or d’emblée', () => {
    expect(medalAt('black-dragon', 1)).toBe('gold');
  });

  it('pas de couleur pour un palier qui n’appartient pas au trait', () => {
    const fireTier = trait('fire').tiers[0] ?? null;
    expect(traitMedal(trait('water'), fireTier)).toBeNull();
  });
});

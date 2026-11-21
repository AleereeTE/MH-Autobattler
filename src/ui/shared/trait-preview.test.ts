import { describe, expect, it } from 'vitest';
import { findTrait, type TraitDefinition } from '../../data/traits.ts';
import { tierRows, traitCategory, traitMembers } from './trait-preview.ts';

function trait(id: string): TraitDefinition {
  const found = findTrait(id);
  if (found === undefined) throw new Error(`trait ${id} manquant`);
  return found;
}

describe('aperçu d’un trait', () => {
  it('donne à chaque palier sa couleur : bronze, argent, or', () => {
    expect(tierRows(trait('thunder'), null).map((row) => [row.tier.count, row.medal])).toEqual([
      [2, 'bronze'],
      [4, 'silver'],
      [6, 'gold'],
    ]);
    expect(tierRows(trait('fire'), null).map((row) => row.medal)).toEqual(['bronze', 'gold']);
  });

  it('sans équipe, aucun palier n’est mis en avant', () => {
    expect(tierRows(trait('water'), null).every((row) => row.state === 'neutral')).toBe(true);
  });

  it('avec une équipe : palier actif, paliers dépassés et paliers à atteindre', () => {
    expect(tierRows(trait('water'), 5).map((row) => row.state)).toEqual(['reached', 'active', 'locked']);
    expect(tierRows(trait('water'), 1).map((row) => row.state)).toEqual(['locked', 'locked', 'locked']);
    expect(tierRows(trait('water'), 6).map((row) => row.state)).toEqual(['reached', 'reached', 'active']);
  });

  it('liste les unités qui portent le trait, élément ou trait secondaire', () => {
    const water = traitMembers('water');
    expect(water).toHaveLength(6);
    expect(water.every((unit) => unit.element === 'water')).toBe(true);
    const guild = traitMembers('guild');
    expect(guild.every((unit) => unit.traits.includes('guild'))).toBe(true);
    expect(guild.map((unit) => unit.cost)).toEqual([...guild.map((unit) => unit.cost)].sort((a, b) => a - b));
  });

  it('indique s’il s’agit d’un élément ou d’un trait secondaire, et à qui il est réservé', () => {
    expect(traitCategory(trait('fire'))).toBe('Élément');
    expect(traitCategory(trait('guild'))).toBe('Trait secondaire · chasseurs uniquement');
    expect(traitCategory(trait('leviathan'))).toBe('Trait secondaire · monstres uniquement');
    expect(traitCategory(trait('berserker'))).toBe('Trait secondaire');
  });
});

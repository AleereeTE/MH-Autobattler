import { describe, expect, it } from 'vitest';
import { TALENTS, TALENT_TIERS, TALENT_TRAIT_EXCLUDED, talentNeedsTrait, talentUnitEffect } from './talents.ts';
import { TRAITS } from './traits.ts';

describe('talents de chasseur', () => {
  it('24 talents, 8 par rareté, aux identifiants uniques', () => {
    expect(TALENTS).toHaveLength(24);
    for (const tier of TALENT_TIERS) expect(TALENTS.filter((talent) => talent.tier === tier)).toHaveLength(8);
    expect(new Set(TALENTS.map((talent) => talent.id)).size).toBe(TALENTS.length);
  });

  it('chaque rareté couvre les cinq familles d’effets', () => {
    for (const tier of TALENT_TIERS) {
      const families = new Set(TALENTS.filter((talent) => talent.tier === tier).map((talent) => talent.family));
      expect([...families].sort()).toEqual(['combat', 'economy', 'items', 'traits', 'units']);
    }
  });

  it('la description cite le trait ou l’unité tirés exactement quand le talent en tire un', () => {
    for (const talent of TALENTS) {
      expect(talent.description.includes('{trait}'), talent.name).toBe(talentNeedsTrait(talent));
      expect(talent.description.includes('{unit}'), talent.name).toBe(talentUnitEffect(talent) !== undefined);
    }
  });

  it('les traits exclus existent', () => {
    for (const id of TALENT_TRAIT_EXCLUDED) expect(TRAITS.some((trait) => trait.id === id)).toBe(true);
  });
});

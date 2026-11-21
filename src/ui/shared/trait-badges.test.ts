import { describe, expect, it } from 'vitest';
import { TRAITS } from '../../data/traits.ts';
import { TRAIT_BADGES } from './trait-styles.ts';

describe('insignes des traits', () => {
  it('donne un insigne à chaque trait du jeu', () => {
    for (const trait of TRAITS) expect(TRAIT_BADGES[trait.id], trait.name).toBeDefined();
  });

  it('utilise un symbole différent pour chaque trait', () => {
    const symbols = TRAITS.map((trait) => TRAIT_BADGES[trait.id]?.symbol);
    expect(new Set(symbols).size).toBe(symbols.length);
  });
});

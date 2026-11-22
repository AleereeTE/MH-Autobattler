import { describe, expect, it } from 'vitest';
import { makeUnit } from '../test-utils/factories.ts';
import { isStarRank, rankMultiplier, rankStars, rankedStats, ratioForRank, skillRatioMultiplier, valueForRank } from './ranks.ts';

describe('rangs ★', () => {
  it('multiplie PV et attaque brute par 1,8 à chaque rang', () => {
    expect(rankMultiplier(1)).toBe(1);
    expect(rankMultiplier(2)).toBeCloseTo(1.8);
    expect(rankMultiplier(3)).toBeCloseTo(3.24);
  });

  it('ne change que les PV et l’attaque brute', () => {
    const base = makeUnit({ stats: { hp: 500, attack: 50, elementalPower: 30, armor: 20, attackSpeed: 0.8 } }).stats;
    const ranked = rankedStats(base, 2);
    expect(ranked.hp).toBeCloseTo(900);
    expect(ranked.attack).toBeCloseTo(90);
    expect({ ...ranked, hp: base.hp, attack: base.attack }).toEqual(base);
  });

  it('augmente les pourcentages des compétences : ×1, ×1,25 puis ×1,5', () => {
    expect([1, 2, 3].map((rank) => skillRatioMultiplier(rank as 1 | 2 | 3))).toEqual([1, 1.25, 1.5]);
    expect(ratioForRank(2.5, 2)).toBeCloseTo(3.125);
    expect(ratioForRank(2.5, 3)).toBeCloseTo(3.75);
  });

  it('choisit la valeur du rang dans une liste [★1, ★2, ★3]', () => {
    const values = [60, 90, 135] as const;
    expect([valueForRank(values, 1), valueForRank(values, 2), valueForRank(values, 3)]).toEqual([60, 90, 135]);
  });

  it('reconnaît un rang valide et l’affiche en étoiles', () => {
    expect([1, 2, 3].every(isStarRank)).toBe(true);
    expect([0, 4, '2', null].some(isStarRank)).toBe(false);
    expect(rankStars(3)).toBe('★★★');
  });
});

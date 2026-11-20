import { describe, expect, it } from 'vitest';
import { makeUnit } from '../test-utils/factories.ts';
import { applyCrit, mitigate, scaledAmount } from './damage.ts';

describe('mitigate', () => {
  it('ne réduit rien sans défense', () => {
    expect(mitigate(100, 0)).toBe(100);
  });

  it('divise les dégâts par deux avec 100 de défense', () => {
    expect(mitigate(100, 100)).toBe(50);
  });

  it('applique le ratio 100 / (100 + défense)', () => {
    expect(mitigate(90, 50)).toBeCloseTo(60);
  });

  it('traite une défense négative comme 0', () => {
    expect(mitigate(100, -30)).toBe(100);
  });
});

describe('applyCrit', () => {
  it('multiplie les dégâts par 1,5 par défaut', () => {
    expect(applyCrit(100)).toBe(150);
  });
});

describe('scaledAmount', () => {
  it('additionne la base et chaque ratio', () => {
    const { stats } = makeUnit({ stats: { attack: 100, elementalPower: 40 } });
    const damage = scaledAmount(
      {
        base: 50,
        ratios: [
          { stat: 'attack', ratio: 1.5 },
          { stat: 'elementalPower', ratio: 0.5 },
        ],
      },
      stats,
    );
    expect(damage).toBe(50 + 150 + 20);
  });
});

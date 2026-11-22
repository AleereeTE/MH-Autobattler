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
  const effect = {
    base: [50, 75, 115],
    ratios: [
      { stat: 'attack', ratio: 1.5 },
      { stat: 'elementalPower', ratio: 0.5 },
    ],
  } as const;

  it('additionne la base et chaque ratio', () => {
    const { stats } = makeUnit({ stats: { attack: 100, elementalPower: 40 } });
    expect(scaledAmount(effect, stats, 1)).toBe(50 + 150 + 20);
  });

  it('prend la base du rang, et des pourcentages ×1,25 au ★2 puis ×1,5 au ★3', () => {
    const { stats } = makeUnit({ stats: { attack: 100, elementalPower: 40 } });
    expect(scaledAmount(effect, stats, 2)).toBe(75 + (150 + 20) * 1.25);
    expect(scaledAmount(effect, stats, 3)).toBe(115 + (150 + 20) * 1.5);
  });
});

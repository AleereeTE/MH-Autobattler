import { describe, expect, it } from 'vitest';
import { MATERIALS } from '../../data/items.ts';
import { objectBonuses } from '../../rules/recipes.ts';
import { describeBonuses } from './bonus-text.ts';

describe('describeBonuses', () => {
  it('écrit chaque bonus en français, avec la virgule décimale', () => {
    expect(describeBonuses([{ attack: 15 }])).toEqual(['+15 attaque brute']);
    expect(describeBonuses([{ critChance: 0.1 }, { critMultiplier: 0.3 }])).toEqual([
      '+10 % de chance de critique',
      'multiplicateur critique +0,3',
    ]);
    expect(describeBonuses([{ damageReduction: 0.15 }])).toEqual(['−15 % de dégâts subis']);
  });

  it('additionne les bonus d’un objet (matériaux + effet)', () => {
    // Plume + Os = Agitateur : +10 % vitesse, +15 attaque, puis +3 %/s jusqu'à +45 %
    expect(describeBonuses(objectBonuses(['feather', 'bone']))).toEqual([
      '+15 attaque brute',
      '+10 % de vitesse d’attaque',
      '+3 % de vitesse d’attaque par seconde de combat (max +45 %)',
    ]);
  });

  it('décrit chaque matériau', () => {
    for (const material of Object.values(MATERIALS)) expect(describeBonuses([material.bonus])).toHaveLength(1);
  });
});

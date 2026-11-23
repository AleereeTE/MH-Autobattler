import { describe, expect, it } from 'vitest';
import { MATERIALS, SIGNATURE_OBJECTS } from '../../data/items.ts';
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

describe('describeBonuses — objets du lot 1', () => {
  it('décrit les nouveaux effets', () => {
    expect(describeBonuses([{ range: 1 }])).toEqual(['+1 de portée']);
    expect(describeBonuses([{ maxEnergyPercent: -0.2 }])).toEqual(['−20 % d’énergie maximale']);
    expect(describeBonuses([{ lifesteal: 0.15 }])).toEqual(['se soigne de 15 % des dégâts infligés']);
    expect(describeBonuses([{ armorShredPerAttack: 4, armorShredMax: 24 }])).toEqual(['chaque attaque de base retire 4 armure à la cible (max −24)']);
    expect(describeBonuses([{ latentCritChance: 0.3, latentAttackSpeedPercent: 0.2 }])).toEqual([
      'après 10 s de combat : +30 % de critique et +20 % de vitesse d’attaque',
    ]);
  });

  it('décrit les effets du lot 2', () => {
    expect(describeBonuses([{ guardReduction: 0.2 }])).toEqual(['attaques de base subies : jamais critiques, −20 % de dégâts']);
    expect(describeBonuses([{ regenPercentPerSecond: 0.015 }])).toEqual(['régénère 1,5 % des PV max par seconde']);
    expect(describeBonuses([{ postCastDefense: 30 }])).toEqual(['après chaque compétence : +30 armure et résistance élémentaire pendant 4 s']);
  });

  it('décrit les effets du lot 3', () => {
    expect(describeBonuses([{ statusImmunity: 1 }])).toEqual(['immunité à la brûlure, aux ralentissements, au poison et à la paralysie']);
    expect(describeBonuses([{ paralysisChance: 0.1 }])).toEqual(['10 % de chances de paralyser la cible 1,5 s']);
    expect(describeBonuses([{ allyEnergyOnCast: 10 }])).toEqual(['après sa compétence : +10 énergie aux alliés à 2 cases']);
  });

  it('chaque objet codé a au moins une ligne d’effet en plus de ses matériaux', () => {
    for (const object of SIGNATURE_OBJECTS) {
      expect(describeBonuses([object.effect]).length, object.name).toBeGreaterThan(0);
    }
  });
});

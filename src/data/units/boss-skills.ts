import type { SkillDefinition } from '../definitions.ts';
import { WHOLE_BOARD } from './radius.ts';

/**
 * Compétences de boss (game-design §9) : à mi-vie, un boss s'enrage et sa compétence normale est remplacée
 * par celle-ci jusqu'à la fin du combat. Une par boss possible : monstres de coût 3 (stages 1 et 2, au ★3),
 * Dragons anciens (stage 3, au ★2) et Dragons noirs (mode infini, au ★1).
 * ✅ Compétences validées le 2026-11-27 · ⚠️ valeurs provisoires, par rang [★1, ★2, ★3].
 */

export const RATHALOS_BOSS_SKILL: SkillDefinition = {
  id: 'triple-boule-de-feu',
  name: 'Triple boule de feu',
  description:
    'Trois boules de feu de 90/135/200 + 150 % de la puissance élémentaire : sur sa cible, l’ennemi le plus faible et l’ennemi le plus éloigné, chacune avec ses voisins.',
  castTime: 1,
  effects: [
    { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [90, 135, 200], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 1 },
    { kind: 'damage', target: 'lowestHpEnemy', damageType: 'elemental', base: [90, 135, 200], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 1 },
    { kind: 'damage', target: 'farthestEnemy', damageType: 'elemental', base: [90, 135, 200], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 1 },
  ],
};

export const LEGIANA_BOSS_SKILL: SkillDefinition = {
  id: 'blizzard',
  name: 'Blizzard',
  description: '60/90/135 + 100 % de la puissance élémentaire à tous les ennemis du plateau, et −40 % de vitesse d’attaque pendant 4 s.',
  castTime: 1,
  effects: [
    {
      kind: 'damage',
      target: 'self',
      damageType: 'elemental',
      base: [60, 90, 135],
      ratios: [{ stat: 'elementalPower', ratio: 1 }],
      radius: WHOLE_BOARD,
      slow: { attackSpeedPercent: -0.4, duration: 4 },
    },
  ],
};

export const NARGACUGA_BOSS_SKILL: SkillDefinition = {
  id: 'yeux-rouges',
  name: 'Yeux rouges',
  description:
    'Bondit sur l’ennemi le plus faible : 120/180/270 + 240 % de l’attaque brute (physique) sur lui et ses voisins, puis +60 % de vitesse d’attaque et 25 % de vol de vie pendant 5 s.',
  castTime: 0.25,
  effects: [
    { kind: 'damage', target: 'lowestHpEnemy', damageType: 'physical', base: [120, 180, 270], ratios: [{ stat: 'attack', ratio: 2.4 }], radius: 1, leap: true },
    { kind: 'buff', attackSpeedPercent: 0.6, lifesteal: 0.25, duration: 5 },
  ],
};

export const LAGIACRUS_BOSS_SKILL: SkillDefinition = {
  id: 'surcharge',
  name: 'Surcharge',
  description:
    '70/105/160 + 120 % de la puissance élémentaire aux ennemis à 3 cases ou moins, −30 % de vitesse d’attaque pendant 3 s, puis bouclier de 20 % de ses PV max pendant 5 s.',
  castTime: 0.5,
  effects: [
    {
      kind: 'damage',
      target: 'self',
      damageType: 'elemental',
      base: [70, 105, 160],
      ratios: [{ stat: 'elementalPower', ratio: 1.2 }],
      radius: 3,
      slow: { attackSpeedPercent: -0.3, duration: 3 },
    },
    { kind: 'shield', base: [0, 0, 0], ratios: [{ stat: 'hp', ratio: 0.2 }], duration: 5 },
  ],
};

export const KIRIN_BOSS_SKILL: SkillDefinition = {
  id: 'charge-foudroyante',
  name: 'Charge foudroyante',
  description:
    'Bondit sur l’ennemi le plus éloigné : 180/270/405 + 240 % de la puissance élémentaire sur lui et les ennemis à 2 cases, puis +40 % de vitesse d’attaque pendant 5 s.',
  castTime: 0.5,
  effects: [
    { kind: 'damage', target: 'farthestEnemy', damageType: 'elemental', base: [180, 270, 405], ratios: [{ stat: 'elementalPower', ratio: 2.4 }], radius: 2, leap: true },
    { kind: 'buff', attackSpeedPercent: 0.4, duration: 5 },
  ],
};

export const NAMIELLE_BOSS_SKILL: SkillDefinition = {
  id: 'raz-de-maree',
  name: 'Raz-de-marée',
  description:
    '110/165/250 + 150 % de la puissance élémentaire sur sa cible et les ennemis à 3 cases d’elle, et soigne tous les alliés du plateau de 150/225/340 + 150 % de la puissance élémentaire.',
  castTime: 0.75,
  effects: [
    { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [110, 165, 250], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 3 },
    { kind: 'heal', base: [150, 225, 340], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: WHOLE_BOARD },
  ],
};

export const SAFI_JIIVA_BOSS_SKILL: SkillDefinition = {
  id: 'etoile-de-saphir',
  name: 'Étoile de saphir',
  description:
    'Incantation de 2 s, puis 400/600/900 + 500 % de la puissance élémentaire sur sa cible et les ennemis à 2 cases d’elle ; ensuite 30 % de vol de vie pendant 6 s.',
  castTime: 2,
  effects: [
    { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [400, 600, 900], ratios: [{ stat: 'elementalPower', ratio: 5 }], radius: 2 },
    { kind: 'buff', attackSpeedPercent: 0, lifesteal: 0.3, duration: 6 },
  ],
};

export const TEOSTRA_BOSS_SKILL: SkillDefinition = {
  id: 'supernova-totale',
  name: 'Supernova totale',
  description: 'Incantation de 2,5 s, puis 300/450/675 + 350 % de la puissance élémentaire à tous les ennemis du plateau.',
  castTime: 2.5,
  effects: [{ kind: 'damage', target: 'self', damageType: 'elemental', base: [300, 450, 675], ratios: [{ stat: 'elementalPower', ratio: 3.5 }], radius: WHOLE_BOARD }],
};

export const FATALIS_BOSS_SKILL: SkillDefinition = {
  id: 'souffle-balayant',
  name: 'Souffle balayant',
  description:
    'Incantation de 2 s, puis 350/525/790 + 450 % de la puissance élémentaire à tous les ennemis du plateau, et +40 % de vitesse d’attaque pendant 6 s.',
  castTime: 2,
  effects: [
    { kind: 'damage', target: 'self', damageType: 'elemental', base: [350, 525, 790], ratios: [{ stat: 'elementalPower', ratio: 4.5 }], radius: WHOLE_BOARD },
    { kind: 'buff', attackSpeedPercent: 0.4, duration: 6 },
  ],
};

export const ALATREON_BOSS_SKILL: SkillDefinition = {
  id: 'bascule-elementaire',
  name: 'Bascule élémentaire',
  description:
    'Passe en mode feu : 300/450/675 + 400 % de la puissance élémentaire sur sa cible et les ennemis à 3 cases d’elle, puis +50 % de vitesse d’attaque pendant 6 s.',
  castTime: 1,
  effects: [
    { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [300, 450, 675], ratios: [{ stat: 'elementalPower', ratio: 4 }], radius: 3 },
    { kind: 'buff', attackSpeedPercent: 0.5, duration: 6 },
  ],
};

export const DIRE_MIRALIS_BOSS_SKILL: SkillDefinition = {
  id: 'coeur-en-fusion',
  name: 'Cœur en fusion',
  description:
    'Bouclier de 30 % de ses PV max pendant 6 s, puis 250/375/565 + 300 % de la puissance élémentaire aux ennemis à 3 cases ou moins, avec −30 % de vitesse d’attaque pendant 3 s.',
  castTime: 0.5,
  effects: [
    { kind: 'shield', base: [0, 0, 0], ratios: [{ stat: 'hp', ratio: 0.3 }], duration: 6 },
    {
      kind: 'damage',
      target: 'self',
      damageType: 'elemental',
      base: [250, 375, 565],
      ratios: [{ stat: 'elementalPower', ratio: 3 }],
      radius: 3,
      slow: { attackSpeedPercent: -0.3, duration: 3 },
    },
  ],
};

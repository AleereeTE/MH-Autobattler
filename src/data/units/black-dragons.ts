import type { UnitDefinition } from '../definitions.ts';

/**
 * Dragons noirs (coût 6, monstres uniquement) : très difficiles à obtenir (boutique aux niveaux 9 et 10 seulement,
 * 9 exemplaires chacun), mais très puissants. Ils ne sont pas Dragons anciens dans le jeu.
 * ⚠️ Statistiques provisoires.
 * ⚠️ Valeurs de base des compétences par rang [★1, ★2, ★3] provisoires.
 * ✅ Easter egg (2026-11-25) : au ★3, une compétence secrète remplace la leur. Elle vise tout le plateau
 * avec 5 fois les dégâts de leur compétence ★3 ; un bandeau à son nom traverse le plateau au lancement.
 */

/** Rayon qui couvre tout le plateau (la plus grande distance possible est de 10 cases). */
const WHOLE_BOARD = 10;

export const FATALIS: UnitDefinition = {
  id: 'fatalis',
  name: 'Fatalis',
  kind: 'monster',
  role: 'bruiser',
  element: 'dragon',
  cost: 6,
  traits: ['black-dragon'],
  stats: { hp: 1900, attack: 95, elementalPower: 85, critChance: 0.15, armor: 55, elementalResist: 55, attackSpeed: 0.75, range: 1, maxEnergy: 100, energyRegenBonus: 0 },
  skill: {
    id: 'souffle-du-fatalis',
    name: 'Souffle du Fatalis',
    description: 'Incantation de 1,5 s, puis 300/450/675 + 400/500/600 % de la puissance élémentaire sur la cible et les ennemis à 2 cases d’elle.',
    castTime: 1.5,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [300, 450, 675], ratios: [{ stat: 'elementalPower', ratio: 4 }], radius: 2 },
    ],
  },
  masterSkill: {
    id: 'fin-des-temps',
    name: 'Fin des temps',
    description: 'Compétence secrète du ★3 : incantation de 1,5 s, puis 3375 + 3000 % de la puissance élémentaire à tous les ennemis.',
    castTime: 1.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [3375, 3375, 3375], ratios: [{ stat: 'elementalPower', ratio: 20 }], radius: WHOLE_BOARD },
    ],
  },
};

export const ALATREON: UnitDefinition = {
  id: 'alatreon',
  name: 'Alatreon',
  kind: 'monster',
  role: 'dps',
  element: 'ice',
  cost: 6,
  traits: ['black-dragon'],
  stats: { hp: 1900, attack: 80, elementalPower: 95, critChance: 0.1, armor: 45, elementalResist: 60, attackSpeed: 0.7, range: 3, maxEnergy: 100, energyRegenBonus: 0 },
  skill: {
    id: 'jugement-d-escaton',
    name: 'Jugement d’Escaton',
    description: 'Incantation de 1,5 s, puis 220/330/495 + 340/425/510 % de la puissance élémentaire à tous les ennemis, et −30 % de vitesse d’attaque pendant 3 s.',
    castTime: 1.5,
    effects: [
      {
        kind: 'damage',
        target: 'self',
        damageType: 'elemental',
        base: [220, 330, 495],
        ratios: [{ stat: 'elementalPower', ratio: 3.4 }],
        radius: WHOLE_BOARD,
        slow: { attackSpeedPercent: -0.3, duration: 3 },
      },
    ],
  },  masterSkill: {
    id: 'jugement-absolu',
    name: 'Jugement absolu',
    description:
      'Compétence secrète du ★3 : incantation de 1,5 s, puis 2475 + 2550 % de la puissance élémentaire à tous les ennemis, et −30 % de vitesse d’attaque pendant 3 s.',
    castTime: 1.5,
    effects: [
      {
        kind: 'damage',
        target: 'self',
        damageType: 'elemental',
        base: [2475, 2475, 2475],
        ratios: [{ stat: 'elementalPower', ratio: 17 }],
        radius: WHOLE_BOARD,
        slow: { attackSpeedPercent: -0.3, duration: 3 },
      },
    ],
  },
};

export const DIRE_MIRALIS: UnitDefinition = {
  id: 'dire-miralis',
  name: 'Dire Miralis',
  kind: 'monster',
  role: 'tank',
  element: 'fire',
  cost: 6,
  traits: ['black-dragon'],
  stats: { hp: 1900, attack: 75, elementalPower: 70, critChance: 0.05, armor: 70, elementalResist: 65, attackSpeed: 0.6, range: 1, maxEnergy: 120, energyRegenBonus: 0 },
  skill: {
    id: 'eruption',
    name: 'Éruption',
    description: '200/300/450 + 250/313/375 % de la puissance élémentaire aux ennemis à 2 cases ou moins, puis bouclier de 250/375/565 + 10/13/15 % des PV max pendant 5 s.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [200, 300, 450], ratios: [{ stat: 'elementalPower', ratio: 2.5 }], radius: 2 },
      { kind: 'shield', base: [250, 375, 565], ratios: [{ stat: 'hp', ratio: 0.1 }], duration: 5 },
    ],
  },
  masterSkill: {
    id: 'cataclysme',
    name: 'Cataclysme',
    description: 'Compétence secrète du ★3 : 2250 + 1875 % de la puissance élémentaire à tous les ennemis, puis bouclier de 565 + 15 % des PV max pendant 5 s.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [2250, 2250, 2250], ratios: [{ stat: 'elementalPower', ratio: 12.5 }], radius: WHOLE_BOARD },
      { kind: 'shield', base: [565, 565, 565], ratios: [{ stat: 'hp', ratio: 0.1 }], duration: 5 },
    ],
  },
};

export const BLACK_DRAGONS: readonly UnitDefinition[] = [FATALIS, ALATREON, DIRE_MIRALIS];

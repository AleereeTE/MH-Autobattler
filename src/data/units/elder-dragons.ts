import type { UnitDefinition } from '../definitions.ts';

/**
 * Dragons anciens (coût 5, monstres uniquement). Jamais capturables : on ne les obtient qu'en boutique.
 * Ils servent aussi de boss au stage 3 du mode run.
 * ⚠️ Statistiques provisoires.
 * ⚠️ Valeurs de base des compétences par rang [★1, ★2, ★3] provisoires : ★2 ≈ ★1 × 1,5 et ★3 ≈ ★1 × 2,25.
 */

export const TEOSTRA: UnitDefinition = {
  id: 'teostra',
  name: 'Teostra',
  kind: 'monster',
  role: 'bruiser',
  element: 'fire',
  cost: 5,
  traits: ['elder-dragon'],
  stats: { hp: 1250, attack: 78, elementalPower: 65, critChance: 0.1, armor: 45, elementalResist: 45, attackSpeed: 0.75, range: 1, maxEnergy: 90, energyRegenBonus: 0 },
  skill: {
    id: 'supernova',
    name: 'Supernova',
    description: 'Incantation de 1,5 s, puis 250/375/565 + 350 % de la puissance élémentaire aux ennemis à 2 cases ou moins.',
    castTime: 1.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [250, 375, 565], ratios: [{ stat: 'elementalPower', ratio: 3.5 }], radius: 2 },
    ],
  },
};

export const NAMIELLE: UnitDefinition = {
  id: 'namielle',
  name: 'Namielle',
  kind: 'monster',
  role: 'support',
  element: 'water',
  cost: 5,
  traits: ['elder-dragon', 'catalyst'],
  stats: { hp: 1100, attack: 55, elementalPower: 70, critChance: 0.05, armor: 35, elementalResist: 50, attackSpeed: 0.7, range: 3, maxEnergy: 90, energyRegenBonus: 0 },
  skill: {
    id: 'maree-luminescente',
    name: 'Marée luminescente',
    description:
      '150/225/340 + 250 % de la puissance élémentaire sur la cible et les ennemis à 2 cases d’elle, et soigne les alliés à 2 cases de 100/150/225 + 150 % de la puissance élémentaire.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [150, 225, 340], ratios: [{ stat: 'elementalPower', ratio: 2.5 }], radius: 2 },
      { kind: 'heal', base: [100, 150, 225], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 2 },
    ],
  },
};

export const SAFI_JIIVA: UnitDefinition = {
  id: 'safi-jiiva',
  name: 'Safi’jiiva',
  kind: 'monster',
  role: 'dps',
  element: 'dragon',
  cost: 5,
  traits: ['elder-dragon'],
  stats: { hp: 1050, attack: 75, elementalPower: 70, critChance: 0.1, armor: 35, elementalResist: 40, attackSpeed: 0.75, range: 3, maxEnergy: 90, energyRegenBonus: 0 },
  skill: {
    id: 'rayon-draconique',
    name: 'Rayon draconique',
    description: '220/330/495 + 300 % de la puissance élémentaire sur l’ennemi le plus éloigné et ses voisins.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'farthestEnemy', damageType: 'elemental', base: [220, 330, 495], ratios: [{ stat: 'elementalPower', ratio: 3 }], radius: 1 },
    ],
  },
};

export const KIRIN: UnitDefinition = {
  id: 'kirin',
  name: 'Kirin',
  kind: 'monster',
  role: 'dps',
  element: 'thunder',
  cost: 5,
  traits: ['elder-dragon'],
  stats: { hp: 1000, attack: 60, elementalPower: 75, critChance: 0.1, armor: 30, elementalResist: 50, attackSpeed: 0.8, range: 3, maxEnergy: 90, energyRegenBonus: 0 },
  skill: {
    id: 'foudre-divine',
    name: 'Foudre divine',
    description: '200/300/450 + 280 % de la puissance élémentaire sur l’ennemi le plus faible et ses voisins.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'lowestHpEnemy', damageType: 'elemental', base: [200, 300, 450], ratios: [{ stat: 'elementalPower', ratio: 2.8 }], radius: 1 },
    ],
  },
};

export const ELDER_DRAGONS: readonly UnitDefinition[] = [TEOSTRA, NAMIELLE, SAFI_JIIVA, KIRIN];

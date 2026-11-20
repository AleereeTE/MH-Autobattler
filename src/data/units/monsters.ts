import type { UnitDefinition } from '../definitions.ts';

/**
 * Monstres du prototype. Les éléments sont ceux de la série.
 * ⚠️ Statistiques provisoires : plus élevées que celles des chasseurs, mais 1 seul emplacement d'objet.
 * ⚠️ Valeurs de base des compétences par rang [★1, ★2, ★3] provisoires : ★2 ≈ ★1 × 1,5 et ★3 ≈ ★1 × 2,25.
 */

export const BARROTH: UnitDefinition = {
  id: 'barroth',
  name: 'Barroth',
  kind: 'monster',
  role: 'tank',
  element: null,
  cost: 1,
  traits: ['bastion', 'brute-wyvern'],
  stats: { hp: 850, attack: 45, elementalPower: 0, critChance: 0.05, armor: 45, elementalResist: 30, attackSpeed: 0.6, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'carapace-de-boue',
    name: 'Carapace de boue',
    description: 'Bouclier de 150/225/340 + 15 % des PV max pendant 4 s.',
    castTime: 0.25,
    effects: [{ kind: 'shield', base: [150, 225, 340], ratios: [{ stat: 'hp', ratio: 0.15 }], duration: 4 }],
  },
};

export const KHEZU: UnitDefinition = {
  id: 'khezu',
  name: 'Khezu',
  kind: 'monster',
  role: 'tank',
  element: 'thunder',
  cost: 1,
  traits: ['flying-wyvern', 'bastion'],
  stats: { hp: 800, attack: 40, elementalPower: 30, critChance: 0.05, armor: 35, elementalResist: 40, attackSpeed: 0.6, range: 1, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'decharge',
    name: 'Décharge',
    description: '60/90/135 + 150 % de la puissance élémentaire aux ennemis adjacents.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [60, 90, 135], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 1 },
    ],
  },
};

export const ANJANATH: UnitDefinition = {
  id: 'anjanath',
  name: 'Anjanath',
  kind: 'monster',
  role: 'bruiser',
  element: 'fire',
  cost: 2,
  traits: ['berserker', 'brute-wyvern'],
  stats: { hp: 900, attack: 60, elementalPower: 40, critChance: 0.1, armor: 35, elementalResist: 30, attackSpeed: 0.7, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'souffle-ardent',
    name: 'Souffle ardent',
    description: '70/105/160 + 180 % de la puissance élémentaire sur la cible et ses voisins.',
    castTime: 0.75,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [70, 105, 160], ratios: [{ stat: 'elementalPower', ratio: 1.8 }], radius: 1 },
    ],
  },
};

export const TOBI_KADACHI: UnitDefinition = {
  id: 'tobi-kadachi',
  name: 'Tobi-Kadachi',
  kind: 'monster',
  role: 'bruiser',
  element: 'thunder',
  cost: 2,
  traits: ['berserker'],
  stats: { hp: 820, attack: 58, elementalPower: 40, critChance: 0.15, armor: 30, elementalResist: 30, attackSpeed: 0.8, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'charge-electrique',
    name: 'Charge électrique',
    description: 'Bondit sur l’ennemi le plus faible et inflige 60/90/135 + 180 % de la puissance élémentaire.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'lowestHpEnemy', damageType: 'elemental', base: [60, 90, 135], ratios: [{ stat: 'elementalPower', ratio: 1.8 }], leap: true },
    ],
  },
};

export const RATHALOS: UnitDefinition = {
  id: 'rathalos',
  name: 'Rathalos',
  kind: 'monster',
  role: 'dps',
  element: 'fire',
  cost: 3,
  traits: ['flying-wyvern', 'catalyst'],
  stats: { hp: 850, attack: 65, elementalPower: 50, critChance: 0.1, armor: 35, elementalResist: 35, attackSpeed: 0.75, range: 3, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'boule-de-feu',
    name: 'Boule de feu',
    description: '120/180/270 + 250 % de la puissance élémentaire sur la cible et ses voisins.',
    castTime: 0.75,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [120, 180, 270], ratios: [{ stat: 'elementalPower', ratio: 2.5 }], radius: 1 },
    ],
  },
};

export const LEGIANA: UnitDefinition = {
  id: 'legiana',
  name: 'Legiana',
  kind: 'monster',
  role: 'support',
  element: 'ice',
  cost: 3,
  traits: ['flying-wyvern', 'catalyst'],
  stats: { hp: 800, attack: 50, elementalPower: 45, critChance: 0.05, armor: 30, elementalResist: 40, attackSpeed: 0.7, range: 3, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'vent-glacial',
    name: 'Vent glacial',
    description: '70/105/160 + 160 % de la puissance élémentaire sur la cible et ses voisins, et −30 % de vitesse d’attaque pendant 3 s.',
    castTime: 0.5,
    effects: [
      {
        kind: 'damage',
        target: 'currentTarget',
        damageType: 'elemental',
        base: [70, 105, 160],
        ratios: [{ stat: 'elementalPower', ratio: 1.6 }],
        radius: 1,
        slow: { attackSpeedPercent: -0.3, duration: 3 },
      },
    ],
  },
};

export const ZINOGRE: UnitDefinition = {
  id: 'zinogre',
  name: 'Zinogre',
  kind: 'monster',
  role: 'bruiser',
  element: 'thunder',
  cost: 4,
  traits: ['berserker'],
  stats: { hp: 1000, attack: 70, elementalPower: 50, critChance: 0.15, armor: 40, elementalResist: 35, attackSpeed: 0.8, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'supercharge',
    name: 'Supercharge',
    description: 'Bondit sur la cible et inflige 100/150/225 + 220 % de la puissance élémentaire à elle et à ses voisins.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [100, 150, 225], ratios: [{ stat: 'elementalPower', ratio: 2.2 }], radius: 1, leap: true },
    ],
  },
};

export const DEVILJHO: UnitDefinition = {
  id: 'deviljho',
  name: 'Deviljho',
  kind: 'monster',
  role: 'bruiser',
  element: 'dragon',
  cost: 4,
  traits: ['berserker', 'brute-wyvern'],
  stats: { hp: 1150, attack: 72, elementalPower: 45, critChance: 0.1, armor: 45, elementalResist: 35, attackSpeed: 0.7, range: 1, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'souffle-draconique',
    name: 'Souffle draconique',
    description: '110/165/250 + 200 % de la puissance élémentaire sur la cible et ses voisins.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [110, 165, 250], ratios: [{ stat: 'elementalPower', ratio: 2 }], radius: 1 },
    ],
  },
};

export const MIZUTSUNE: UnitDefinition = {
  id: 'mizutsune',
  name: 'Mizutsune',
  kind: 'monster',
  role: 'support',
  element: 'water',
  cost: 4,
  traits: ['catalyst', 'leviathan'],
  stats: { hp: 900, attack: 50, elementalPower: 55, critChance: 0.05, armor: 30, elementalResist: 45, attackSpeed: 0.7, range: 3, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'danse-des-bulles',
    name: 'Danse des bulles',
    description: 'Soigne de 120/180/270 + 220 % de la puissance élémentaire les alliés à 2 cases ou moins.',
    castTime: 0.5,
    effects: [{ kind: 'heal', base: [120, 180, 270], ratios: [{ stat: 'elementalPower', ratio: 2.2 }], radius: 2 }],
  },
};

export const ROYAL_LUDROTH: UnitDefinition = {
  id: 'royal-ludroth',
  name: 'Royal Ludroth',
  kind: 'monster',
  role: 'support',
  element: 'water',
  cost: 1,
  traits: ['catalyst', 'leviathan'],
  stats: { hp: 650, attack: 35, elementalPower: 30, critChance: 0.05, armor: 25, elementalResist: 35, attackSpeed: 0.7, range: 2, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'criniere-spongieuse',
    name: 'Crinière spongieuse',
    description: 'Soigne de 50/75/115 + 150 % de la puissance élémentaire les alliés à 2 cases ou moins.',
    castTime: 0.5,
    effects: [
      { kind: 'heal', base: [50, 75, 115], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 2 },
    ],
  },
};

export const KULU_YA_KU: UnitDefinition = {
  id: 'kulu-ya-ku',
  name: 'Kulu-Ya-Ku',
  kind: 'monster',
  role: 'bruiser',
  element: null,
  cost: 1,
  traits: ['berserker'],
  stats: { hp: 700, attack: 52, elementalPower: 0, critChance: 0.1, armor: 30, elementalResist: 20, attackSpeed: 0.75, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'coup-de-rocher',
    name: 'Coup de rocher',
    description: '70/105/160 + 150 % de l’attaque brute en dégâts physiques sur sa cible.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'physical', base: [70, 105, 160], ratios: [{ stat: 'attack', ratio: 1.5 }] },
    ],
  },
};

export const JYURATODUS: UnitDefinition = {
  id: 'jyuratodus',
  name: 'Jyuratodus',
  kind: 'monster',
  role: 'tank',
  element: 'water',
  cost: 2,
  traits: ['bastion'],
  stats: { hp: 900, attack: 45, elementalPower: 30, critChance: 0.05, armor: 45, elementalResist: 35, attackSpeed: 0.6, range: 1, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'bain-de-boue',
    name: 'Bain de boue',
    description: '60/90/135 + 140 % de la puissance élémentaire aux ennemis adjacents, et −25 % de vitesse d’attaque pendant 2 s.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [60, 90, 135], ratios: [{ stat: 'elementalPower', ratio: 1.4 }], radius: 1, slow: { attackSpeedPercent: -0.25, duration: 2 } },
    ],
  },
};

export const BARIOTH: UnitDefinition = {
  id: 'barioth',
  name: 'Barioth',
  kind: 'monster',
  role: 'bruiser',
  element: 'ice',
  cost: 2,
  traits: ['flying-wyvern'],
  stats: { hp: 820, attack: 58, elementalPower: 40, critChance: 0.15, armor: 30, elementalResist: 30, attackSpeed: 0.8, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'charge-glaciale',
    name: 'Charge glaciale',
    description: 'Bondit sur l’ennemi le plus faible et inflige 60/90/135 + 170 % de la puissance élémentaire, et −20 % de vitesse d’attaque pendant 2 s.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'lowestHpEnemy', damageType: 'elemental', base: [60, 90, 135], ratios: [{ stat: 'elementalPower', ratio: 1.7 }], leap: true, slow: { attackSpeedPercent: -0.2, duration: 2 } },
    ],
  },
};

export const NARGACUGA: UnitDefinition = {
  id: 'nargacuga',
  name: 'Nargacuga',
  kind: 'monster',
  role: 'dps',
  element: null,
  cost: 3,
  traits: ['flying-wyvern'],
  stats: { hp: 800, attack: 75, elementalPower: 0, critChance: 0.2, armor: 30, elementalResist: 25, attackSpeed: 0.9, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'queue-tranchante',
    name: 'Queue tranchante',
    description: 'Bondit sur l’ennemi le plus faible et inflige 110/165/250 + 220 % de l’attaque brute en dégâts physiques.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'lowestHpEnemy', damageType: 'physical', base: [110, 165, 250], ratios: [{ stat: 'attack', ratio: 2.2 }], leap: true },
    ],
  },
};

export const LAGIACRUS: UnitDefinition = {
  id: 'lagiacrus',
  name: 'Lagiacrus',
  kind: 'monster',
  role: 'tank',
  element: 'thunder',
  cost: 3,
  traits: ['bastion', 'leviathan'],
  stats: { hp: 1000, attack: 50, elementalPower: 40, critChance: 0.05, armor: 45, elementalResist: 45, attackSpeed: 0.6, range: 1, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'decharge-abyssale',
    name: 'Décharge abyssale',
    description: '90/135/205 + 160 % de la puissance élémentaire aux ennemis à 2 cases ou moins.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [90, 135, 205], ratios: [{ stat: 'elementalPower', ratio: 1.6 }], radius: 2 },
    ],
  },
};

export const TIGREX: UnitDefinition = {
  id: 'tigrex',
  name: 'Tigrex',
  kind: 'monster',
  role: 'bruiser',
  element: null,
  cost: 4,
  traits: ['flying-wyvern', 'berserker'],
  stats: { hp: 1100, attack: 80, elementalPower: 0, critChance: 0.15, armor: 40, elementalResist: 30, attackSpeed: 0.8, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'rugissement',
    name: 'Rugissement',
    description: '110/165/250 + 230 % de l’attaque brute en dégâts physiques aux ennemis adjacents.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'physical', base: [110, 165, 250], ratios: [{ stat: 'attack', ratio: 2.3 }], radius: 1 },
    ],
  },
};

export const MONSTERS: readonly UnitDefinition[] = [
  BARROTH,
  KHEZU,
  ANJANATH,
  TOBI_KADACHI,
  RATHALOS,
  LEGIANA,
  ZINOGRE,
  DEVILJHO,
  MIZUTSUNE,
  ROYAL_LUDROTH,
  KULU_YA_KU,
  JYURATODUS,
  BARIOTH,
  NARGACUGA,
  LAGIACRUS,
  TIGREX,
];

import type { UnitDefinition } from '../definitions.ts';

/**
 * Monstres du prototype. Les éléments sont ceux de la série.
 * ⚠️ Statistiques provisoires : plus élevées que celles des chasseurs, mais 1 seul emplacement d'objet.
 */

export const BARROTH: UnitDefinition = {
  id: 'barroth',
  name: 'Barroth',
  kind: 'monster',
  role: 'tank',
  element: null,
  cost: 1,
  traits: ['bastion'],
  stats: { hp: 850, attack: 45, elementalPower: 0, critChance: 0.05, armor: 45, elementalResist: 30, attackSpeed: 0.6, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'carapace-de-boue',
    name: 'Carapace de boue',
    description: 'Bouclier de 150 + 15 % des PV max pendant 4 s.',
    castTime: 0.25,
    effects: [{ kind: 'shield', base: 150, ratios: [{ stat: 'hp', ratio: 0.15 }], duration: 4 }],
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
    description: '60 + 150 % de la puissance élémentaire aux ennemis adjacents.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: 60, ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 1 },
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
  traits: ['berserker'],
  stats: { hp: 900, attack: 60, elementalPower: 40, critChance: 0.1, armor: 35, elementalResist: 30, attackSpeed: 0.7, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'souffle-ardent',
    name: 'Souffle ardent',
    description: '70 + 180 % de la puissance élémentaire sur la cible et ses voisins.',
    castTime: 0.75,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: 70, ratios: [{ stat: 'elementalPower', ratio: 1.8 }], radius: 1 },
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
    description: 'Bondit sur l’ennemi le plus faible et inflige 60 + 180 % de la puissance élémentaire.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'lowestHpEnemy', damageType: 'elemental', base: 60, ratios: [{ stat: 'elementalPower', ratio: 1.8 }], leap: true },
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
    description: '120 + 250 % de la puissance élémentaire sur la cible et ses voisins.',
    castTime: 0.75,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: 120, ratios: [{ stat: 'elementalPower', ratio: 2.5 }], radius: 1 },
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
    description: '70 + 160 % de la puissance élémentaire sur la cible et ses voisins, et −30 % de vitesse d’attaque pendant 3 s.',
    castTime: 0.5,
    effects: [
      {
        kind: 'damage',
        target: 'currentTarget',
        damageType: 'elemental',
        base: 70,
        ratios: [{ stat: 'elementalPower', ratio: 1.6 }],
        radius: 1,
        slow: { attackSpeedPercent: -0.3, duration: 3 },
      },
    ],
  },
};

export const MONSTERS: readonly UnitDefinition[] = [BARROTH, KHEZU, ANJANATH, TOBI_KADACHI, RATHALOS, LEGIANA];

import type { UnitDefinition } from '../definitions.ts';

/**
 * Chasseurs du prototype. Noms provisoires.
 * ⚠️ Statistiques provisoires : plus faibles que celles des monstres, compensées par 3 emplacements d'objets.
 * ⚠️ Valeurs de base des compétences par rang [★1, ★2, ★3] provisoires : ★2 ≈ ★1 × 1,5 et ★3 ≈ ★1 × 2,25.
 */

export const GARRICK: UnitDefinition = {
  id: 'garrick',
  name: 'Garrick',
  kind: 'hunter',
  weapon: 'Lance',
  role: 'tank',
  element: 'ice',
  cost: 2,
  traits: ['bastion'],
  stats: { hp: 750, attack: 45, elementalPower: 30, critChance: 0.05, armor: 50, elementalResist: 40, attackSpeed: 0.65, range: 1, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'garde',
    name: 'Garde',
    description: 'Bouclier de 200/300/450 + 20/25/30 % des PV max pendant 4 s.',
    castTime: 0.25,
    effects: [{ kind: 'shield', base: [200, 300, 450], ratios: [{ stat: 'hp', ratio: 0.2 }], duration: 4 }],
  },
};

export const HELGA: UnitDefinition = {
  id: 'helga',
  name: 'Helga',
  kind: 'hunter',
  weapon: 'Marteau',
  role: 'bruiser',
  element: null,
  cost: 1,
  traits: ['guild'],
  stats: { hp: 650, attack: 55, elementalPower: 0, critChance: 0.1, armor: 30, elementalResist: 25, attackSpeed: 0.7, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'big-bang',
    name: 'Big Bang',
    description: '80/120/180 + 160/200/240 % de l’attaque brute en dégâts physiques sur sa cible.',
    castTime: 0.5,
    effects: [{ kind: 'damage', target: 'currentTarget', damageType: 'physical', base: [80, 120, 180], ratios: [{ stat: 'attack', ratio: 1.6 }] }],
  },
};

export const AKIRA: UnitDefinition = {
  id: 'akira',
  name: 'Akira',
  kind: 'hunter',
  weapon: 'Grande épée',
  role: 'dps',
  element: null,
  cost: 3,
  traits: ['guild', 'berserker'],
  stats: { hp: 700, attack: 75, elementalPower: 0, critChance: 0.15, armor: 30, elementalResist: 25, attackSpeed: 0.55, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'coup-charge',
    name: 'Coup chargé',
    description: 'Charge pendant 1,5 s, puis inflige 150/225/340 + 300/375/450 % de l’attaque brute en dégâts physiques.',
    castTime: 1.5,
    effects: [{ kind: 'damage', target: 'currentTarget', damageType: 'physical', base: [150, 225, 340], ratios: [{ stat: 'attack', ratio: 3 }] }],
  },
};

export const LYSA: UnitDefinition = {
  id: 'lysa',
  name: 'Lysa',
  kind: 'hunter',
  weapon: 'Doubles lames',
  role: 'dps',
  element: 'thunder',
  cost: 1,
  traits: ['guild'],
  stats: { hp: 550, attack: 45, elementalPower: 25, critChance: 0.15, armor: 20, elementalResist: 20, attackSpeed: 0.9, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'mode-demon',
    name: 'Mode démon',
    description: '+60 % de vitesse d’attaque pendant 4 s.',
    castTime: 0,
    effects: [{ kind: 'buff', attackSpeedPercent: 0.6, duration: 4 }],
  },
};

export const SYLVAIN: UnitDefinition = {
  id: 'sylvain',
  name: 'Sylvain',
  kind: 'hunter',
  weapon: 'Arc',
  role: 'dps',
  element: 'ice',
  cost: 1,
  traits: ['catalyst'],
  stats: { hp: 500, attack: 48, elementalPower: 30, critChance: 0.15, armor: 15, elementalResist: 20, attackSpeed: 0.8, range: 4, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'pluie-de-fleches',
    name: 'Pluie de flèches',
    description: '50/75/115 + 160/200/240 % de la puissance élémentaire sur l’ennemi le plus éloigné et ses voisins.',
    castTime: 0.5,
    effects: [
      {
        kind: 'damage',
        target: 'farthestEnemy',
        damageType: 'elemental',
        base: [50, 75, 115],
        ratios: [{ stat: 'elementalPower', ratio: 1.6 }],
        radius: 1,
      },
    ],
  },
};

export const ODETTE: UnitDefinition = {
  id: 'odette',
  name: 'Odette',
  kind: 'hunter',
  weapon: 'Corne de chasse',
  role: 'support',
  element: 'fire',
  cost: 2,
  traits: ['guild'],
  stats: { hp: 600, attack: 40, elementalPower: 35, critChance: 0.05, armor: 25, elementalResist: 30, attackSpeed: 0.7, range: 2, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'melodie-de-soin',
    name: 'Mélodie de soin',
    description: 'Soigne de 80/120/180 + 200/250/300 % de la puissance élémentaire les alliés à 2 cases ou moins.',
    castTime: 0.5,
    effects: [{ kind: 'heal', base: [80, 120, 180], ratios: [{ stat: 'elementalPower', ratio: 2 }], radius: 2 }],
  },
};

export const BRANN: UnitDefinition = {
  id: 'brann',
  name: 'Brann',
  kind: 'hunter',
  weapon: 'Lancecanon',
  role: 'tank',
  element: 'dragon',
  cost: 4,
  traits: ['guild', 'bastion'],
  stats: { hp: 900, attack: 50, elementalPower: 40, critChance: 0.05, armor: 60, elementalResist: 50, attackSpeed: 0.65, range: 1, maxEnergy: 80, energyRegenBonus: 0 },
  skill: {
    id: 'canon-de-wyverne',
    name: 'Canon de wyverne',
    description:
      '50/75/115 + 75/94/113 % de la puissance élémentaire aux ennemis adjacents, puis bouclier de 150/225/340 + 15/19/23 % des PV max pendant 4 s.',
    castTime: 0.5,
    effects: [
      { kind: 'damage', target: 'self', damageType: 'elemental', base: [50, 75, 115], ratios: [{ stat: 'elementalPower', ratio: 0.75 }], radius: 1 },
      { kind: 'shield', base: [150, 225, 340], ratios: [{ stat: 'hp', ratio: 0.15 }], duration: 4 },
    ],
  },
};

export const ONDINE: UnitDefinition = {
  id: 'ondine',
  name: 'Ondine',
  kind: 'hunter',
  weapon: 'Morpho-hache',
  role: 'bruiser',
  element: 'water',
  cost: 4,
  traits: ['guild'],
  stats: { hp: 800, attack: 62, elementalPower: 45, critChance: 0.1, armor: 35, elementalResist: 30, attackSpeed: 0.75, range: 1, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'decharge-elementaire',
    name: 'Décharge élémentaire',
    description: 'Incantation de 1 s, puis 150/225/340 + 250/313/375 % de la puissance élémentaire sur la cible.',
    castTime: 1,
    effects: [{ kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [150, 225, 340], ratios: [{ stat: 'elementalPower', ratio: 2.5 }] }],
  },
};

export const MIRA: UnitDefinition = {
  id: 'mira',
  name: 'Mira',
  kind: 'hunter',
  weapon: 'Épée et bouclier',
  role: 'bruiser',
  element: 'dragon',
  cost: 1,
  traits: ['guild', 'bastion'],
  stats: { hp: 620, attack: 48, elementalPower: 25, critChance: 0.1, armor: 35, elementalResist: 25, attackSpeed: 0.8, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'frappe-tournoyante',
    name: 'Frappe tournoyante',
    description: '50/75/115 + 150/188/225 % de la puissance élémentaire sur la cible et ses voisins.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [50, 75, 115], ratios: [{ stat: 'elementalPower', ratio: 1.5 }], radius: 1 },
    ],
  },
};

export const KAEDE: UnitDefinition = {
  id: 'kaede',
  name: 'Kaede',
  kind: 'hunter',
  weapon: 'Épée longue',
  role: 'dps',
  element: 'water',
  cost: 2,
  traits: ['guild', 'berserker'],
  stats: { hp: 580, attack: 58, elementalPower: 35, critChance: 0.15, armor: 20, elementalResist: 20, attackSpeed: 0.85, range: 1, maxEnergy: 60, energyRegenBonus: 0 },
  skill: {
    id: 'coup-spirituel',
    name: 'Coup spirituel',
    description: '70/105/160 + 200/250/300 % de la puissance élémentaire sur la cible.',
    castTime: 0.25,
    effects: [
      { kind: 'damage', target: 'currentTarget', damageType: 'elemental', base: [70, 105, 160], ratios: [{ stat: 'elementalPower', ratio: 2 }] },
    ],
  },
};

export const DORIAN: UnitDefinition = {
  id: 'dorian',
  name: 'Dorian',
  kind: 'hunter',
  weapon: 'Fusarbalète lourd',
  role: 'dps',
  element: 'dragon',
  cost: 3,
  traits: ['guild', 'catalyst'],
  stats: { hp: 550, attack: 50, elementalPower: 45, critChance: 0.1, armor: 15, elementalResist: 20, attackSpeed: 0.6, range: 4, maxEnergy: 70, energyRegenBonus: 0 },
  skill: {
    id: 'tir-draconique',
    name: 'Tir draconique',
    description: 'Incantation de 1 s, puis 130/195/295 + 250/313/375 % de la puissance élémentaire sur l’ennemi le plus éloigné et ses voisins.',
    castTime: 1,
    effects: [
      { kind: 'damage', target: 'farthestEnemy', damageType: 'elemental', base: [130, 195, 295], ratios: [{ stat: 'elementalPower', ratio: 2.5 }], radius: 1 },
    ],
  },
};

export const HUNTERS: readonly UnitDefinition[] = [GARRICK, HELGA, AKIRA, LYSA, SYLVAIN, ODETTE, BRANN, ONDINE, MIRA, KAEDE, DORIAN];

import type { Element, StatBonus, TraitId, UnitKind } from './definitions.ts';

/**
 * Traits et synergies du prototype (docs/prototype-content.md).
 * ✅ Paliers 2 / 4 / 6 pour les traits d'au moins 6 unités, 2 / 4 pour Feu et Glace (5 unités, en attendant une 6e),
 * 2 / 3 pour les petites familles (Léviathan, Wyverne brute).
 * ⚠️ Toutes les valeurs sont provisoires (palier du haut ≈ ×1,6 celui du milieu).
 */

export type TraitEffect =
  /** Bonus de statistiques pour les unités du trait. */
  | { readonly kind: 'statBonus'; readonly bonus: StatBonus }
  /**
   * Bonus multiplié par le nombre d'objets portés par l'ensemble des unités du trait, donné à chacune d'elles,
   * même sans objet (Guilde). Au plus `maxObjects` objets sont comptés.
   */
  | { readonly kind: 'sharedObjectBonus'; readonly bonus: StatBonus; readonly maxObjects: number }
  /** Les coups des unités du trait brûlent la cible (Feu). */
  | { readonly kind: 'burn'; readonly damagePerSecond: number; readonly duration: number }
  /** Les coups des unités du trait ralentissent la cible (Glace). */
  | { readonly kind: 'chill'; readonly attackSpeedPercent: number; readonly duration: number }
  /** Un éclair frappe régulièrement un ennemi au hasard (Foudre). */
  | { readonly kind: 'lightning'; readonly damage: number; readonly interval: number }
  /** Tant qu'une unité du trait est en vie, les ennemis infligent moins de dégâts (Dragon noir : 0,15 = −15 %). */
  | { readonly kind: 'terror'; readonly enemyDamageReduction: number };

/**
 * ✅ Guilde (2026-11-24) : chaque objet porté par une unité Guilde renforce toutes les unités Guilde,
 * avec 9 objets comptés au plus.
 */
export const GUILD_MAX_OBJECTS = 9;

export interface TraitTier {
  /** Nombre d'unités différentes nécessaire. */
  readonly count: number;
  readonly effect: TraitEffect;
  readonly description: string;
}

export interface TraitDefinition {
  readonly id: TraitId;
  readonly name: string;
  readonly category: 'element' | 'secondary';
  /** Trait réservé aux chasseurs ou aux monstres. */
  readonly restrictedTo?: UnitKind;
  /** Paliers, du plus petit au plus grand. */
  readonly tiers: readonly TraitTier[];
}

/** Trait principal d'une unité : son élément, ou « Sans élément ». */
export function elementTraitId(element: Element | null): TraitId {
  return element ?? 'neutral';
}

export const TRAITS: readonly TraitDefinition[] = [
  {
    id: 'fire',
    name: 'Feu',
    category: 'element',
    tiers: [
      { count: 2, effect: { kind: 'burn', damagePerSecond: 20, duration: 3 }, description: 'Les coups des unités Feu brûlent : 20 dégâts/s pendant 3 s' },
      { count: 4, effect: { kind: 'burn', damagePerSecond: 40, duration: 3 }, description: 'Les coups des unités Feu brûlent : 40 dégâts/s pendant 3 s' },
    ],
  },
  {
    id: 'thunder',
    name: 'Foudre',
    category: 'element',
    tiers: [
      { count: 2, effect: { kind: 'lightning', damage: 80, interval: 4 }, description: 'Toutes les 4 s, un éclair frappe un ennemi au hasard (80 dégâts)' },
      { count: 4, effect: { kind: 'lightning', damage: 150, interval: 3 }, description: 'Toutes les 3 s, un éclair frappe un ennemi au hasard (150 dégâts)' },
      { count: 6, effect: { kind: 'lightning', damage: 240, interval: 2.5 }, description: 'Toutes les 2,5 s, un éclair frappe un ennemi au hasard (240 dégâts)' },
    ],
  },
  {
    id: 'ice',
    name: 'Glace',
    category: 'element',
    tiers: [
      { count: 2, effect: { kind: 'chill', attackSpeedPercent: -0.2, duration: 2 }, description: 'Les coups des unités Glace ralentissent la cible de 20 % pendant 2 s' },
      { count: 4, effect: { kind: 'chill', attackSpeedPercent: -0.35, duration: 2 }, description: 'Les coups des unités Glace ralentissent la cible de 35 % pendant 2 s' },
    ],
  },
  {
    id: 'neutral',
    name: 'Sans élément',
    category: 'element',
    tiers: [
      { count: 2, effect: { kind: 'statBonus', bonus: { attackPercent: 0.15 } }, description: '+15 % d’attaque brute' },
      { count: 4, effect: { kind: 'statBonus', bonus: { attackPercent: 0.3 } }, description: '+30 % d’attaque brute' },
      { count: 6, effect: { kind: 'statBonus', bonus: { attackPercent: 0.5 } }, description: '+50 % d’attaque brute' },
    ],
  },
  {
    id: 'water',
    name: 'Eau',
    category: 'element',
    tiers: [
      {
        count: 2,
        effect: { kind: 'statBonus', bonus: { lifeSourceRatio: 0.15 } },
        description: 'Source de vie : les unités Eau soignent l’allié le plus blessé de 15 % des dégâts qu’elles infligent',
      },
      {
        count: 4,
        effect: { kind: 'statBonus', bonus: { lifeSourceRatio: 0.3 } },
        description: 'Source de vie : les unités Eau soignent l’allié le plus blessé de 30 % des dégâts qu’elles infligent',
      },
      {
        count: 6,
        effect: { kind: 'statBonus', bonus: { lifeSourceRatio: 0.5 } },
        description: 'Source de vie : les unités Eau soignent l’allié le plus blessé de 50 % des dégâts qu’elles infligent',
      },
    ],
  },
  {
    id: 'dragon',
    name: 'Dragon',
    category: 'element',
    tiers: [
      {
        count: 2,
        effect: { kind: 'statBonus', bonus: { lowHpDamageBonus: 0.2 } },
        description: 'Rage draconique : +20 % de dégâts pour les unités Dragon sous 50 % de leurs PV',
      },
      {
        count: 4,
        effect: { kind: 'statBonus', bonus: { lowHpDamageBonus: 0.4 } },
        description: 'Rage draconique : +40 % de dégâts pour les unités Dragon sous 50 % de leurs PV',
      },
      {
        count: 6,
        effect: { kind: 'statBonus', bonus: { lowHpDamageBonus: 0.65 } },
        description: 'Rage draconique : +65 % de dégâts pour les unités Dragon sous 50 % de leurs PV',
      },
    ],
  },
  {
    id: 'guild',
    name: 'Guilde',
    category: 'secondary',
    restrictedTo: 'hunter',
    tiers: [
      // ✅ 3 / 4 / 5 % par objet porté dans la Guilde, pour toutes les unités Guilde (validé le 2026-11-24).
      {
        count: 2,
        effect: { kind: 'sharedObjectBonus', bonus: { hpPercent: 0.03, attackPercent: 0.03, elementalPowerPercent: 0.03 }, maxObjects: GUILD_MAX_OBJECTS },
        description: `Toutes les unités Guilde : +3 % PV, attaque brute et puissance élémentaire par objet porté par une unité Guilde (${GUILD_MAX_OBJECTS} objets au plus)`,
      },
      {
        count: 4,
        effect: { kind: 'sharedObjectBonus', bonus: { hpPercent: 0.04, attackPercent: 0.04, elementalPowerPercent: 0.04 }, maxObjects: GUILD_MAX_OBJECTS },
        description: `Toutes les unités Guilde : +4 % PV, attaque brute et puissance élémentaire par objet porté par une unité Guilde (${GUILD_MAX_OBJECTS} objets au plus)`,
      },
      {
        count: 6,
        effect: { kind: 'sharedObjectBonus', bonus: { hpPercent: 0.05, attackPercent: 0.05, elementalPowerPercent: 0.05 }, maxObjects: GUILD_MAX_OBJECTS },
        description: `Toutes les unités Guilde : +5 % PV, attaque brute et puissance élémentaire par objet porté par une unité Guilde (${GUILD_MAX_OBJECTS} objets au plus)`,
      },
    ],
  },
  {
    id: 'berserker',
    name: 'Berserker',
    category: 'secondary',
    tiers: [
      {
        count: 2,
        effect: { kind: 'statBonus', bonus: { skillsCanCrit: true, critChance: 0.15, critMultiplier: 0.2 } },
        description: 'Compétences critiques possibles, +15 % de critique, critiques ×1,7',
      },
      {
        count: 4,
        effect: { kind: 'statBonus', bonus: { skillsCanCrit: true, critChance: 0.3, critMultiplier: 0.4 } },
        description: 'Compétences critiques possibles, +30 % de critique, critiques ×1,9',
      },
      {
        count: 6,
        effect: { kind: 'statBonus', bonus: { skillsCanCrit: true, critChance: 0.5, critMultiplier: 0.6 } },
        description: 'Compétences critiques possibles, +50 % de critique, critiques ×2,1',
      },
    ],
  },
  {
    id: 'bastion',
    name: 'Bastion',
    category: 'secondary',
    tiers: [
      { count: 2, effect: { kind: 'statBonus', bonus: { damageReduction: 0.15 } }, description: '−15 % de dégâts subis' },
      { count: 4, effect: { kind: 'statBonus', bonus: { damageReduction: 0.3 } }, description: '−30 % de dégâts subis' },
      { count: 6, effect: { kind: 'statBonus', bonus: { damageReduction: 0.45 } }, description: '−45 % de dégâts subis' },
    ],
  },
  {
    id: 'catalyst',
    name: 'Catalyseur',
    category: 'secondary',
    tiers: [
      { count: 2, effect: { kind: 'statBonus', bonus: { elementalPower: 20 } }, description: '+20 puissance élémentaire' },
      { count: 4, effect: { kind: 'statBonus', bonus: { elementalPower: 45 } }, description: '+45 puissance élémentaire' },
      { count: 6, effect: { kind: 'statBonus', bonus: { elementalPower: 70 } }, description: '+70 puissance élémentaire' },
    ],
  },
  {
    id: 'flying-wyvern',
    name: 'Wyverne volante',
    category: 'secondary',
    restrictedTo: 'monster',
    tiers: [
      { count: 2, effect: { kind: 'statBonus', bonus: { attackSpeedPercent: 0.15 } }, description: '+15 % de vitesse d’attaque' },
      { count: 4, effect: { kind: 'statBonus', bonus: { attackSpeedPercent: 0.3 } }, description: '+30 % de vitesse d’attaque' },
      { count: 6, effect: { kind: 'statBonus', bonus: { attackSpeedPercent: 0.5 } }, description: '+50 % de vitesse d’attaque' },
    ],
  },
  {
    id: 'elder-dragon',
    name: 'Dragon ancien',
    category: 'secondary',
    restrictedTo: 'monster',
    tiers: [
      {
        count: 1,
        effect: { kind: 'statBonus', bonus: { startingEnergyRatio: 0.4 } },
        description: 'Calamité : les Dragons anciens commencent le combat avec 40 % de leur énergie',
      },
      {
        count: 2,
        effect: { kind: 'statBonus', bonus: { startingEnergyRatio: 0.7 } },
        description: 'Calamité : les Dragons anciens commencent le combat avec 70 % de leur énergie',
      },
      {
        count: 3,
        effect: { kind: 'statBonus', bonus: { startingEnergyRatio: 1 } },
        description: 'Calamité : les Dragons anciens commencent le combat avec toute leur énergie',
      },
    ],
  },
  {
    id: 'leviathan',
    name: 'Léviathan',
    category: 'secondary',
    restrictedTo: 'monster',
    tiers: [
      { count: 2, effect: { kind: 'statBonus', bonus: { dodgeChance: 0.15 } }, description: 'Glissade : les Léviathans esquivent 15 % des attaques de base' },
      { count: 3, effect: { kind: 'statBonus', bonus: { dodgeChance: 0.3 } }, description: 'Glissade : les Léviathans esquivent 30 % des attaques de base' },
    ],
  },
  {
    id: 'brute-wyvern',
    name: 'Wyverne brute',
    category: 'secondary',
    restrictedTo: 'monster',
    tiers: [
      { count: 2, effect: { kind: 'statBonus', bonus: { hpPercent: 0.15 } }, description: 'Masse : +15 % de PV max pour les Wyvernes brutes' },
      { count: 3, effect: { kind: 'statBonus', bonus: { hpPercent: 0.3 } }, description: 'Masse : +30 % de PV max pour les Wyvernes brutes' },
    ],
  },
  {
    id: 'black-dragon',
    name: 'Dragon noir',
    category: 'secondary',
    restrictedTo: 'monster',
    tiers: [
      // ✅ Un seul palier : un seul Dragon noir est permis par plateau.
      {
        count: 1,
        effect: { kind: 'terror', enemyDamageReduction: 0.15 },
        description: 'Terreur : tant qu’un Dragon noir est en vie, tous les ennemis infligent −15 % de dégâts',
      },
    ],
  },
];

const TRAITS_BY_ID = new Map(TRAITS.map((trait) => [trait.id, trait]));

export function findTrait(id: TraitId): TraitDefinition | undefined {
  return TRAITS_BY_ID.get(id);
}

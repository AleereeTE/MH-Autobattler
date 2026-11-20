import type { UnitCost } from './definitions.ts';

/**
 * Constantes du mode run (docs/game-design.md §2, §8 à §11 · valeurs listées dans docs/prototype-content.md).
 * ✅ = décidé · ⚠️ = valeur de départ provisoire, à ajuster pendant l'équilibrage.
 */

export const RUN_STRUCTURE = {
  /** ✅ 3 stages de 10 chasses : 9 chasses classiques puis 1 boss. */
  stages: 3,
  huntsPerStage: 10,
  /** ✅ La run est perdue après 3 défaites. */
  maxDefeats: 3,
  /** ✅ 5 unités par relance, 10 places en réserve, niveaux de boutique 1 à 9. */
  shopSize: 5,
  benchSize: 10,
  maxLevel: 9,
} as const;

export const ECONOMY = {
  /** ⚠️ Niveau de boutique et zennys au départ (le revenu du 1er tour s'y ajoute). */
  startLevel: 2,
  startZennys: 5,
  /** ⚠️ Zennys gagnés à chaque tour, même en cas de défaite. */
  baseIncome: 5,
  /** ⚠️ Bonus versé au tour qui suit une victoire. */
  winBonus: 1,
  /** ✅ +1 zenny par tranche de 10 zennys épargnés, 5 au maximum. */
  interestStep: 10,
  maxInterest: 5,
  /** ⚠️ Prix d'une relance de la boutique. */
  rerollCost: 2,
  /** ⚠️ Prix pour passer du niveau indiqué au suivant. */
  levelUpCosts: { 2: 4, 3: 8, 4: 12, 5: 20, 6: 28, 7: 36, 8: 48 } as Readonly<Partial<Record<number, number>>>,
} as const;

/** ⚠️ Exemplaires de chaque unité dans le stock commun, selon son coût (coûts 4 et 5 : à venir). */
export const COPIES_BY_COST: Readonly<Partial<Record<UnitCost, number>>> = { 1: 18, 2: 15, 3: 12 };

/**
 * ⚠️ Probabilités (en %) de chaque coût dans la boutique, selon son niveau : [coût 1, coût 2, coût 3].
 * Les unités de coût 4 et 5 n'existent pas encore.
 */
export const SHOP_ODDS: Readonly<Record<number, readonly number[]>> = {
  1: [100, 0, 0],
  2: [100, 0, 0],
  3: [75, 25, 0],
  4: [55, 35, 10],
  5: [45, 40, 15],
  6: [35, 40, 25],
  7: [25, 40, 35],
  8: [20, 35, 45],
  9: [15, 35, 50],
};

/** ⚠️ Génération des escouades ennemies. */
export const ENEMY_BUDGET = {
  /** Budget de la chasse n : base + perHunt × (n − 1), arrondi à l'inférieur. */
  base: 2,
  perHunt: 1.25,
  /** Nombre de monstres : startUnits + 1 toutes les `huntsPerExtraUnit` chasses, `maxUnits` au maximum. */
  startUnits: 2,
  huntsPerExtraUnit: 4,
  maxUnits: 8,
  /** Coût et rang maximum des monstres, par stage (1, 2, 3). */
  maxCostByStage: [2, 3, 3] as readonly UnitCost[],
  maxRankByStage: [2, 3, 3] as readonly number[],
  /** Boss : un monstre de ce coût, à ce rang, plus une escorte. */
  bossCost: 3 as UnitCost,
  bossRank: 3,
} as const;

/** ⚠️ Récompenses (1 parmi 3) ; quantités multipliées après un boss. */
export const REWARDS = {
  materials: 1,
  zennys: 4,
  unitCopies: 1,
  bossMultiplier: 2,
  /** ✅ Retire-objets garantis après chaque boss. */
  bossItemRemovers: 1,
} as const;

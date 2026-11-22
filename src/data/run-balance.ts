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

/** ⚠️ Exemplaires de chaque unité dans le stock commun, selon son coût. */
export const COPIES_BY_COST: Readonly<Partial<Record<UnitCost, number>>> = { 1: 18, 2: 15, 3: 12, 4: 10, 5: 8, 6: 3 };

/**
 * ⚠️ Probabilités (en %) de chaque coût dans la boutique, selon son niveau : [coût 1, 2, 3, 4, 5, 6].
 * ✅ Les Dragons noirs (coût 6) n'apparaissent qu'au niveau 9, à 3 %.
 */
export const SHOP_ODDS: Readonly<Record<number, readonly number[]>> = {
  1: [100, 0, 0, 0, 0, 0],
  2: [100, 0, 0, 0, 0, 0],
  3: [75, 25, 0, 0, 0, 0],
  4: [55, 30, 15, 0, 0, 0],
  5: [45, 33, 20, 2, 0, 0],
  6: [30, 40, 25, 5, 0, 0],
  7: [19, 30, 35, 15, 1, 0],
  8: [18, 25, 32, 22, 3, 0],
  9: [10, 20, 25, 33, 9, 3],
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
  /** Coût et rang maximum des monstres, par stage (1, 2, 3). Les Dragons anciens (coût 5) ne sont que des boss. */
  maxCostByStage: [2, 4, 4] as readonly UnitCost[],
  maxRankByStage: [2, 3, 3] as readonly number[],
} as const;

/** Boss : un monstre tiré parmi ceux qui ont ce coût (ou ce trait), à ce rang. */
export interface BossRule {
  readonly cost?: UnitCost;
  readonly trait?: string;
  readonly rank: number;
  /** Boss plus rare, tiré à la place du boss habituel avec cette probabilité. */
  readonly rare?: BossRule & { readonly chance: number };
}

/**
 * ⚠️ Boss de chaque stage (plus une escorte).
 * ✅ Le boss du stage 3 est un Dragon ancien, ou parfois un Dragon noir (⚠️ 15 % de chances).
 */
export const BOSSES_BY_STAGE: readonly BossRule[] = [
  { cost: 3, rank: 3 },
  { cost: 3, rank: 3 },
  { trait: 'elder-dragon', rank: 2, rare: { trait: 'black-dragon', rank: 1, chance: 0.15 } },
];

/** ⚠️ Récompenses (1 parmi 3) ; quantités multipliées après un boss. */
export const REWARDS = {
  materials: 1,
  zennys: 4,
  unitCopies: 1,
  bossMultiplier: 2,
  /** ✅ Retire-objets garantis après chaque boss. */
  bossItemRemovers: 1,
} as const;

/**
 * Carte d'un stage (game-design §2.1) : 9 étapes de 2 à 3 cases reliées par des chemins, puis le boss.
 * ✅ Forme et types de cases · ⚠️ nombre de cases spéciales par stage, [minimum, maximum].
 */
export const MAP = {
  /** ✅ 9 étapes avant le boss (l'étape 10 est le boss). */
  stepsBeforeBoss: 9,
  /** ✅ 2 à 3 cases par étape. */
  minNodesPerStep: 2,
  maxNodesPerStep: 3,
  forges: [1, 2] as readonly [number, number],
  merchants: [1, 2] as readonly [number, number],
  urgentQuests: [2, 3] as readonly [number, number],
  /** ⚠️ Première étape où une quête urgente peut apparaître. */
  urgentFromStep: 3,
} as const;

/** Quête urgente : ⚠️ escouade générée avec le budget de 3 chasses plus loin ; ✅ récompenses doublées. */
export const URGENT_QUEST = {
  extraHunts: 3,
  rewardMultiplier: 2,
} as const;

/** ✅ Forge : objets déplaçables sans retire-objet pendant l'étape, et jusqu'à 2 matériaux reforgés. */
export const FORGE = {
  reforges: 2,
} as const;

/** ⚠️ Marchand : 4 matériaux tirés au hasard à 3 zennys pièce, un retire-objet à 4 zennys. */
export const MERCHANT = {
  materialsOffered: 4,
  materialPrice: 3,
  itemRemoverPrice: 4,
} as const;

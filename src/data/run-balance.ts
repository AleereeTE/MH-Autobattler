import type { StatBonus, UnitCost } from './definitions.ts';

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
  /** ✅ 5 unités par relance, 10 places en réserve, niveaux de boutique 1 à 10 (niveau 10 ajouté le 2026-11-25). */
  shopSize: 5,
  benchSize: 10,
  maxLevel: 10,
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
  levelUpCosts: { 2: 4, 3: 8, 4: 12, 5: 20, 6: 28, 7: 36, 8: 48, 9: 64 } as Readonly<Partial<Record<number, number>>>,
} as const;

/**
 * ⚠️ Exemplaires de chaque unité dans le stock commun, selon son coût.
 * ✅ 9 exemplaires pour les coûts 5 et 6 (2026-11-25) : juste assez pour un ★3, à condition de tous les obtenir.
 */
export const COPIES_BY_COST: Readonly<Partial<Record<UnitCost, number>>> = { 1: 18, 2: 15, 3: 12, 4: 10, 5: 9, 6: 9 };

/**
 * ⚠️ Probabilités (en %) de chaque coût dans la boutique, selon son niveau : [coût 1, 2, 3, 4, 5, 6].
 * ✅ Les Dragons noirs (coût 6) n'apparaissent qu'aux niveaux 9 (3 %) et 10 (5 %).
 * ✅ Niveau 10 (2026-11-25) : 5 / 15 / 25 / 35 / 15 / 5 %, passage 9 → 10 à 64 zennys.
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
  10: [5, 15, 25, 35, 15, 5],
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

/** Boss : un monstre tiré parmi ceux qui ont ce coût (ou ce trait), à ce rang, en version boss avec ce bonus. */
export interface BossRule {
  readonly cost?: UnitCost;
  readonly trait?: string;
  readonly rank: number;
  /** Bonus de statistiques de la version boss (s'ajoute au renforcement du mode infini). */
  readonly bonus: StatBonus;
  /** Boss plus rare, tiré à la place du boss habituel avec cette probabilité. */
  readonly rare?: BossRule & { readonly chance: number };
}

/**
 * ⚠️ Bonus de la version boss, réglés par simulation (2026-11-27) : avec une escorte réduite, chaque boss gagne
 * environ 10 points de difficulté par rapport à l'ancienne « escouade renforcée » (taux de victoire d'équipes
 * de joueur typiques : stage 1 24 → 16 %, stage 2 86 → 75 %, stage 3 93 → 81 %, étape 40 79 → 68 %).
 */
const STAGE_1_2_BOSS_BONUS: StatBonus = { hpPercent: 1.3, attackPercent: 0.35, elementalPowerPercent: 0.35 };
const STAGE_3_BOSS_BONUS: StatBonus = { hpPercent: 5, attackPercent: 0.8, elementalPowerPercent: 0.8 };
const INFINITE_BOSS_BONUS: StatBonus = { hpPercent: 9, attackPercent: 1.2, elementalPowerPercent: 1.2 };

/**
 * ⚠️ Boss de chaque stage (plus une escorte) : stages 1, 2 et 3, puis le mode infini (stages 4 et suivants).
 * ✅ Le boss du stage 3 est toujours un Dragon ancien (2026-11-27 : plus de Dragon noir au stage 3).
 * ✅ En mode infini, c'est parfois un Dragon noir (⚠️ 15 % de chances).
 */
export const BOSSES_BY_STAGE: readonly BossRule[] = [
  { cost: 3, rank: 3, bonus: STAGE_1_2_BOSS_BONUS },
  { cost: 3, rank: 3, bonus: STAGE_1_2_BOSS_BONUS },
  { trait: 'elder-dragon', rank: 2, bonus: STAGE_3_BOSS_BONUS },
  {
    trait: 'elder-dragon',
    rank: 2,
    bonus: INFINITE_BOSS_BONUS,
    rare: { trait: 'black-dragon', rank: 1, chance: 0.15, bonus: INFINITE_BOSS_BONUS },
  },
];

/** Types de récompense tirés au hasard à côté de la capture. */
export type DrawnRewardKind = 'unit' | 'object' | 'materials' | 'itemRemovers' | 'zennys';

/**
 * Récompenses « 1 parmi 3 » (game-design §11). ✅ La capture est toujours proposée quand un monstre de l'escouade
 * vaincue peut l'être ; les autres choix sont tirés au hasard, de types différents.
 * ✅ Quantités multipliées après un boss ou une quête urgente (×2), capture comprise · ⚠️ quantités et poids provisoires.
 */
export const REWARDS = {
  materials: 1,
  zennys: 4,
  unitCopies: 1,
  /** ✅ Exemplaires ★1 d'un monstre capturé (pris dans le stock commun). */
  captureCopies: 1,
  objects: 1,
  itemRemovers: 1,
  bossMultiplier: 2,
  /** ✅ Retire-objets garantis après chaque boss. */
  bossItemRemovers: 1,
  /** ⚠️ Poids de tirage des autres choix (sur 100). */
  weights: { unit: 25, object: 12, materials: 25, itemRemovers: 8, zennys: 30 } satisfies Record<DrawnRewardKind, number>,
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

/**
 * Mode infini (game-design §2.2), proposé après avoir gagné la run.
 * ✅ +5 % de PV, d'attaque brute et de puissance élémentaire pour les ennemis à chaque étape après la 30e
 * (validé le 2026-11-24, à ajuster en jouant) : +50 % à l'étape 40, +150 % à l'étape 60.
 */
export const INFINITE_MODE = {
  statGrowthPerHunt: 0.05,
} as const;

/** ⚠️ Marchand : 4 matériaux tirés au hasard à 3 zennys pièce, un retire-objet à 4 zennys. */
export const MERCHANT = {
  materialsOffered: 4,
  materialPrice: 3,
  itemRemoverPrice: 4,
} as const;

import type { Placement } from '../combat/index.ts';
import type { Hex } from '../core/hex.ts';
import type { Rng } from '../core/rng.ts';
import type { StarRank } from '../data/definitions.ts';
import type { Equipment, EquipmentSlot, MaterialId } from '../data/items.ts';

/**
 * État d'une run : tout ce que le joueur possède et où il en est.
 * Les fonctions du dossier `run/` le modifient ; l'interface ne fait que le lire et les appeler.
 */

/** Où se trouve une unité : une place de la réserve, ou une case du plateau (camp du joueur). */
export type Location = { readonly area: 'bench'; readonly index: number } | { readonly area: 'board'; readonly hex: Hex };

/** Unité possédée par le joueur. */
export interface RunUnit {
  /** Identifiant unique dans la run. */
  readonly uid: number;
  readonly unitId: string;
  rank: StarRank;
  equipment: Equipment;
  location: Location;
}

export type RewardOption =
  | { readonly kind: 'materials'; readonly materials: readonly MaterialId[] }
  | { readonly kind: 'zennys'; readonly amount: number }
  | { readonly kind: 'unit'; readonly unitId: string; readonly copies: number };

/** Résumé du dernier combat, pour l'affichage. */
export interface LastCombat {
  readonly hunt: number;
  readonly boss: boolean;
  readonly won: boolean;
}

export type RunPhase = 'prep' | 'reward' | 'over';

export interface RunState {
  readonly seed: number;
  readonly rng: Rng;
  /** Chasse en cours, de 1 à 30. */
  hunt: number;
  defeats: number;
  zennys: number;
  /** Niveau de boutique : c'est aussi le nombre maximum d'unités sur le plateau. */
  level: number;
  /** Unités proposées par la boutique (null = déjà achetée). */
  shop: (string | null)[];
  units: RunUnit[];
  /** Exemplaires restants de chaque unité dans le stock commun. */
  pool: Map<string, number>;
  /** Matériaux et objets qui ne sont posés sur aucune unité. */
  inventory: EquipmentSlot[];
  itemRemovers: number;
  phase: RunPhase;
  /** Escouade de la chasse en cours, visible pendant la préparation. */
  enemy: Placement[];
  /** Chasse pour laquelle `enemy` a été générée (un boss perdu se réaffronte à l'identique). */
  enemyHunt: number;
  /** Graine du prochain combat. */
  combatSeed: number;
  /** Bonus de victoire à verser au début du prochain tour. */
  wonLastCombat: boolean;
  rewards: RewardOption[] | null;
  lastCombat: LastCombat | null;
  outcome: 'victory' | 'defeat' | null;
  nextUid: number;
}

export type ActionResult = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export const OK: ActionResult = { ok: true };

export function fail(reason: string): ActionResult {
  return { ok: false, reason };
}

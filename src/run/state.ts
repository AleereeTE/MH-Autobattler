import type { Placement } from '../combat/index.ts';
import type { Hex } from '../core/hex.ts';
import type { Rng } from '../core/rng.ts';
import type { StarRank, StatBonus, TraitId } from '../data/definitions.ts';
import type { TalentTier } from '../data/talents.ts';
import type { Equipment, EquipmentSlot, MaterialId } from '../data/items.ts';
import type { StageMap } from './map.ts';
import type { MerchantStock } from './merchant.ts';

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

/** Monstre capturable après une victoire, et nombre d'exemplaires ★1 obtenus. */
export interface CaptureTarget {
  readonly unitId: string;
  readonly copies: number;
}

export type RewardOption =
  | { readonly kind: 'capture'; readonly targets: readonly CaptureTarget[] }
  | { readonly kind: 'unit'; readonly unitId: string; readonly copies: number }
  | { readonly kind: 'object'; readonly objects: readonly (readonly [MaterialId, MaterialId])[] }
  | { readonly kind: 'materials'; readonly materials: readonly MaterialId[] }
  | { readonly kind: 'itemRemovers'; readonly amount: number }
  | { readonly kind: 'zennys'; readonly amount: number };

/** Résumé du dernier combat, pour l'affichage. */
export interface LastCombat {
  readonly hunt: number;
  readonly boss: boolean;
  readonly won: boolean;
}

/** Une proposition de talent de chasseur, avec le trait ou l'unité tirés pour elle. */
export interface TalentOffer {
  readonly talentId: string;
  readonly traitId: TraitId | null;
  readonly unitId: string | null;
  /** Cette proposition a déjà été relancée (une seule fois par proposition). */
  readonly rerolled: boolean;
}

/** Choix de talent en attente : une rareté, et ses propositions. */
export interface TalentChoice {
  readonly tier: TalentTier;
  offers: TalentOffer[];
}

/** Événement de la case en cours : son identifiant, et le compte rendu du choix une fois fait (null avant). */
export interface EventState {
  readonly eventId: string;
  result: readonly string[] | null;
}

/** Talent de chasseur pris pendant la run, avec son trait ou son unité tirés. */
export interface OwnedTalent {
  readonly talentId: string;
  readonly traitId: TraitId | null;
  readonly unitId: string | null;
}

/**
 * `talent` : choisir un talent de chasseur (début des stages 1 à 3) · `map` : choisir la prochaine case de la carte ·
 * `prep` : préparation sur la case choisie · `reward` · `over`.
 */
export type RunPhase = 'talent' | 'map' | 'prep' | 'reward' | 'over';

export interface RunState {
  readonly seed: number;
  readonly rng: Rng;
  /** Étape en cours (ou à choisir sur la carte), de 1 à 30, puis au-delà en mode infini. */
  hunt: number;
  /** Mode infini en cours (après une run gagnée). */
  infinite: boolean;
  /** Carte du stage en cours. */
  map: StageMap;
  /** Cases choisies depuis le début du stage (leur position dans chaque étape) : la dernière est la case actuelle. */
  path: number[];
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
  /** Talents de chasseur pris pendant la run. */
  talents: OwnedTalent[];
  /** Choix de talent en attente (phase `talent`), sinon null. */
  talentChoice: TalentChoice | null;
  /** Relances gratuites de la boutique qu'il reste ce tour (Commerce félyne). */
  freeRerolls: number;
  phase: RunPhase;
  /** Escouade de la case en cours, visible pendant la préparation (vide sur une case sans combat). */
  enemy: Placement[];
  /** Marchandises du marchand, quand on est sur sa case. */
  merchant: MerchantStock | null;
  /** Matériaux qu'il reste à reforger, quand on est sur une forge. */
  reforgesLeft: number;
  /** Événement de la case en cours, quand on est sur une case Événement. */
  event: EventState | null;
  /** Événements déjà rencontrés pendant la run (ils ne reviennent pas tant qu'il en reste d'autres). */
  seenEvents: string[];
  /** La prochaine chasse (hors boss) sera renforcée comme une quête urgente (Œuf de wyverne, Monstre endormi). */
  nextHuntReinforced: boolean;
  /** Bonus de toute l'équipe au prochain combat (Repas de chasse), ou null. */
  nextCombatBonus: StatBonus | null;
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

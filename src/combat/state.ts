import type { Hex } from '../core/hex.ts';
import type { Rng } from '../core/rng.ts';
import type { StarRank, UnitDefinition } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import type { CombatStats } from '../rules/stats.ts';
import { ticksToSeconds } from './constants.ts';
import type { CombatEvent } from './events.ts';

export type Side = 'player' | 'enemy';
export const SIDES: readonly Side[] = ['player', 'enemy'];

/** Modification temporaire de la vitesse d'attaque (bonus ou ralentissement). */
export interface TimedModifier {
  /** Une nouvelle application avec la même clé remplace l'ancienne (pas de cumul). */
  readonly key: string;
  readonly attackSpeedPercent: number;
  remainingTicks: number;
}

export interface Shield {
  amount: number;
  remainingTicks: number;
}

export interface Burn {
  readonly sourceUid: number;
  readonly damagePerSecond: number;
  remainingTicks: number;
  ticksUntilDamage: number;
}

/** Effets appliqués à chaque coup porté (attaque ou compétence), venant des traits d'élément. */
export interface OnHitEffects {
  readonly burn?: { readonly damagePerSecond: number; readonly durationTicks: number };
  readonly chill?: { readonly attackSpeedPercent: number; readonly durationTicks: number };
}

/** Éclairs du trait Foudre, propres à un camp. */
export interface LightningState {
  readonly damage: number;
  readonly intervalTicks: number;
  ticksUntilStrike: number;
}

/** État d'une unité pendant un combat (sa fiche, elle, ne change pas). */
export interface CombatUnit {
  /** Identifiant unique dans ce combat ; fixe aussi l'ordre d'action dans un tick. */
  readonly uid: number;
  readonly def: UnitDefinition;
  /** Rang ★ : il augmente PV et attaque brute, et choisit la valeur de base de la compétence. */
  readonly rank: StarRank;
  readonly side: Side;
  readonly equipment: Equipment;
  /** Statistiques de combat : fiche + matériaux, objets et traits. `stats.hp` = PV max. */
  readonly stats: CombatStats;
  readonly onHit: OnHitEffects;
  position: Hex;
  hp: number;
  energy: number;
  /** Passe à false quand l'unité est K.O. (résolu en fin de tick). */
  alive: boolean;
  targetUid: number | null;
  /** Avancement vers la prochaine attaque : une attaque part quand il atteint 1. */
  attackProgress: number;
  /** Déplacement en cours vers une case voisine. */
  move: { readonly to: Hex; remainingTicks: number } | null;
  /** Incantation de compétence en cours. */
  cast: { remainingTicks: number } | null;
  modifiers: TimedModifier[];
  shields: Shield[];
  burn: Burn | null;
}

export interface CombatState {
  tick: number;
  readonly units: CombatUnit[];
  readonly rng: Rng;
  readonly events: CombatEvent[];
  readonly lightning: Record<Side, LightningState | null>;
}

/** Une unité peut être ciblée tant qu'elle n'est pas K.O. et qu'il lui reste des PV. */
export function isTargetable(unit: CombatUnit): boolean {
  return unit.alive && unit.hp > 0;
}

export function elapsedSeconds(state: CombatState): number {
  return ticksToSeconds(state.tick);
}

export function findUnitByUid(state: CombatState, uid: number): CombatUnit | undefined {
  return state.units.find((unit) => unit.uid === uid);
}

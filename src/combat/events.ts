import type { Hex } from '../core/hex.ts';
import type { DamageType, Element, Role, SkillEffect, StarRank, TraitId, UnitCost, UnitKind } from '../data/definitions.ts';
import type { Side } from './state.ts';

/**
 * Événements de combat : le moteur les produit, le rendu les rejoue.
 * Chaque événement porte le tick auquel il s'est produit.
 */

export interface UnitSnapshot {
  readonly uid: number;
  readonly defId: string;
  readonly name: string;
  readonly side: Side;
  readonly kind: UnitKind;
  readonly role: Role;
  readonly element: Element | null;
  readonly cost: UnitCost;
  readonly rank: StarRank;
  readonly position: Hex;
  readonly maxHp: number;
  readonly maxEnergy: number;
}

export interface TraitSummary {
  readonly id: TraitId;
  readonly name: string;
  readonly count: number;
  /** Palier atteint (nombre d'unités requis), ou null si le trait est inactif. */
  readonly activeCount: number | null;
}

/** null = combat interrompu par la limite de sécurité (signe d'un bug). */
export type Winner = Side | null;
export type CombatEndReason = 'elimination' | 'safetyLimit';
export type DamageCause = 'attack' | 'skill' | 'burn' | 'lightning';
export type StatusKind = 'burn' | 'chill' | 'haste';
export type SkillEffectKind = SkillEffect['kind'];

type At<T> = T & { readonly tick: number };

export type CombatEvent =
  | At<{ type: 'combatStart'; units: readonly UnitSnapshot[]; traits: Readonly<Record<Side, readonly TraitSummary[]>> }>
  | At<{ type: 'move'; uid: number; from: Hex; to: Hex; durationTicks: number }>
  | At<{ type: 'leap'; uid: number; from: Hex; to: Hex }>
  | At<{ type: 'attack'; uid: number; targetUid: number }>
  | At<{
      type: 'damage';
      sourceUid: number;
      targetUid: number;
      /** Dégâts après réduction, bouclier compris. */
      amount: number;
      /** Part absorbée par un bouclier. */
      absorbed: number;
      damageType: DamageType;
      cause: DamageCause;
      isCrit: boolean;
      hpAfter: number;
    }>
  | At<{ type: 'heal'; sourceUid: number; targetUid: number; amount: number; hpAfter: number }>
  | At<{ type: 'shield'; uid: number; amount: number; durationTicks: number }>
  | At<{ type: 'status'; uid: number; status: StatusKind; durationTicks: number }>
  | At<{ type: 'skillCast'; uid: number; skillId: string; skillName: string; castTicks: number }>
  | At<{ type: 'skillResolve'; uid: number; skillId: string; skillName: string }>
  | At<{
      type: 'skillArea';
      uid: number;
      /** Type d'effet de la compétence (dégâts, bouclier, soin, bonus). */
      effect: SkillEffectKind;
      /** Centre de la zone : la cible principale, ou le lanceur. */
      center: Hex;
      /** Cases touchées autour du centre (0 = le centre seul). */
      radius: number;
    }>
  | At<{ type: 'lightning'; sourceUid: number; targetUid: number }>
  /** Une attaque de base est esquivée (Léviathan) : ni dégâts ni effet d'élément. */
  | At<{ type: 'dodge'; sourceUid: number; targetUid: number }>
  | At<{ type: 'death'; uid: number }>
  | At<{ type: 'suddenDeath' }>
  | At<{ type: 'combatEnd'; winner: Winner; reason: CombatEndReason }>;

export type CombatEndEvent = Extract<CombatEvent, { type: 'combatEnd' }>;

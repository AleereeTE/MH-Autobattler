import type { Hex } from '../core/hex.ts';
import type { DamageType, Element, Role, SkillEffect, StarRank, TraitId, UnitCost, UnitKind } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import type { Side } from './state.ts';

/**
 * Événements de combat : le moteur les produit, le rendu les rejoue.
 * Chaque événement porte le tick auquel il s'est produit.
 */

/** Statistiques de combat d'une unité au début du combat (rang, objets et traits compris), pour l'affichage. */
export interface SnapshotStats {
  readonly hp: number;
  readonly attack: number;
  readonly elementalPower: number;
  readonly critChance: number;
  readonly armor: number;
  readonly elementalResist: number;
  readonly attackSpeed: number;
  readonly range: number;
  readonly maxEnergy: number;
}

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
  /** Version boss (absent pour une unité normale). */
  readonly boss?: boolean;
  readonly position: Hex;
  readonly maxHp: number;
  readonly maxEnergy: number;
  /** Énergie au début du combat (0, sauf trait comme la Calamité des Dragons anciens). */
  readonly energy: number;
  readonly equipment: Equipment;
  readonly stats: SnapshotStats;
}

/** Énergie d'une unité à un instant donné. */
export interface EnergyLevel {
  readonly uid: number;
  readonly energy: number;
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
/** `item` : dégâts d'un effet d'objet (Éveil élémentaire, Attaque explosion…). */
export type DamageCause = 'attack' | 'skill' | 'burn' | 'lightning' | 'item' | 'poison';
export type StatusKind = 'burn' | 'chill' | 'haste' | 'poison' | 'paralysis';
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
  /** `master` : compétence secrète du ★3 (Dragons noirs), annoncée par un bandeau au replay. */
  | At<{ type: 'skillCast'; uid: number; skillId: string; skillName: string; castTicks: number; master?: boolean }>
  | At<{ type: 'skillResolve'; uid: number; skillId: string; skillName: string }>
  /** Un boss s'enrage à mi-vie : sa compétence de boss remplace la sienne. */
  | At<{ type: 'enrage'; uid: number; skillName: string }>
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
  /** Relevé de l'énergie des unités en vie, toutes les ENERGY_SNAPSHOT_TICKS (pour la barre d'énergie). */
  | At<{ type: 'energy'; levels: readonly EnergyLevel[] }>
  | At<{ type: 'death'; uid: number }>
  | At<{ type: 'suddenDeath' }>
  | At<{ type: 'combatEnd'; winner: Winner; reason: CombatEndReason }>;

export type CombatEndEvent = Extract<CombatEvent, { type: 'combatEnd' }>;

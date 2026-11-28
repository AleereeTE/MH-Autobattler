import type { Placement } from '../combat/index.ts';
import type { Hex } from '../core/hex.ts';
import { createRng } from '../core/rng.ts';
import type { StarRank, StatBonus } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import { findUnit } from '../data/units/index.ts';
import type { MapNode, StageMap } from './map.ts';
import type { RunPhase, RunState } from './state.ts';

/**
 * Sauvegarde d'une run (game-design §2) : ✅ reprise exacte. Tout l'état est enregistré, y compris celui
 * du générateur aléatoire : recharger la page ne relance ni la boutique ni un combat.
 * Ce module ne fait que convertir l'état en texte (JSON) et inversement ; l'interface choisit où le ranger.
 */

/** Version du format : une sauvegarde d'une autre version est ignorée. */
export const SAVE_VERSION = 1;

/** Unité posée, avec l'identifiant de sa fiche au lieu de la fiche elle-même. */
interface SavedPlacement {
  readonly unitId: string;
  readonly position: Hex;
  readonly equipment?: Equipment;
  readonly rank?: StarRank;
  readonly bonus?: StatBonus;
  readonly boss?: boolean;
}

type SavedNode = Omit<MapNode, 'squad'> & { readonly squad: readonly SavedPlacement[] };

type SavedState = Omit<RunState, 'rng' | 'pool' | 'map' | 'enemy'> & {
  readonly pool: readonly (readonly [string, number])[];
  readonly map: { readonly stage: number; readonly steps: readonly (readonly SavedNode[])[] };
  readonly enemy: readonly SavedPlacement[];
};

interface SavedRun {
  readonly version: number;
  readonly rngState: number;
  readonly state: SavedState;
}

const PHASES: readonly RunPhase[] = ['talent', 'map', 'prep', 'reward', 'over'];

function savePlacement({ unit, ...rest }: Placement): SavedPlacement {
  return { unitId: unit.id, ...rest };
}

function restorePlacement({ unitId, ...rest }: SavedPlacement): Placement {
  const unit = findUnit(unitId);
  if (unit === undefined) throw new Error(`unité inconnue : ${unitId}`);
  return { unit, ...rest };
}

/** Texte à ranger : l'état complet de la run. */
export function serializeRun(state: RunState): string {
  const { rng, pool, map, enemy, ...rest } = state;
  const saved: SavedRun = {
    version: SAVE_VERSION,
    rngState: rng.state(),
    state: {
      ...rest,
      pool: [...pool],
      map: { stage: map.stage, steps: map.steps.map((step) => step.map(({ squad, ...node }) => ({ ...node, squad: squad.map(savePlacement) }))) },
      enemy: enemy.map(savePlacement),
    },
  };
  return JSON.stringify(saved);
}

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * Run reconstruite à partir d'une sauvegarde, ou null si elle est absente, d'une autre version,
 * abîmée, ou si elle cite une unité qui n'existe plus.
 */
export function restoreRun(raw: string | null): RunState | null {
  if (raw === null) return null;
  try {
    const saved = JSON.parse(raw) as SavedRun;
    if (saved?.version !== SAVE_VERSION || !isNumber(saved.rngState)) return null;
    const { pool, map, enemy, ...rest } = saved.state;
    const numbers = [rest.seed, rest.hunt, rest.defeats, rest.zennys, rest.level, rest.itemRemovers, rest.nextUid, rest.combatSeed];
    if (!numbers.every(isNumber) || !PHASES.includes(rest.phase)) return null;
    if (!Array.isArray(rest.units) || !Array.isArray(rest.shop) || !Array.isArray(rest.inventory) || !Array.isArray(pool)) return null;
    if (rest.units.some((unit) => findUnit(unit.unitId) === undefined)) return null;
    if (rest.shop.some((unitId) => unitId !== null && findUnit(unitId) === undefined)) return null;
    const stageMap: StageMap = {
      stage: map.stage,
      steps: map.steps.map((step) => step.map(({ squad, ...node }) => ({ ...node, squad: squad.map(restorePlacement) }))),
    };
    return {
      ...rest,
      // Champs ajoutés après les premières sauvegardes (cases Événement).
      event: rest.event ?? null,
      seenEvents: rest.seenEvents ?? [],
      nextHuntReinforced: rest.nextHuntReinforced ?? false,
      nextCombatBonus: rest.nextCombatBonus ?? null,
      rng: createRng(saved.rngState),
      pool: new Map(pool),
      map: stageMap,
      enemy: enemy.map(restorePlacement),
    };
  } catch {
    return null;
  }
}

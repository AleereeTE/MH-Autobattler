import { ROWS_PER_SIDE, hexKey, isOnBoard, type Hex } from '../core/hex.ts';
import { createRng } from '../core/rng.ts';
import type { StarRank, TraitId, UnitDefinition } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';
import type { TraitTier } from '../data/traits.ts';
import { SLOT_CAPACITY, equipmentBonuses } from '../rules/equipment.ts';
import { BLACK_DRAGON_LIMIT_MESSAGE, exceedsBlackDragonLimit } from '../rules/board-limits.ts';
import { isStarRank, rankedStats } from '../rules/ranks.ts';
import { computeCombatStats } from '../rules/stats.ts';
import { traitStatuses, type TraitStatus } from '../rules/traits.ts';
import type { TraitSummary, UnitSnapshot } from './events.ts';
import { SIDES, type CombatState, type CombatUnit, type LightningState, type Side } from './state.ts';
import { lightningFor, terrorFor, traitLoadout } from './traits/loadout.ts';

export interface Placement {
  readonly unit: UnitDefinition;
  readonly position: Hex;
  readonly equipment?: Equipment;
  /** Rang ★ de l'unité (★1 par défaut). */
  readonly rank?: StarRank;
}

/** Composition, placement et équipement des deux camps au début d'un combat. */
export interface CombatSetup {
  readonly player: readonly Placement[];
  readonly enemy: readonly Placement[];
}

/** Le camp ennemi occupe les rangées 0 à 3 (en haut), le joueur les rangées 4 à 7 (en bas). */
export function isInSideArea(side: Side, { row }: Hex): boolean {
  return side === 'enemy' ? row < ROWS_PER_SIDE : row >= ROWS_PER_SIDE;
}

export function createCombatState(setup: CombatSetup, seed: number): CombatState {
  validateSetup(setup);

  const units: CombatUnit[] = [];
  const lightning: Record<Side, LightningState | null> = { player: null, enemy: null };
  const terror: Record<Side, number> = { player: 0, enemy: 0 };
  const traits: Record<Side, TraitSummary[]> = { player: [], enemy: [] };

  for (const side of SIDES) {
    const placements = setup[side];
    const statuses = traitStatuses(placements.map((placement) => placement.unit));
    const active = new Map<TraitId, TraitTier>();
    for (const status of statuses) if (status.tier !== null) active.set(status.trait.id, status.tier);

    traits[side] = statuses.map(summarizeTrait);
    lightning[side] = lightningFor(active);
    terror[side] = terrorFor(active);
    for (const placement of placements) units.push(createUnit(units.length + 1, side, placement, active));
  }

  const state: CombatState = { tick: 0, units, rng: createRng(seed), events: [], lightning, terror };
  state.events.push({ type: 'combatStart', tick: 0, units: units.map(snapshot), traits });
  return state;
}

function createUnit(uid: number, side: Side, placement: Placement, active: ReadonlyMap<TraitId, TraitTier>): CombatUnit {
  const { unit, position } = placement;
  const equipment = placement.equipment ?? [];
  const rank = placement.rank ?? 1;
  const loadout = traitLoadout(unit, equipment, active);
  // Le rang s'applique aux statistiques de la fiche, avant les bonus des objets et des traits.
  const stats = computeCombatStats(rankedStats(unit.stats, rank), [...equipmentBonuses(equipment), ...loadout.bonuses]);

  return {
    uid,
    def: unit,
    rank,
    side,
    equipment,
    stats,
    onHit: loadout.onHit,
    position: { ...position },
    hp: stats.hp,
    // ✅ Les unités commencent à 0 énergie, sauf trait (Calamité des Dragons anciens).
    energy: stats.maxEnergy * stats.startingEnergyRatio,
    alive: true,
    targetUid: null,
    attackProgress: 0,
    move: null,
    cast: null,
    modifiers: [],
    shields: [],
    burn: null,
    armorShred: 0,
    critStacks: 0,
    landedAttacks: 0,
    hitsTaken: 0,
    skillsResolved: 0,
    defenseBuff: null,
    poison: null,
    paralyzedTicks: 0,
  };
}

function summarizeTrait({ trait, count, tier }: TraitStatus): TraitSummary {
  return { id: trait.id, name: trait.name, count, activeCount: tier?.count ?? null };
}

function snapshot(unit: CombatUnit): UnitSnapshot {
  return {
    uid: unit.uid,
    defId: unit.def.id,
    name: unit.def.name,
    side: unit.side,
    kind: unit.def.kind,
    role: unit.def.role,
    element: unit.def.element,
    cost: unit.def.cost,
    rank: unit.rank,
    position: { ...unit.position },
    maxHp: unit.stats.hp,
    maxEnergy: unit.stats.maxEnergy,
    energy: unit.energy,
    equipment: unit.equipment,
    stats: {
      hp: unit.stats.hp,
      attack: unit.stats.attack,
      elementalPower: unit.stats.elementalPower,
      critChance: unit.stats.critChance,
      armor: unit.stats.armor,
      elementalResist: unit.stats.elementalResist,
      attackSpeed: unit.stats.attackSpeed,
      range: unit.stats.range,
      maxEnergy: unit.stats.maxEnergy,
    },
  };
}

function validateSetup(setup: CombatSetup): void {
  if (setup.player.length === 0 || setup.enemy.length === 0) {
    throw new Error('Chaque camp doit avoir au moins une unité.');
  }

  const occupied = new Set<string>();
  const check = (side: Side, { unit, position, equipment = [], rank = 1 }: Placement): void => {
    if (!isOnBoard(position) || !isInSideArea(side, position)) {
      throw new Error(`${unit.name} est placé hors de la zone de son camp (${hexKey(position)}).`);
    }
    if (occupied.has(hexKey(position))) {
      throw new Error(`Deux unités occupent la même case (${hexKey(position)}).`);
    }
    if (unit.stats.maxEnergy <= 0) {
      throw new Error(`${unit.name} doit avoir une énergie maximale supérieure à 0.`);
    }
    if (!isStarRank(rank)) {
      throw new Error(`${unit.name} a un rang invalide (${String(rank)}) : il doit valoir 1, 2 ou 3.`);
    }
    if (equipment.length > SLOT_CAPACITY[unit.kind]) {
      throw new Error(`${unit.name} porte trop d'objets (${equipment.length} / ${SLOT_CAPACITY[unit.kind]}).`);
    }
    occupied.add(hexKey(position));
  };
  for (const side of SIDES) setup[side].forEach((placement) => check(side, placement));
  for (const side of SIDES) {
    if (exceedsBlackDragonLimit(setup[side].map((placement) => placement.unit))) throw new Error(BLACK_DRAGON_LIMIT_MESSAGE);
  }
}

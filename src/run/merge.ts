import type { StarRank } from '../data/definitions.ts';
import type { Equipment, EquipmentSlot } from '../data/items.ts';
import { findUnit } from '../data/units/index.ts';
import { SLOT_CAPACITY, addMaterial, addObject } from '../rules/equipment.ts';
import type { RunState, RunUnit } from './state.ts';

/**
 * ✅ Fusion automatique (game-design §3.4 et §7.2) : 3 exemplaires identiques du même rang
 * deviennent un exemplaire du rang supérieur. Les exemplaires du plateau et de la réserve comptent ;
 * l'unité fusionnée prend la place d'un exemplaire posé sur le plateau, sinon d'un exemplaire en réserve.
 */

/** Ordre de priorité pour garder un exemplaire : plateau d'abord, puis réserve de gauche à droite. */
function keepPriority(unit: RunUnit): number {
  if (unit.location.area === 'board') return -1;
  return unit.location.index < 0 ? Number.MAX_SAFE_INTEGER : unit.location.index;
}

/**
 * Regroupe l'équipement des exemplaires sur l'unité gardée, dans la limite de ses emplacements :
 * les objets d'abord, puis les matériaux (qui fusionnent avec un matériau seul, comme d'habitude).
 */
export function regroupEquipment(
  kept: Equipment,
  others: readonly Equipment[],
  capacity: number,
): { equipment: Equipment; overflow: EquipmentSlot[] } {
  const extra = others.flat();
  const ordered = [...extra.filter((slot) => slot.kind === 'object'), ...extra.filter((slot) => slot.kind === 'material')];
  let equipment = kept;
  const overflow: EquipmentSlot[] = [];
  for (const slot of ordered) {
    const next = slot.kind === 'object' ? addObject(equipment, slot.materials, capacity) : addMaterial(equipment, slot.material, capacity);
    if (next === null) overflow.push(slot);
    else equipment = next;
  }
  return { equipment, overflow };
}

/** Cherche un groupe de 3 exemplaires identiques du même rang (★1 ou ★2). */
function findTriple(units: readonly RunUnit[]): RunUnit[] | null {
  for (const rank of [1, 2] as const) {
    const groups = new Map<string, RunUnit[]>();
    for (const unit of units) {
      if (unit.rank !== rank) continue;
      const group = groups.get(unit.unitId) ?? [];
      group.push(unit);
      groups.set(unit.unitId, group);
    }
    for (const group of groups.values()) {
      if (group.length >= 3) return [...group].sort((a, b) => keepPriority(a) - keepPriority(b)).slice(0, 3);
    }
  }
  return null;
}

/** Applique toutes les fusions possibles (une fusion ★2 peut en entraîner une ★3). Renvoie les unités fusionnées. */
export function resolveMerges(state: RunState): RunUnit[] {
  const merged: RunUnit[] = [];
  for (let triple = findTriple(state.units); triple !== null; triple = findTriple(state.units)) {
    const [kept, ...others] = triple as [RunUnit, RunUnit, RunUnit];
    const kind = findUnit(kept.unitId)?.kind ?? 'monster';
    const { equipment, overflow } = regroupEquipment(
      kept.equipment,
      others.map((unit) => unit.equipment),
      SLOT_CAPACITY[kind],
    );
    kept.rank = (kept.rank + 1) as StarRank;
    kept.equipment = equipment;
    state.inventory.push(...overflow);
    state.units = state.units.filter((unit) => !others.includes(unit));
    merged.push(kept);
  }
  return merged;
}

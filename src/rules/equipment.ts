import type { StatBonus, UnitKind } from '../data/definitions.ts';
import {
  GENERIC_OBJECT_EXTRA,
  MATERIALS,
  SIGNATURE_OBJECTS,
  type Equipment,
  type EquipmentSlot,
  type MaterialId,
  type ObjectDefinition,
} from '../data/items.ts';
import { scaleBonus, sumBonuses } from './stats.ts';

/** ✅ Emplacements d'objets : 3 pour un chasseur, 1 pour un monstre. */
export const SLOT_CAPACITY: Readonly<Record<UnitKind, number>> = { hunter: 3, monster: 1 };

type MaterialPair = readonly [MaterialId, MaterialId];

function samePair(a: MaterialPair, b: MaterialPair): boolean {
  return (a[0] === b[0] && a[1] === b[1]) || (a[0] === b[1] && a[1] === b[0]);
}

/** Objet obtenu en fusionnant deux matériaux (l'ordre ne compte pas). */
export function objectFor(materials: MaterialPair): ObjectDefinition {
  const signature = SIGNATURE_OBJECTS.find((object) => samePair(object.materials, materials));
  if (signature !== undefined) return signature;

  const [a, b] = materials;
  return {
    id: `generic:${[a, b].sort().join('+')}`,
    name: `Fusion ${MATERIALS[a].name} + ${MATERIALS[b].name}`,
    materials,
    effect: scaleBonus(sumBonuses([MATERIALS[a].bonus, MATERIALS[b].bonus]), GENERIC_OBJECT_EXTRA),
    description: 'Objet générique : statistiques des deux matériaux +50 % (effet à concevoir).',
    generic: true,
  };
}

/**
 * ✅ Pose un matériau sur une unité. S'il y a déjà un matériau seul, les deux fusionnent
 * en un objet ; sinon le matériau occupe un emplacement libre.
 * Renvoie null si tous les emplacements sont pris.
 */
export function addMaterial(equipment: Equipment, material: MaterialId, capacity: number): Equipment | null {
  const loneIndex = equipment.findIndex((slot) => slot.kind === 'material');
  const lone = equipment[loneIndex];
  if (lone !== undefined && lone.kind === 'material') {
    const fused: EquipmentSlot = { kind: 'object', materials: [lone.material, material] };
    return equipment.map((slot, index) => (index === loneIndex ? fused : slot));
  }
  if (equipment.length >= capacity) return null;
  return [...equipment, { kind: 'material', material }];
}

/** Pose directement un objet complet (bac à sable). Renvoie null si tous les emplacements sont pris. */
export function addObject(equipment: Equipment, materials: MaterialPair, capacity: number): Equipment | null {
  if (equipment.length >= capacity) return null;
  return [...equipment, { kind: 'object', materials }];
}

export function removeSlot(equipment: Equipment, index: number): Equipment {
  return equipment.filter((_, i) => i !== index);
}

export function countObjects(equipment: Equipment): number {
  return equipment.filter((slot) => slot.kind === 'object').length;
}

export function slotName(slot: EquipmentSlot): string {
  return slot.kind === 'material' ? MATERIALS[slot.material].name : objectFor(slot.materials).name;
}

/** Bonus apportés par l'équipement : chaque matériau, et pour un objet ses deux matériaux + son effet. */
export function equipmentBonuses(equipment: Equipment): StatBonus[] {
  return equipment.flatMap((slot) =>
    slot.kind === 'material'
      ? [MATERIALS[slot.material].bonus]
      : [MATERIALS[slot.materials[0]].bonus, MATERIALS[slot.materials[1]].bonus, objectFor(slot.materials).effect],
  );
}

import { findUnit } from '../data/units/index.ts';
import { SLOT_CAPACITY, addMaterial, addObject, removeSlot } from '../rules/equipment.ts';
import { isAtForge } from './forge.ts';
import { findRunUnit } from './roster.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';

/**
 * ✅ Équipement pendant la run (game-design §7.2) : poser un matériau ou un objet de l'inventaire sur une unité,
 * retirer un matériau (gratuit) ou un objet (il faut un retire-objet).
 */

export function equipFromInventory(state: RunState, inventoryIndex: number, uid: number): ActionResult {
  if (state.phase !== 'prep') return fail('L’équipement se pose pendant la préparation.');
  const slot = state.inventory[inventoryIndex];
  const unit = findRunUnit(state, uid);
  const definition = unit === undefined ? undefined : findUnit(unit.unitId);
  if (slot === undefined || unit === undefined || definition === undefined) return fail('Choix invalide.');
  const capacity = SLOT_CAPACITY[definition.kind];
  const next = slot.kind === 'material' ? addMaterial(unit.equipment, slot.material, capacity) : addObject(unit.equipment, slot.materials, capacity);
  if (next === null) return fail('Tous les emplacements de cette unité sont occupés.');
  unit.equipment = next;
  state.inventory.splice(inventoryIndex, 1);
  return OK;
}

export function unequip(state: RunState, uid: number, slotIndex: number): ActionResult {
  if (state.phase !== 'prep') return fail('L’équipement se retire pendant la préparation.');
  const unit = findRunUnit(state, uid);
  const slot = unit?.equipment[slotIndex];
  if (unit === undefined || slot === undefined) return fail('Choix invalide.');
  // ✅ À la forge, les objets se retirent gratuitement.
  if (slot.kind === 'object' && !isAtForge(state)) {
    if (state.itemRemovers < 1) return fail('Il faut un retire-objet pour déplacer un objet.');
    state.itemRemovers -= 1;
  }
  unit.equipment = removeSlot(unit.equipment, slotIndex);
  state.inventory.push(slot);
  return OK;
}

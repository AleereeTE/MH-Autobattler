import { MATERIAL_IDS, type MaterialId } from '../data/items.ts';
import { currentNode } from './map.ts';
import { OK, fail, type ActionResult, type RunState } from './state.ts';

/**
 * ✅ Forge (game-design §2.1, case sans combat) : pendant l'étape, les objets se retirent des unités
 * sans retire-objet (voir `unequip`), et on peut reforger jusqu'à 2 matériaux de l'inventaire.
 */

/** Le joueur est-il à la forge, pendant la préparation ? */
export function isAtForge(state: RunState): boolean {
  return state.phase === 'prep' && currentNode(state)?.kind === 'forge';
}

/** Transforme un matériau de l'inventaire en un autre matériau au choix. */
export function reforge(state: RunState, inventoryIndex: number, material: MaterialId): ActionResult {
  if (!isAtForge(state)) return fail('Il faut être à la forge pour reforger.');
  if (state.reforgesLeft < 1) return fail('Plus de reforge possible à cette forge.');
  const slot = state.inventory[inventoryIndex];
  if (slot === undefined || slot.kind !== 'material') return fail('Choisis un matériau de l’inventaire.');
  if (!MATERIAL_IDS.includes(material)) return fail('Matériau inconnu.');
  if (slot.material === material) return fail('Choisis un matériau différent.');
  state.inventory[inventoryIndex] = { kind: 'material', material };
  state.reforgesLeft -= 1;
  return OK;
}

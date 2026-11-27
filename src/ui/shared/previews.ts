import { findUnit } from '../../data/units/index.ts';
import { MATERIALS, type EquipmentSlot, type MaterialId } from '../../data/items.ts';
import { objectFor, slotName } from '../../rules/equipment.ts';
import { objectBonuses, recipesWith } from '../../rules/recipes.ts';
import type { FrameUnit } from '../../render/replay.ts';
import { el } from '../dom.ts';
import { describeBonuses } from './bonus-text.ts';
import { energyRatio } from './scenes.ts';
import { bossSkillBlock, skillBlock, statsTable, unitHeader } from './unit-card.ts';

/**
 * Contenus des aperçus ouverts au clic droit : une unité en plein combat, un matériau (ses recettes), un objet.
 */

/** Texte de l'énergie : « Énergie : 45 / 100 », avec la raison si elle est bloquée. */
export function energyLine(unit: Pick<FrameUnit, 'energy' | 'maxEnergy' | 'shield' | 'casting' | 'alive'>): string {
  const values = `Énergie : ${Math.floor(Math.max(0, unit.energy))} / ${Math.round(unit.maxEnergy)}`;
  if (!unit.alive) return values;
  if (unit.casting) return `${values} · bloquée (compétence en cours)`;
  if (unit.shield > 0) return `${values} · bloquée (bouclier)`;
  return values;
}

/** Barre d'énergie de l'aperçu, de la même couleur que sur le plateau. */
function energyBar(unit: FrameUnit): HTMLElement {
  const blocked = unit.alive && (unit.shield > 0 || unit.casting);
  return el('div', { className: blocked ? 'energy-bar blocked' : 'energy-bar', attrs: { 'aria-hidden': 'true' } }, [
    el('span', { attrs: { style: `width: ${(energyRatio(unit) * 100).toFixed(1)}%` } }),
  ]);
}

/** Aperçu d'une unité pendant un combat : état actuel et statistiques de combat (rang, objets et traits compris). */
export function combatUnitPreview(unit: FrameUnit): HTMLElement {
  const definition = findUnit(unit.defId);
  const states = [
    !unit.alive ? 'K.O.' : null,
    unit.burning ? 'Brûlure' : null,
    unit.chilled ? 'Ralenti' : null,
    unit.poisoned ? 'Empoisonné (soins −40 %)' : null,
    unit.paralyzed ? 'Paralysé' : null,
    unit.hasted ? 'Accéléré' : null,
    unit.casting ? 'Incante sa compétence' : null,
    unit.enraged ? 'Enragé' : null,
  ].filter((state): state is string => state !== null);
  const health = `PV : ${Math.max(0, Math.round(unit.hp))} / ${Math.round(unit.maxHp)}${unit.shield > 0 ? ` · bouclier ${Math.round(unit.shield)}` : ''}`;

  return el('div', { className: 'unit-card' }, [
    ...(definition === undefined ? [el('h3', { text: unit.name })] : unitHeader(definition, unit.rank)),
    el('p', { className: unit.side === 'player' ? 'side-player' : 'side-enemy', text: unit.side === 'player' ? 'Ton camp' : 'Camp ennemi' }),
    el('p', {}, [el('strong', { text: health })]),
    el('div', { className: 'energy' }, [el('span', { className: 'small', text: energyLine(unit) }), energyBar(unit)]),
    states.length > 0 ? el('p', { className: 'muted small', text: states.join(' · ') }) : null,
    unit.boss ? el('p', { className: 'boss-tag', text: 'Version boss' }) : null,
    ...(definition === undefined ? [] : skillBlock(definition, unit.rank)),
    ...(definition === undefined || !unit.boss ? [] : bossSkillBlock(definition)),
    unit.equipment.length > 0 ? el('p', { className: 'small', text: `Équipement : ${unit.equipment.map(slotName).join(', ')}` }) : null,
    statsTable(unit.stats),
    el('p', { className: 'muted small', text: 'Statistiques au début du combat : rang, objets et traits compris.' }),
  ]);
}

/** Aperçu d'un objet : ses deux matériaux, toutes ses statistiques et son effet. */
export function objectPreview(materials: readonly [MaterialId, MaterialId]): HTMLElement {
  const object = objectFor(materials);
  return el('div', { className: 'item-preview' }, [
    el('h3', { text: object.name }),
    el('p', { className: 'muted small', text: `${MATERIALS[materials[0]].name} + ${MATERIALS[materials[1]].name}` }),
    el('ul', { className: 'bonus-list' }, describeBonuses(objectBonuses(materials)).map((line) => el('li', { text: line }))),
    el('p', { className: 'small', text: object.description }),
  ]);
}

/**
 * Aperçu d'un matériau : ce qu'il apporte seul, et les 8 objets qu'il permet de fabriquer.
 * Les recettes dont le second matériau est déjà disponible (`available`) sont mises en avant.
 */
export function materialPreview(material: MaterialId, available: ReadonlySet<MaterialId> = new Set()): HTMLElement {
  const recipes = recipesWith(material).map((recipe) =>
    el('li', { className: available.has(recipe.other) ? 'recipe available' : 'recipe' }, [
      el('div', {}, [
        el('strong', { text: recipe.object.name }),
        el('span', { className: 'muted small', text: ` · avec ${MATERIALS[recipe.other].name}` }),
        available.has(recipe.other) ? el('span', { className: 'recipe-ready', text: ' · disponible' }) : null,
      ]),
      el('div', { className: 'small', text: describeBonuses(recipe.bonuses).join(' · ') }),
      recipe.object.generic ? null : el('div', { className: 'muted small', text: recipe.object.description }),
    ]),
  );
  return el('div', { className: 'item-preview' }, [
    el('h3', { text: `${MATERIALS[material].name} — ${MATERIALS[material].description}` }),
    el('p', { className: 'muted small', text: 'Posé sur une unité qui porte déjà un matériau, il fusionne en objet :' }),
    el('ul', { className: 'recipes' }, recipes),
  ]);
}

/** Aperçu d'un emplacement d'équipement (matériau ou objet). */
export function slotPreview(slot: EquipmentSlot, available?: ReadonlySet<MaterialId>): HTMLElement {
  return slot.kind === 'material' ? materialPreview(slot.material, available) : objectPreview(slot.materials);
}

/** Matériaux seuls disponibles dans une liste d'emplacements (pour repérer les recettes faisables). */
export function looseMaterials(slots: readonly EquipmentSlot[]): Set<MaterialId> {
  return new Set(slots.flatMap((slot) => (slot.kind === 'material' ? [slot.material] : [])));
}

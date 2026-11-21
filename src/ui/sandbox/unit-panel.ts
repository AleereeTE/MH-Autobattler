import type { StarRank, UnitDefinition } from '../../data/definitions.ts';
import { MATERIALS, MATERIAL_IDS, SIGNATURE_OBJECTS, type Equipment, type MaterialId } from '../../data/items.ts';
import { SLOT_CAPACITY, objectFor, slotName } from '../../rules/equipment.ts';
import { STAR_RANKS, rankStars } from '../../rules/ranks.ts';
import { button, el, select } from '../dom.ts';
import { onRightClick, showPopover } from '../shared/popover.ts';
import { materialPreview, slotPreview } from '../shared/previews.ts';
import { unitCard } from '../shared/unit-card.ts';
import type { SandboxModel } from './model.ts';

function equipmentEditor(model: SandboxModel, unit: UnitDefinition, equipment: Equipment): HTMLElement {
  const capacity = SLOT_CAPACITY[unit.kind];
  const materialSelect = select(MATERIAL_IDS.map((id) => ({ value: id, label: `${MATERIALS[id].name} (${MATERIALS[id].description})` })));
  const objectSelect = select(SIGNATURE_OBJECTS.map((object, index) => ({ value: String(index), label: `${object.name} (${object.description})` })));

  const slots = equipment.map((slot, index) =>
    onRightClick(
      el('li', { className: 'slot', attrs: { title: 'Clic droit : statistiques et recettes' } }, [
        el('span', {}, [
          el('strong', { text: slotName(slot) }),
          slot.kind === 'object' ? ` — ${objectFor(slot.materials).description}` : ' (matériau)',
        ]),
        button('Retirer', () => model.removeSlot(index), 'button small'),
      ]),
      () => slotPreview(slot),
    ),
  );

  return el('div', { className: 'equipment' }, [
    el('h3', { text: `Équipement (${equipment.length} / ${capacity})` }),
    slots.length > 0 ? el('ul', { className: 'slots' }, slots) : el('p', { className: 'muted', text: 'Aucun objet.' }),
    el('div', { className: 'row' }, [
      materialSelect,
      button('Poser le matériau', () => model.addMaterial(materialSelect.value as MaterialId)),
      el('button', {
        className: 'button small',
        text: 'Recettes',
        attrs: { type: 'button', title: 'Objets qu’on peut fabriquer avec ce matériau' },
        onClick: (event) => showPopover(materialPreview(materialSelect.value as MaterialId), event.clientX, event.clientY),
      }),
    ]),
    el('div', { className: 'row' }, [
      objectSelect,
      button('Poser l’objet', () => {
        const object = SIGNATURE_OBJECTS[Number(objectSelect.value)];
        if (object !== undefined) model.addObject(object.materials);
      }),
    ]),
    el('p', { className: 'muted small', text: 'Poser un matériau sur un matériau seul les fusionne en objet.' }),
  ]);
}

/** Choix du rang ★ de l'unité posée : ★1 Rang Bas, ★2 Rang Haut, ★3 Rang Maître. */
function rankPicker(model: SandboxModel, current: StarRank): HTMLElement {
  return el('div', { className: 'rank-picker' }, [
    el('span', { className: 'muted', text: 'Rang' }),
    ...STAR_RANKS.map((rank) =>
      el('button', {
        className: 'button small rank',
        text: rankStars(rank),
        attrs: { type: 'button', 'aria-pressed': String(rank === current), 'aria-label': `Rang ${rank}` },
        onClick: () => model.setSelectedRank(rank),
      }),
    ),
  ]);
}

/** Détails de l'unité sélectionnée, et son équipement si elle est sur le plateau. */
export function renderUnitPanel(model: SandboxModel): HTMLElement {
  const placed = model.selectedPlaced();
  const unit = model.selectedDefinition();
  const children: (HTMLElement | null)[] = [el('h2', { text: 'Unité sélectionnée' })];

  if (unit === null) {
    children.push(
      el('p', {
        className: 'muted',
        text: 'Choisis une unité dans la liste, puis clique sur une case du plateau pour la poser. Clique sur une unité posée pour l’équiper ou la déplacer.',
      }),
    );
  } else if (placed === null) {
    children.push(el('p', { className: 'hint', text: `Clique sur une case libre pour poser ${unit.name}.` }), unitCard(unit, [], 1));
  } else {
    children.push(
      el('p', { className: 'hint', text: 'Clique sur une case libre pour déplacer l’unité.' }),
      rankPicker(model, placed.rank),
      unitCard(unit, placed.equipment, placed.rank),
      equipmentEditor(model, unit, placed.equipment),
      button('Retirer du plateau', () => model.removeSelected(), 'button danger'),
    );
  }
  if (model.notice !== null) children.push(el('p', { className: 'notice', text: model.notice }));
  return el('section', { className: 'panel' }, children);
}

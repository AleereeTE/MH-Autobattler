import { findUnit } from '../../data/units/index.ts';
import { objectFor, slotName } from '../../rules/equipment.ts';
import { isAtForge, sellValue } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import { onRightClick } from '../shared/popover.ts';
import { looseMaterials, slotPreview } from '../shared/previews.ts';
import { unitCard } from '../shared/unit-card.ts';
import type { RunController } from './controller.ts';

/** Détail de l'unité sélectionnée (la tienne : équipement et vente ; un monstre ennemi : sa fiche). */
export function renderSelection(controller: RunController): HTMLElement {
  const children: (HTMLElement | null)[] = [el('h2', { text: 'Unité sélectionnée' })];
  const selection = controller.selection;
  const own = controller.selectedUnit();
  const definition = own === null ? undefined : findUnit(own.unitId);

  if (own !== null && definition !== undefined) {
    const where = own.location.area === 'board' ? 'Sur le plateau' : 'En réserve';
    // ✅ À la forge, retirer un objet est gratuit.
    const objectRemoval = isAtForge(controller.state) ? 'Retirer (gratuit à la forge)' : 'Retirer (1 retire-objet)';
    const slots = own.equipment.map((slot, index) =>
      onRightClick(
        el('li', { className: 'slot', attrs: { title: 'Clic droit : statistiques et recettes' } }, [
          el('span', {}, [el('strong', { text: slotName(slot) }), slot.kind === 'object' ? ` — ${objectFor(slot.materials).description}` : ' (matériau)']),
          button(slot.kind === 'object' ? objectRemoval : 'Retirer', () => controller.unequip(index), 'button small'),
        ]),
        () => slotPreview(slot, looseMaterials(controller.state.inventory)),
      ),
    );
    const sell = button(`Vendre (${sellValue(definition.cost, own.rank)} zennys)`, () => controller.sellSelected(), 'button danger');
    sell.disabled = !controller.canPrepare;
    children.push(
      el('p', { className: 'hint', text: `${where}. Clique sur une case libre de ton camp ou une place de réserve pour la déplacer.` }),
      unitCard(definition, own.equipment, own.rank),
      el('h3', { text: 'Équipement' }),
      slots.length > 0 ? el('ul', { className: 'slots' }, slots) : el('p', { className: 'muted small', text: 'Aucun objet. Clique sur un élément de l’inventaire pour l’équiper.' }),
      sell,
    );
  } else if (selection?.kind === 'enemy') {
    const placement = controller.state.enemy[selection.index];
    if (placement !== undefined) {
      children.push(el('p', { className: 'hint', text: 'Monstre de la prochaine chasse.' }), unitCard(placement.unit, placement.equipment ?? [], placement.rank ?? 1));
    }
  } else {
    children.push(
      el('p', {
        className: 'muted',
        text: 'Achète des unités dans la boutique, puis clique sur une unité de la réserve et sur une case de ton camp pour la poser. Clique sur un monstre ennemi pour voir sa fiche.',
      }),
    );
  }
  return el('section', { className: 'panel' }, children);
}

/** Inventaire : matériaux et objets non posés. Cliquer en pose un sur l'unité sélectionnée. */
export function renderInventory(controller: RunController): HTMLElement {
  const { state } = controller;
  const target = controller.selectedUnit();
  const targetName = target === null ? null : (findUnit(target.unitId)?.name ?? null);
  const items = state.inventory.map((slot, index) => {
    const item = el(
      'button',
      {
        className: 'inventory-item',
        attrs: { type: 'button', title: targetName === null ? 'Sélectionne d’abord une de tes unités' : `Poser sur ${targetName}` },
        onClick: () => controller.equip(index),
      },
      [
        el('strong', { text: slotName(slot) }),
        el('span', { className: 'small muted', text: slot.kind === 'object' ? objectFor(slot.materials).description : 'Matériau' }),
      ],
    );
    item.disabled = !controller.canPrepare;
    return onRightClick(item, () => slotPreview(slot, looseMaterials(state.inventory)));
  });
  return el('section', { className: 'panel' }, [
    el('h2', { text: `Inventaire (${state.inventory.length})` }),
    items.length > 0
      ? el('div', { className: 'inventory' }, items)
      : el('p', { className: 'muted small', text: 'Vide. Les matériaux gagnés en récompense arrivent ici.' }),
    el('p', {
      className: 'muted small',
      text:
        (targetName === null ? 'Sélectionne une unité, puis clique sur un élément pour l’équiper.' : `Clique sur un élément pour le poser sur ${targetName}.`) +
        ' Clic droit : recettes et statistiques.',
    }),
  ]);
}

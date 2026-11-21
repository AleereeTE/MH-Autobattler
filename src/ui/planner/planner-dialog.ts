import { UNITS } from '../../data/units/index.ts';
import { button, el } from '../dom.ts';
import { costFilterBar } from '../shared/cost-filter.ts';
import { paletteGroups, type CostFilter } from '../shared/palette-groups.ts';
import { onRightClick } from '../shared/popover.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import { unitToken } from '../shared/token.ts';
import { traitBadges } from '../shared/trait-badges.ts';
import { traitList } from '../shared/traits-view.ts';
import { unitCard } from '../shared/unit-card.ts';
import { unitSubtitle } from '../shared/unit-label.ts';
import { PLAN_CAPACITY, type PlanModel } from './plan-model.ts';

/** Liste complète des unités, filtrable par coût ; cliquer ajoute l'unité au plan ou l'en retire. */
function unitChoices(plan: PlanModel, filter: CostFilter, onFilter: (filter: CostFilter) => void): HTMLElement[] {
  return [
    costFilterBar(filter, onFilter),
    ...paletteGroups(UNITS, filter).map((group) =>
      el('div', { className: 'palette-group' }, [
        el('h3', { text: `Coût ${group.cost}` }),
        el(
          'div',
          { className: 'palette' },
          group.units.map((unit) =>
            onRightClick(
              el(
                'button',
                {
                  className: `palette-item element-${unit.element ?? 'none'}`,
                  attrs: { type: 'button', 'aria-pressed': String(plan.has(unit.id)) },
                  onClick: () => plan.toggle(unit.id),
                },
                [el('strong', { text: unit.name }), el('span', { text: unitSubtitle(unit) }), traitBadges(unit)],
              ),
              () => unitCard(unit, [], 1),
            ),
          ),
        ),
      ]),
    ),
  ];
}

/** Les 9 places du plan : cliquer sur une unité la retire. */
function planSlots(plan: PlanModel, portraits: PortraitStore): HTMLElement {
  const slots = Array.from({ length: PLAN_CAPACITY }, (_, index) => {
    const unit = plan.units[index];
    if (unit === undefined) return el('div', { className: 'plan-slot empty', attrs: { 'aria-hidden': 'true' } });
    return onRightClick(
      el(
        'button',
        {
          className: 'plan-slot',
          attrs: { type: 'button', title: 'Retirer du plan', 'aria-label': `Retirer ${unit.name} du plan` },
          onClick: () => plan.toggle(unit.id),
        },
        [unitToken(unit.id, null, portraits), el('span', { className: 'plan-slot-name', text: unit.name })],
      ),
      () => unitCard(unit, [], 1),
    );
  });
  return el('div', { className: 'plan-slots' }, slots);
}

/**
 * Ouvre le planificateur dans une fenêtre par-dessus la page : la liste des unités à gauche,
 * le plan et ses synergies à droite. Il se met à jour à chaque changement du plan.
 * Se ferme avec « Fermer », Échap ou un clic à côté de la fenêtre.
 */
export function openPlanner(plan: PlanModel, portraits: PortraitStore): void {
  let filter: CostFilter = null;
  // Les deux colonnes défilent chacune de leur côté ; elles restent en place quand on met à jour leur contenu,
  // pour ne pas perdre la position dans la liste à chaque clic.
  const choices = el('section', { className: 'planner-units', attrs: { 'aria-label': 'Unités disponibles' } });
  const summary = el('section', { className: 'planner-plan', attrs: { 'aria-label': 'Ton plan' } });
  const dialog = el('dialog', { className: 'planner', attrs: { 'aria-label': 'Planificateur d’équipe' } }, [
    el('header', { className: 'planner-header' }, [
      el('div', {}, [
        el('h2', { text: 'Planificateur d’équipe' }),
        el('p', {
          className: 'muted small',
          text: `Choisis jusqu’à ${PLAN_CAPACITY} unités : tu vois leurs synergies, et la boutique de la run signale celles du plan. Le plan est gardé d’une run à l’autre.`,
        }),
      ]),
      button('Fermer', () => dialog.close(), 'button small'),
    ]),
    el('div', { className: 'planner-body' }, [choices, summary]),
  ]);

  function render(): void {
    choices.replaceChildren(
      ...unitChoices(plan, filter, (next) => {
        filter = next;
        render();
      }),
    );
    const notice = plan.notice === null ? [] : [el('p', { className: 'notice', text: plan.notice })];
    summary.replaceChildren(
      el('div', { className: 'panel-title' }, [
        el('h3', { text: `Ton plan (${plan.units.length} / ${PLAN_CAPACITY})` }),
        plan.units.length > 0 ? button('Vider le plan', () => plan.clear(), 'button small') : null,
      ]),
      planSlots(plan, portraits),
      ...notice,
      el('h3', { text: 'Synergies du plan' }),
      traitList(plan.units, 'Choisis des unités pour voir leurs synergies.'),
    );
  }

  const unsubscribe = plan.subscribe(render);
  dialog.addEventListener('close', () => {
    unsubscribe();
    dialog.remove();
  });
  // Clic sur le fond assombri (en dehors du contenu de la fenêtre) : on ferme.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  render();
  dialog.showModal();
}

import { button, el } from '../dom.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import { onRightClick } from '../shared/popover.ts';
import { unitToken } from '../shared/token.ts';
import { unitCard } from '../shared/unit-card.ts';
import { PLAN_CAPACITY, type PlanModel } from './plan-model.ts';

/**
 * Encadré « Plan » du mode run : les unités visées, celles déjà possédées (plateau ou réserve) cochées,
 * et le bouton qui ouvre le planificateur.
 */
export function renderPlanPanel(plan: PlanModel, ownedIds: ReadonlySet<string>, portraits: PortraitStore, onOpen: () => void): HTMLElement {
  const owned = plan.units.filter((unit) => ownedIds.has(unit.id)).length;
  const title = plan.units.length === 0 ? 'Plan' : `Plan (${owned} / ${plan.units.length} possédées)`;
  return el('section', { className: 'panel plan-panel' }, [
    el('div', { className: 'panel-title' }, [el('h2', { text: title }), button('Planificateur', onOpen, 'button small')]),
    plan.units.length === 0
      ? el('p', { className: 'muted small', text: `Aucun plan : choisis jusqu’à ${PLAN_CAPACITY} unités à viser ; la boutique les signalera.` })
      : el(
          'ul',
          { className: 'plan-units' },
          plan.units.map((unit) => {
            const has = ownedIds.has(unit.id);
            return onRightClick(
              el('li', { className: has ? 'plan-unit owned' : 'plan-unit', attrs: { title: has ? 'Déjà possédée' : 'Pas encore possédée' } }, [
                unitToken(unit.id, null, portraits),
                el('span', { className: 'plan-unit-name', text: has ? `✓ ${unit.name}` : unit.name }),
              ]),
              () => unitCard(unit, [], 1),
            );
          }),
        ),
  ]);
}

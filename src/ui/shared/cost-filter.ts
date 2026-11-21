import { UNITS } from '../../data/units/index.ts';
import { el } from '../dom.ts';
import { availableCosts, toggleCostFilter, type CostFilter } from './palette-groups.ts';

/**
 * Boutons de filtre par coût : « Tous », puis un bouton par coût, aux couleurs des jetons
 * (liste du bac à sable, planificateur). Recliquer sur le coût actif réaffiche tout.
 */
export function costFilterBar(filter: CostFilter, onFilter: (filter: CostFilter) => void): HTMLElement {
  const chip = (value: CostFilter, label: string, className: string, title: string): HTMLElement =>
    el('button', {
      className: `cost-chip ${className}`,
      text: label,
      attrs: { type: 'button', 'aria-pressed': String(filter === value), title },
      onClick: () => onFilter(toggleCostFilter(filter, value)),
    });
  return el('div', { className: 'cost-filter', attrs: { role: 'group', 'aria-label': 'Filtrer par coût' } }, [
    chip(null, 'Tous', 'cost-all', 'Toutes les unités'),
    ...availableCosts(UNITS).map((cost) => chip(cost, String(cost), `cost-${cost}`, `Unités de coût ${cost}`)),
  ]);
}

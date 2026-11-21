import { UNITS } from '../../data/units/index.ts';
import { el } from '../dom.ts';
import type { SandboxModel } from './model.ts';
import { costFilterBar } from '../shared/cost-filter.ts';
import { paletteGroups, type CostFilter } from '../shared/palette-groups.ts';
import { onRightClick } from '../shared/popover.ts';
import { traitBadges } from '../shared/trait-badges.ts';
import { unitCard } from '../shared/unit-card.ts';
import { unitSubtitle } from '../shared/unit-label.ts';

/**
 * Liste des unités disponibles, regroupées par coût, avec un filtre pour n'afficher qu'un coût.
 * Cliquer sur une unité la sélectionne pour la poser.
 */
export function renderPalette(model: SandboxModel, filter: CostFilter, onFilter: (filter: CostFilter) => void): HTMLElement {
  const selection = model.selection;

  return el(
    'section',
    { className: 'panel' },
    [
      el('h2', { text: 'Unités' }),
      costFilterBar(filter, onFilter),
      ...paletteGroups(UNITS, filter).map((group) =>
        el('div', { className: 'palette-group' }, [
          el('h3', { text: `Coût ${group.cost}` }),
          el(
            'div',
            { className: 'palette' },
            group.units.map((unit) => {
              const selected = selection?.kind === 'palette' && selection.unitId === unit.id;
              const item = el(
                'button',
                {
                  className: `palette-item element-${unit.element ?? 'none'}`,
                  attrs: { type: 'button', 'aria-pressed': String(selected) },
                  onClick: () => model.selectPalette(unit.id),
                },
                [el('strong', { text: unit.name }), el('span', { text: unitSubtitle(unit) }), traitBadges(unit)],
              );
              return onRightClick(item, () => unitCard(unit, [], 1));
            }),
          ),
        ]),
      ),
    ],
  );
}

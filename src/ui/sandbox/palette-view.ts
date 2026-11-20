import { UNITS } from '../../data/units/index.ts';
import { el } from '../dom.ts';
import type { SandboxModel } from './model.ts';
import { unitSubtitle } from './unit-label.ts';

/** Liste des unités disponibles, regroupées par coût. Cliquer sur une unité la sélectionne pour la poser. */
export function renderPalette(model: SandboxModel): HTMLElement {
  const selection = model.selection;
  const costs = [...new Set(UNITS.map((unit) => unit.cost))];

  return el(
    'section',
    { className: 'panel' },
    [
      el('h2', { text: 'Unités' }),
      ...costs.map((cost) =>
        el('div', { className: 'palette-group' }, [
          el('h3', { text: `Coût ${cost}` }),
          el(
            'div',
            { className: 'palette' },
            UNITS.filter((unit) => unit.cost === cost).map((unit) => {
              const selected = selection?.kind === 'palette' && selection.unitId === unit.id;
              return el(
                'button',
                {
                  className: `palette-item element-${unit.element ?? 'none'}`,
                  attrs: { type: 'button', 'aria-pressed': String(selected) },
                  onClick: () => model.selectPalette(unit.id),
                },
                [el('strong', { text: unit.name }), el('span', { text: unitSubtitle(unit) })],
              );
            }),
          ),
        ]),
      ),
    ],
  );
}

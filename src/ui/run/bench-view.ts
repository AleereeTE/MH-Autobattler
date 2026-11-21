import { RUN_STRUCTURE } from '../../data/run-balance.ts';
import { findUnit } from '../../data/units/index.ts';
import { unitAt } from '../../run/index.ts';
import { el } from '../dom.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import type { RunController } from './controller.ts';
import { onRightClick } from '../shared/popover.ts';
import { unitCard } from '../shared/unit-card.ts';
import { unitToken } from '../shared/token.ts';

/** Réserve : 10 places. Cliquer sélectionne une unité, ou y range l'unité sélectionnée. */
export function renderBench(controller: RunController, portraits: PortraitStore): HTMLElement {
  const { state } = controller;
  const selected = controller.selectedUnit();
  const slots = Array.from({ length: RUN_STRUCTURE.benchSize }, (_, index) => {
    const unit = unitAt(state, { area: 'bench', index });
    const name = unit === undefined ? '' : (findUnit(unit.unitId)?.name ?? '');
    const slot = el(
      'button',
      {
        className: unit === undefined ? 'bench-slot empty' : 'bench-slot',
        attrs: {
          type: 'button',
          'aria-pressed': String(unit !== undefined && unit.uid === selected?.uid),
          'aria-label': unit === undefined ? `Place de réserve ${index + 1} (vide)` : `${name}, rang ${unit.rank}`,
        },
        onClick: () => controller.clickBench(index),
      },
      unit === undefined ? [] : [unitToken(unit.unitId, unit.rank, portraits), el('span', { className: 'bench-name', text: name })],
    );
    slot.disabled = !controller.canPrepare;
    const definition = unit === undefined ? undefined : findUnit(unit.unitId);
    return unit === undefined || definition === undefined ? slot : onRightClick(slot, () => unitCard(definition, unit.equipment, unit.rank));
  });
  const count = state.units.filter((unit) => unit.location.area === 'bench').length;
  return el('section', { className: 'panel bench' }, [
    el('div', { className: 'panel-title' }, [
      el('h2', { text: `Réserve (${count} / ${RUN_STRUCTURE.benchSize})` }),
      el('span', { className: 'muted small', text: '3 exemplaires identiques du même rang fusionnent automatiquement.' }),
    ]),
    el('div', { className: 'bench-slots' }, slots),
  ]);
}

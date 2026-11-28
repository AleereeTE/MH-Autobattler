import type { EventChoice } from '../../data/events.ts';
import { MATERIALS } from '../../data/items.ts';
import { findUnit } from '../../data/units/index.ts';
import { currentEvent, eventChoiceBlocker, extraCopyCandidates, looseMaterialIndexes } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import { onRightClick } from '../shared/popover.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import { materialPreview } from '../shared/previews.ts';
import { unitToken } from '../shared/token.ts';
import { unitCard } from '../shared/unit-card.ts';
import type { RunController } from './controller.ts';
import { NODE_INFO } from './map-view.ts';

/**
 * Panneau d'une case Événement (game-design §2.1) : la situation, ses choix, puis le compte rendu
 * et « Reprendre la route ». Entraînement et Commission demandent une précision (unité, matériaux).
 */

/** Un choix demande-t-il une précision avant d'être validé ? */
function needsSelection(choice: EventChoice): boolean {
  return choice.effect.kind === 'extraCopy' || choice.effect.kind === 'tradeMaterials';
}

/** Précision d'Entraînement : une unité possédée à recevoir en un exemplaire de plus. */
function unitPicker(controller: RunController, index: number, portraits: PortraitStore): HTMLElement {
  const choices = extraCopyCandidates(controller.state).map((unitId) => {
    const unit = findUnit(unitId);
    const pick = el('button', { className: 'capture-choice', attrs: { type: 'button' }, onClick: () => controller.chooseEvent(index, { unitId }) }, [
      unitToken(unitId, 1, portraits),
      el('span', { className: 'small', text: unit?.name ?? unitId }),
    ]);
    return unit === undefined ? pick : onRightClick(pick, () => unitCard(unit, [], 1));
  });
  return el('div', { className: 'event-selection' }, [
    el('span', { className: 'small', text: 'Quelle unité entraîner ?' }),
    el('div', { className: 'capture-choices' }, choices),
    button('Annuler', () => controller.selectEventChoice(null), 'button small'),
  ]);
}

/** Précision de la Commission : les matériaux de l'inventaire à donner. */
function materialPicker(controller: RunController, index: number, needed: number): HTMLElement {
  const selected = controller.eventSelection?.materials ?? [];
  const { inventory } = controller.state;
  const toggles = looseMaterialIndexes(controller.state).map((inventoryIndex) => {
    const slot = inventory[inventoryIndex];
    const material = slot?.kind === 'material' ? slot.material : 'bone';
    const toggle = el('button', {
      className: 'button small',
      text: MATERIALS[material].name,
      attrs: { type: 'button', 'aria-pressed': String(selected.includes(inventoryIndex)) },
      onClick: () => controller.toggleEventMaterial(inventoryIndex),
    });
    return onRightClick(toggle, () => materialPreview(material));
  });
  const give = button(`Donner (${selected.length} / ${needed})`, () => controller.chooseEvent(index, { materialIndexes: selected }), 'button primary small');
  give.disabled = selected.length !== needed;
  return el('div', { className: 'event-selection' }, [
    el('span', { className: 'small', text: `Choisis ${needed} matériaux à donner :` }),
    el('div', { className: 'row' }, toggles),
    el('div', { className: 'row' }, [give, button('Annuler', () => controller.selectEventChoice(null), 'button small')]),
  ]);
}

function choiceButton(controller: RunController, choice: EventChoice, index: number, portraits: PortraitStore): HTMLElement {
  const blocker = eventChoiceBlocker(controller.state, choice);
  const selecting = controller.eventSelection?.choice === index;
  const card = el(
    'button',
    {
      className: 'event-choice',
      attrs: { type: 'button', 'aria-pressed': String(selecting) },
      onClick: () => (needsSelection(choice) ? controller.selectEventChoice(index) : controller.chooseEvent(index)),
    },
    [
      el('strong', { text: choice.label }),
      el('span', { className: 'small', text: choice.description }),
      blocker === null ? null : el('span', { className: 'small muted', text: blocker }),
    ],
  );
  card.disabled = blocker !== null;
  if (!selecting) return card;
  const effect = choice.effect;
  const picker = effect.kind === 'tradeMaterials' ? materialPicker(controller, index, effect.materials) : unitPicker(controller, index, portraits);
  return el('div', { className: 'event-choice-group' }, [card, picker]);
}

/** Panneau de la case Événement en cours, ou null. */
export function renderEvent(controller: RunController, portraits: PortraitStore): HTMLElement | null {
  const { state } = controller;
  const event = currentEvent(state);
  if (event === null || state.event === null || state.phase !== 'prep') return null;
  const result = state.event.result;
  return el('section', { className: 'panel stop-panel event-panel' }, [
    el('h2', { text: `${NODE_INFO.event.symbol} ${event.name}` }),
    el('p', { className: 'event-text', text: event.text }),
    result === null
      ? el(
          'div',
          { className: 'event-choices' },
          event.choices.map((choice, index) => choiceButton(controller, choice, index, portraits)),
        )
      : el('div', { className: 'event-result' }, result.map((line) => el('p', { text: line }))),
    el('p', { className: 'muted small', text: 'La boutique reste ouverte pendant cette étape.' }),
    result === null ? null : button('Reprendre la route', () => controller.leaveNode(), 'button primary'),
  ]);
}

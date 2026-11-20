import { ECONOMY } from '../../data/run-balance.ts';
import { findUnit } from '../../data/units/index.ts';
import { costOdds, levelUpCost } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import type { PortraitStore } from '../shared/portraits.ts';
import { unitSubtitle } from '../shared/unit-label.ts';
import type { RunController } from './controller.ts';
import { unitToken } from './token.ts';

function shopCard(controller: RunController, slot: number, unitId: string | null, portraits: PortraitStore): HTMLElement {
  const unit = unitId === null ? undefined : findUnit(unitId);
  if (unitId === null || unit === undefined) {
    return el('div', { className: 'shop-card empty', text: 'Vendu' });
  }
  const affordable = controller.state.zennys >= unit.cost;
  const card = el(
    'button',
    {
      className: `shop-card cost-border-${unit.cost}${affordable ? '' : ' too-expensive'}`,
      attrs: { type: 'button', 'aria-label': `Acheter ${unit.name} pour ${unit.cost} zennys` },
      onClick: () => controller.buy(slot),
    },
    [
      unitToken(unitId, null, portraits),
      el('span', { className: 'shop-card-text' }, [
        el('strong', { text: unit.name }),
        el('span', { className: 'small muted', text: unitSubtitle(unit) }),
      ]),
      el('span', { className: 'shop-price', text: `${unit.cost} z` }),
    ],
  );
  card.disabled = !controller.canPrepare;
  return card;
}

/** Boutique : 5 unités à acheter, relance et amélioration du niveau. */
export function renderShop(controller: RunController, portraits: PortraitStore): HTMLElement {
  const { state } = controller;
  const odds = costOdds(state.level)
    .map((odd, index) => `${index + 1} : ${odd} %`)
    .join(' · ');
  const nextCost = levelUpCost(state.level);
  const reroll = button(`Relancer (${ECONOMY.rerollCost} z)`, () => controller.reroll(), 'button small');
  const level = button(
    nextCost === null ? 'Niveau maximum' : `Niveau ${state.level + 1} (${nextCost} z)`,
    () => controller.levelUp(),
    'button small',
  );
  reroll.disabled = !controller.canPrepare;
  level.disabled = !controller.canPrepare || nextCost === null;

  return el('section', { className: 'panel shop' }, [
    el('div', { className: 'panel-title' }, [
      el('h2', { text: `Boutique · niveau ${state.level}` }),
      el('span', { className: 'muted small', text: `Chances par coût : ${odds}` }),
      el('span', { className: 'row' }, [reroll, level]),
    ]),
    el(
      'div',
      { className: 'shop-cards' },
      state.shop.map((unitId, slot) => shopCard(controller, slot, unitId, portraits)),
    ),
  ]);
}

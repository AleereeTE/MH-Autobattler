import { MATERIALS, MATERIAL_IDS } from '../../data/items.ts';
import { MERCHANT } from '../../data/run-balance.ts';
import { isAtForge, isAtMerchant } from '../../run/index.ts';
import { button, el } from '../dom.ts';
import { onRightClick } from '../shared/popover.ts';
import { materialPreview } from '../shared/previews.ts';
import type { RunController } from './controller.ts';
import { NODE_INFO } from './map-view.ts';

/**
 * Panneaux des cases sans combat (game-design §2.1) : la forge et le marchand.
 * La boutique reste ouverte pendant ces étapes ; « Reprendre la route » ramène à la carte.
 */

const SHOP_OPEN = 'La boutique reste ouverte pendant cette étape.';

function leaveButton(controller: RunController): HTMLElement {
  return button('Reprendre la route', () => controller.leaveNode(), 'button primary');
}

/** Forge : objets déplaçables sans retire-objet, et reforge de matériaux de l'inventaire. */
function renderForge(controller: RunController): HTMLElement {
  const { state } = controller;
  const materials = state.inventory.flatMap((slot, index) => (slot.kind === 'material' ? [{ material: slot.material, index }] : []));
  const selected = controller.reforgeIndex;
  const selectedSlot = selected === null ? undefined : state.inventory[selected];
  const left = state.reforgesLeft;

  const choices =
    selectedSlot?.kind === 'material' && left > 0
      ? el('div', { className: 'reforge-targets' }, [
          el('span', { className: 'small', text: `${MATERIALS[selectedSlot.material].name} devient :` }),
          ...MATERIAL_IDS.filter((material) => material !== selectedSlot.material).map((material) =>
            onRightClick(button(MATERIALS[material].name, () => controller.reforge(material), 'button small'), () => materialPreview(material)),
          ),
        ])
      : null;

  return el('section', { className: 'panel stop-panel forge' }, [
    el('h2', { text: `${NODE_INFO.forge.symbol} Forge` }),
    el('p', { text: 'Pendant cette étape, retirer un objet d’une unité est gratuit : refais tes builds sans retire-objet.' }),
    el('h3', { text: `Reforge (${left} restante${left > 1 ? 's' : ''})` }),
    left === 0
      ? el('p', { className: 'muted small', text: 'Plus de reforge à cette forge.' })
      : materials.length === 0
        ? el('p', { className: 'muted small', text: 'Aucun matériau dans l’inventaire (retire-en un d’une unité, c’est gratuit).' })
        : el('div', { className: 'reforge-sources' }, [
            el('span', { className: 'small muted', text: 'Choisis un matériau de l’inventaire, puis ce qu’il doit devenir :' }),
            el(
              'div',
              { className: 'row' },
              materials.map(({ material, index }) =>
                el('button', {
                  className: 'button small',
                  text: MATERIALS[material].name,
                  attrs: { type: 'button', 'aria-pressed': String(selected === index) },
                  onClick: () => controller.selectReforge(index),
                }),
              ),
            ),
          ]),
    choices,
    el('p', { className: 'muted small', text: SHOP_OPEN }),
    leaveButton(controller),
  ]);
}

/** Marchand : quelques matériaux et un retire-objet à acheter. */
function renderMerchant(controller: RunController): HTMLElement {
  const { state } = controller;
  const stock = state.merchant;
  const offers = (stock?.offers ?? []).map((material, index) => {
    if (material === null) return el('div', { className: 'merchant-offer sold', text: 'Vendu' });
    const offer = el(
      'button',
      { className: 'merchant-offer', attrs: { type: 'button' }, onClick: () => controller.buyMaterial(index) },
      [
        el('strong', { text: MATERIALS[material].name }),
        el('span', { className: 'small muted', text: MATERIALS[material].description }),
        el('span', { className: 'shop-price', text: `${MERCHANT.materialPrice} z` }),
      ],
    );
    offer.disabled = state.zennys < MERCHANT.materialPrice;
    return onRightClick(offer, () => materialPreview(material));
  });
  const remover = el(
    'button',
    { className: 'merchant-offer', attrs: { type: 'button' }, onClick: () => controller.buyItemRemover() },
    [
      el('strong', { text: 'Retire-objet' }),
      el('span', { className: 'small muted', text: stock?.itemRemoverSold === true ? 'Vendu' : 'Retire un objet d’une unité' }),
      el('span', { className: 'shop-price', text: `${MERCHANT.itemRemoverPrice} z` }),
    ],
  );
  remover.disabled = stock?.itemRemoverSold === true || state.zennys < MERCHANT.itemRemoverPrice;

  return el('section', { className: 'panel stop-panel merchant' }, [
    el('h2', { text: `${NODE_INFO.merchant.symbol} Marchand` }),
    el('p', { className: 'muted small', text: 'Les matériaux achetés arrivent dans l’inventaire. Clic droit : recettes.' }),
    el('div', { className: 'merchant-offers' }, [...offers, remover]),
    el('p', { className: 'muted small', text: SHOP_OPEN }),
    leaveButton(controller),
  ]);
}

/** Panneau de la case actuelle s'il s'agit d'une forge ou d'un marchand (pendant la préparation). */
export function renderStop(controller: RunController): HTMLElement | null {
  if (controller.watching !== null) return null;
  const { state } = controller;
  if (isAtForge(state)) return renderForge(controller);
  if (isAtMerchant(state)) return renderMerchant(controller);
  return null;
}

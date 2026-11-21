import type { UnitDefinition } from '../../data/definitions.ts';
import { findTrait } from '../../data/traits.ts';
import { unitTraitIds } from '../../rules/traits.ts';
import { el } from '../dom.ts';
import { showPopover } from './popover.ts';
import { traitPreview } from './trait-preview.ts';
import { traitBadgeStyle } from './trait-styles.ts';

/**
 * Insignes des traits d'une unité (liste du bac à sable, boutique, fiches, unité sélectionnée).
 * Clic droit sur un insigne : aperçu du trait (paliers, effets, unités).
 */

/** Un insigne : symbole + nom du trait. */
export function traitBadge(traitId: string): HTMLElement {
  const style = traitBadgeStyle(traitId);
  const badge = el('span', { className: 'trait-badge', attrs: { style: `--badge: ${style.color}`, title: 'Clic droit : paliers du trait' } }, [
    el('span', { className: 'trait-badge-symbol', text: style.symbol, attrs: { 'aria-hidden': 'true' } }),
    findTrait(traitId)?.name ?? traitId,
  ]);
  badge.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    // L'insigne est souvent dans une carte qui a son propre aperçu (fiche de l'unité) : on garde celui du trait.
    event.stopPropagation();
    showPopover(traitPreview(traitId), event.clientX, event.clientY);
  });
  return badge;
}

/** Les insignes de tous les traits d'une unité : son élément d'abord, puis ses traits secondaires. */
export function traitBadges(unit: UnitDefinition): HTMLElement {
  return el('span', { className: 'trait-badges' }, unitTraitIds(unit).map(traitBadge));
}

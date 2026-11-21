import type { UnitDefinition } from '../../data/definitions.ts';
import { findTrait } from '../../data/traits.ts';
import { unitTraitIds } from '../../rules/traits.ts';
import { el } from '../dom.ts';

/**
 * Insignes des traits : un symbole et une couleur par trait, pour repérer d'un coup d'œil
 * les synergies d'une unité (liste du bac à sable, boutique, aperçus).
 */

export interface TraitBadgeStyle {
  readonly symbol: string;
  /** Couleur CSS (variable ou valeur). */
  readonly color: string;
}

export const TRAIT_BADGES: Readonly<Record<string, TraitBadgeStyle>> = {
  fire: { symbol: '🔥', color: 'var(--element-fire)' },
  water: { symbol: '💧', color: 'var(--element-water)' },
  thunder: { symbol: '⚡', color: 'var(--element-thunder)' },
  ice: { symbol: '❄️', color: 'var(--element-ice)' },
  dragon: { symbol: '🐉', color: 'var(--element-dragon)' },
  neutral: { symbol: '⬢', color: 'var(--element-none)' },
  guild: { symbol: '⚑', color: '#b07d2b' },
  berserker: { symbol: '⚔️', color: '#c0392b' },
  bastion: { symbol: '🛡️', color: '#607d8b' },
  catalyst: { symbol: '✦', color: '#8e44ad' },
  'flying-wyvern': { symbol: '🪶', color: '#2e86c1' },
  'elder-dragon': { symbol: '👑', color: '#c9a227' },
  'black-dragon': { symbol: '☠️', color: '#4a4a4a' },
  leviathan: { symbol: '🌊', color: '#138d90' },
  'brute-wyvern': { symbol: '🦖', color: '#7e5a3c' },
};

const FALLBACK: TraitBadgeStyle = { symbol: '•', color: 'var(--muted)' };

export function traitBadgeStyle(traitId: string): TraitBadgeStyle {
  return TRAIT_BADGES[traitId] ?? FALLBACK;
}

/** Un insigne : symbole + nom du trait. */
export function traitBadge(traitId: string): HTMLElement {
  const style = traitBadgeStyle(traitId);
  return el('span', { className: 'trait-badge', attrs: { style: `--badge: ${style.color}` } }, [
    el('span', { className: 'trait-badge-symbol', text: style.symbol, attrs: { 'aria-hidden': 'true' } }),
    findTrait(traitId)?.name ?? traitId,
  ]);
}

/** Les insignes de tous les traits d'une unité : son élément d'abord, puis ses traits secondaires. */
export function traitBadges(unit: UnitDefinition): HTMLElement {
  return el('span', { className: 'trait-badges' }, unitTraitIds(unit).map(traitBadge));
}

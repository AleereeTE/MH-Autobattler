/**
 * Symbole et couleur de chaque trait, partagés par les insignes des unités, les synergies et l'aperçu d'un trait.
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

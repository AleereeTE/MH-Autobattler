import type { TraitDefinition, TraitTier } from '../../data/traits.ts';

/** Couleur d'un palier atteint, pour voir d'un coup d'œil où en est une synergie. */
export type TraitMedal = 'bronze' | 'silver' | 'gold';

export const MEDAL_NAMES: Readonly<Record<TraitMedal, string>> = { bronze: 'bronze', silver: 'argent', gold: 'or' };

/**
 * ✅ Bronze pour le premier palier, argent pour le deuxième, or pour le dernier.
 * Le dernier palier est toujours or : un trait à 2 paliers passe de bronze à or, un trait à 1 seul palier
 * (Dragon noir) est or d'emblée. Pas de couleur tant qu'aucun palier n'est atteint.
 */
export function traitMedal(trait: TraitDefinition, tier: TraitTier | null): TraitMedal | null {
  if (tier === null) return null;
  const index = trait.tiers.indexOf(tier);
  if (index < 0) return null;
  if (index === trait.tiers.length - 1) return 'gold';
  return index === 0 ? 'bronze' : 'silver';
}

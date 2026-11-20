import type { Element, Role, UnitKind } from '../data/definitions.ts';

/** Libellés français affichés par le rendu et l'interface. */

export const ELEMENT_LABELS: Readonly<Record<Element, string>> = {
  fire: 'Feu',
  water: 'Eau',
  thunder: 'Foudre',
  ice: 'Glace',
  dragon: 'Dragon',
};

export function elementLabel(element: Element | null): string {
  return element === null ? 'Sans élément' : ELEMENT_LABELS[element];
}

export const ROLE_LABELS: Readonly<Record<Role, string>> = {
  tank: 'Tank',
  bruiser: 'Bruiser',
  dps: 'DPS',
  support: 'Support',
};

export const KIND_LABELS: Readonly<Record<UnitKind, string>> = {
  hunter: 'Chasseur',
  monster: 'Monstre',
};

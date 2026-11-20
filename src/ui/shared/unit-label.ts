import type { UnitDefinition } from '../../data/definitions.ts';
import { ELEMENT_LABELS, KIND_LABELS, ROLE_LABELS, elementLabel } from '../../render/labels.ts';

/** Abréviation affichée dans le cercle d'une unité : « Tobi-Kadachi » → « TK », « Rathalos » → « Ra ». */
export function shortLabel(name: string): string {
  const parts = name.split(/[\s-]+/).filter((part) => part.length > 0);
  if (parts.length > 1) return parts.map((part) => part[0]?.toUpperCase() ?? '').join('').slice(0, 2);
  return name.slice(0, 2);
}

/** « Chasseur · Lance · Tank · Glace » */
export function unitSubtitle(unit: UnitDefinition): string {
  const kind = unit.weapon === undefined ? KIND_LABELS[unit.kind] : `${KIND_LABELS[unit.kind]} · ${unit.weapon}`;
  const element = unit.element === null ? elementLabel(null) : ELEMENT_LABELS[unit.element];
  return `${kind} · ${ROLE_LABELS[unit.role]} · ${element}`;
}

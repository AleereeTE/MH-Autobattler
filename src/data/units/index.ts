import type { UnitDefinition } from '../definitions.ts';
import { BLACK_DRAGONS } from './black-dragons.ts';
import { ELDER_DRAGONS } from './elder-dragons.ts';
import { HUNTERS } from './hunters.ts';
import { MONSTERS } from './monsters.ts';

/** Toutes les unités du prototype, triées par coût puis par nom. */
export const UNITS: readonly UnitDefinition[] = [...HUNTERS, ...MONSTERS, ...ELDER_DRAGONS, ...BLACK_DRAGONS].sort(
  (a, b) => a.cost - b.cost || a.name.localeCompare(b.name),
);

const UNITS_BY_ID = new Map(UNITS.map((unit) => [unit.id, unit]));

/**
 * Anciens identifiants des chasseurs (renommés le 2026-11-23 avec leurs noms officiels), pour relire
 * les compositions du bac à sable et le plan d'équipe enregistrés dans le navigateur avant le changement.
 */
const RENAMED_UNIT_IDS: Readonly<Record<string, string>> = {
  garrick: 'fabius',
  helga: 'olivia',
  akira: 'fiorayne',
  lysa: 'fugen',
  sylvain: 'hinoa',
  odette: 'minoto',
  kaede: 'rondine',
  dorian: 'luchika',
  mira: 'aiden',
  brann: 'arlow',
  ondine: 'galleus',
};

export function findUnit(id: string): UnitDefinition | undefined {
  return UNITS_BY_ID.get(id) ?? UNITS_BY_ID.get(RENAMED_UNIT_IDS[id] ?? '');
}

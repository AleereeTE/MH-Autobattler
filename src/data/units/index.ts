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

export function findUnit(id: string): UnitDefinition | undefined {
  return UNITS_BY_ID.get(id);
}

import type { Hex } from '../core/hex.ts';
import type { Placement } from '../combat/setup.ts';
import type { SkillDefinition, Stats, UnitDefinition } from '../data/definitions.ts';
import type { Equipment } from '../data/items.ts';

export interface UnitOverrides extends Partial<Omit<UnitDefinition, 'stats' | 'skill'>> {
  readonly stats?: Partial<Stats>;
  readonly skill?: Partial<SkillDefinition>;
}

/**
 * Crée une fiche d'unité de test avec des valeurs neutres :
 * pas de critique, pas de défense, 1 attaque par seconde, et une énergie maximale
 * si élevée que la compétence ne se déclenche jamais (sauf si le test la change).
 */
export function makeUnit(overrides: UnitOverrides = {}): UnitDefinition {
  const { stats, skill, ...rest } = overrides;
  return {
    id: 'test-unit',
    name: 'Unité de test',
    kind: 'hunter',
    role: 'bruiser',
    element: null,
    cost: 1,
    traits: [],
    ...rest,
    stats: {
      hp: 500,
      attack: 50,
      elementalPower: 0,
      critChance: 0,
      armor: 0,
      elementalResist: 0,
      attackSpeed: 1,
      range: 1,
      maxEnergy: 1_000_000,
      energyRegenBonus: 0,
      ...stats,
    },
    skill: {
      id: skill?.id ?? 'test-skill',
      name: skill?.name ?? 'Compétence de test',
      description: skill?.description ?? '',
      castTime: skill?.castTime ?? 0,
      effects: skill?.effects ?? [],
    },
  };
}

export function place(unit: UnitDefinition, col: number, row: number, equipment?: Equipment): Placement {
  const position: Hex = { col, row };
  return equipment === undefined ? { unit, position } : { unit, position, equipment };
}

import type { Role } from './definitions.ts';

/**
 * Façon dont chaque rôle génère de l'énergie (docs/game-design.md §3.5).
 * ✅ La répartition (qui gagne quoi) est décidée · ⚠️ les montants sont provisoires.
 */
export interface EnergyProfile {
  /** Énergie gagnée à chaque attaque de base. */
  readonly perAttack: number;
  /** Énergie gagnée à chaque coup subi. */
  readonly perHitTaken: number;
  /** Énergie gagnée chaque seconde. */
  readonly passivePerSecond: number;
}

export const ENERGY_PROFILES: Readonly<Record<Role, EnergyProfile>> = {
  tank: { perAttack: 0, perHitTaken: 8, passivePerSecond: 2 },
  bruiser: { perAttack: 8, perHitTaken: 0, passivePerSecond: 4 },
  dps: { perAttack: 10, perHitTaken: 0, passivePerSecond: 1 },
  support: { perAttack: 8, perHitTaken: 0, passivePerSecond: 4 },
};

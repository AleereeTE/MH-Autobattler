import type { StarRank } from './definitions.ts';
import type { Equipment } from './items.ts';

/**
 * Compositions prédéfinies (escouades ennemies et équipe de démonstration).
 * Les positions sont celles du plateau : rangées 0 à 3 pour l'ennemi, 4 à 7 pour le joueur.
 */

export interface SquadMember {
  readonly unitId: string;
  readonly col: number;
  readonly row: number;
  readonly equipment?: Equipment;
  /** Rang ★ (★1 si absent). */
  readonly rank?: StarRank;
}

export interface SquadDefinition {
  readonly id: string;
  readonly name: string;
  readonly members: readonly SquadMember[];
}

export const ENEMY_SQUADS: readonly SquadDefinition[] = [
  {
    id: 'easy',
    name: 'Facile',
    members: [
      { unitId: 'barroth', col: 3, row: 3 },
      { unitId: 'khezu', col: 2, row: 3 },
      { unitId: 'anjanath', col: 3, row: 2 },
    ],
  },
  {
    id: 'medium',
    name: 'Moyenne',
    members: [
      { unitId: 'barroth', col: 2, row: 3 },
      { unitId: 'khezu', col: 4, row: 3 },
      { unitId: 'anjanath', col: 3, row: 3 },
      { unitId: 'tobi-kadachi', col: 3, row: 2 },
    ],
  },
  {
    id: 'hard',
    name: 'Difficile',
    members: [
      { unitId: 'barroth', col: 2, row: 3, equipment: [{ kind: 'object', materials: ['horn', 'fang'] }] },
      { unitId: 'khezu', col: 4, row: 3 },
      { unitId: 'anjanath', col: 3, row: 3, equipment: [{ kind: 'material', material: 'bone' }] },
      { unitId: 'tobi-kadachi', col: 1, row: 2 },
      { unitId: 'rathalos', col: 3, row: 1, equipment: [{ kind: 'object', materials: ['gem', 'gem'] }] },
      { unitId: 'legiana', col: 5, row: 1 },
    ],
  },
];

/** Équipe de démonstration du joueur : Feu (3), Catalyseur (2), Guilde (2), Glace (2). */
export const DEMO_PLAYER_TEAM: SquadDefinition = {
  id: 'demo',
  name: 'Équipe de démonstration',
  members: [
    { unitId: 'fabius', col: 3, row: 4, equipment: [{ kind: 'object', materials: ['horn', 'fang'] }] },
    { unitId: 'olivia', col: 2, row: 4, equipment: [{ kind: 'material', material: 'bone' }] },
    { unitId: 'anjanath', col: 4, row: 4 },
    { unitId: 'minoto', col: 3, row: 6 },
    { unitId: 'hinoa', col: 2, row: 7, equipment: [{ kind: 'object', materials: ['feather', 'bone'] }] },
    { unitId: 'rathalos', col: 4, row: 7, equipment: [{ kind: 'object', materials: ['gem', 'gem'] }] },
  ],
};

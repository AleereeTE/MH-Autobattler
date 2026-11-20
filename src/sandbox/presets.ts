import type { CombatSetup, Placement } from '../combat/index.ts';
import { DEMO_PLAYER_TEAM, ENEMY_SQUADS, type SquadDefinition } from '../data/squads.ts';
import { findUnit } from '../data/units/index.ts';

/** Transforme une composition prédéfinie (identifiants d'unités) en placements de combat. */
export function squadPlacements(squad: SquadDefinition): Placement[] {
  return squad.members.map((member) => {
    const unit = findUnit(member.unitId);
    if (unit === undefined) throw new Error(`Unité inconnue dans « ${squad.name} » : ${member.unitId}`);
    const position = { col: member.col, row: member.row };
    return member.equipment === undefined ? { unit, position } : { unit, position, equipment: member.equipment };
  });
}

export function findSquad(id: string): SquadDefinition | undefined {
  return ENEMY_SQUADS.find((squad) => squad.id === id);
}

/** Combat de démonstration : équipe de démo contre l'escouade choisie (Moyenne par défaut). */
export function createDemoSetup(enemySquadId = 'medium'): CombatSetup {
  const squad = findSquad(enemySquadId);
  if (squad === undefined) throw new Error(`Escouade inconnue : ${enemySquadId}`);
  return { player: squadPlacements(DEMO_PLAYER_TEAM), enemy: squadPlacements(squad) };
}

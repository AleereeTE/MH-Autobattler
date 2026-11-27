import type { SkillDefinition } from '../../data/definitions.ts';
import { skillForRank } from '../../rules/ranks.ts';
import type { CombatUnit } from '../state.ts';

/**
 * Compétence de l'unité en ce moment : celle de l'incantation en cours, sinon sa compétence de boss
 * si c'est un boss enragé, sinon celle de son rang (compétence secrète des Dragons noirs au ★3).
 */
export function currentSkill(unit: CombatUnit): SkillDefinition {
  if (unit.cast !== null) return unit.cast.skill;
  if (unit.enraged && unit.def.bossSkill !== undefined) return unit.def.bossSkill;
  return skillForRank(unit.def, unit.rank);
}

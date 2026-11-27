import { BOSS_VERSION } from '../../data/boss-version.ts';
import { isTargetable, type CombatState, type CombatUnit } from '../state.ts';

/**
 * Rage d'un boss (game-design §9) : quand ses PV tombent à la mi-vie, il s'enrage une fois pour toutes.
 * Sa compétence de boss remplace la sienne, et son énergie se remplit pour qu'il la lance tout de suite
 * (après l'incantation en cours, s'il en a une).
 */
export function checkEnrage(state: CombatState, unit: CombatUnit): void {
  if (!unit.boss || unit.enraged || unit.def.bossSkill === undefined || !isTargetable(unit)) return;
  if (unit.hp > unit.stats.hp * BOSS_VERSION.enrageHpShare) return;
  unit.enraged = true;
  unit.energy = unit.stats.maxEnergy;
  state.events.push({ type: 'enrage', tick: state.tick, uid: unit.uid, skillName: unit.def.bossSkill.name });
}

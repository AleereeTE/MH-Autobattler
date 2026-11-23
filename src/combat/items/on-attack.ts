import { hexDistance } from '../../core/hex.ts';
import { BLAST_EVERY_ATTACKS } from '../../data/items.ts';
import { dealDamage } from '../actions/damage.ts';
import { livingEnemies } from '../behaviors/targeting.ts';
import { pushSkillArea } from '../skills/area.ts';
import { tryParalyze } from '../status/ailments.ts';
import { isTargetable, type CombatState, type CombatUnit } from '../state.ts';

/**
 * Effets d'objets déclenchés par une attaque de base qui touche : Éveil élémentaire, Briseur,
 * Intimidateur, Attaque paralysie et Attaque explosion. Une attaque esquivée ne déclenche rien.
 */
export function afterBasicAttackHit(state: CombatState, attacker: CombatUnit, target: CombatUnit): void {
  const { stats } = attacker;

  // ✅ Éveil élémentaire : des dégâts élémentaires en plus, selon la puissance élémentaire.
  if (stats.onHitElementalRatio > 0 && isTargetable(target)) {
    dealDamage(state, attacker, target, { amount: stats.onHitElementalRatio * stats.elementalPower, type: 'elemental', isCrit: false, cause: 'item' });
  }

  // ✅ Briseur : l'armure de la cible baisse pour tout le combat, jusqu'au plafond de l'objet.
  if (stats.armorShredPerAttack > 0 && target.armorShred < stats.armorShredMax) {
    target.armorShred = Math.min(stats.armorShredMax, target.armorShred + stats.armorShredPerAttack);
  }

  // ✅ Intimidateur : la cible perd de l'énergie.
  if (stats.energyDrainPerAttack > 0) target.energy = Math.max(0, target.energy - stats.energyDrainPerAttack);

  // ✅ Attaque paralysie : une chance de paralyser la cible.
  tryParalyze(state, attacker, target);

  // ✅ Attaque explosion : toutes les N attaques qui touchent, une explosion autour de la cible.
  if (stats.blastDamage > 0) {
    attacker.landedAttacks += 1;
    if (attacker.landedAttacks % BLAST_EVERY_ATTACKS === 0) blast(state, attacker, target);
  }
}

/** Explosion : dégâts élémentaires à la cible et à ses voisins (ennemis à 1 case d'elle). */
function blast(state: CombatState, attacker: CombatUnit, target: CombatUnit): void {
  const center = target.position;
  const amount = attacker.stats.blastDamage + attacker.stats.blastElementalRatio * attacker.stats.elementalPower;
  pushSkillArea(state, attacker, 'damage', center, 1);
  for (const enemy of livingEnemies(attacker, state.units)) {
    if (hexDistance(enemy.position, center) <= 1) dealDamage(state, attacker, enemy, { amount, type: 'elemental', isCrit: false, cause: 'item' });
  }
}

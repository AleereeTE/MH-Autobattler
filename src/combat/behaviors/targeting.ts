import { hexDistance } from '../../core/hex.ts';
import type { TargetRule } from '../../data/definitions.ts';
import { isTargetable, type CombatUnit } from '../state.ts';

type Criterion = (candidate: CombatUnit) => number;

export function livingEnemies(unit: CombatUnit, units: readonly CombatUnit[]): CombatUnit[] {
  return units.filter((other) => other.side !== unit.side && isTargetable(other));
}

/**
 * Renvoie le candidat qui a la plus petite valeur pour le premier critère,
 * puis pour le suivant en cas d'égalité, et enfin le plus petit identifiant.
 * Le résultat est donc toujours le même pour une même situation.
 */
function pickFirst(candidates: readonly CombatUnit[], criteria: readonly Criterion[]): CombatUnit | null {
  let best: CombatUnit | null = null;
  for (const candidate of candidates) {
    if (best === null || compare(candidate, best, criteria) < 0) best = candidate;
  }
  return best;
}

function compare(a: CombatUnit, b: CombatUnit, criteria: readonly Criterion[]): number {
  for (const criterion of criteria) {
    const difference = criterion(a) - criterion(b);
    if (difference !== 0) return difference;
  }
  return a.uid - b.uid;
}

export function nearestEnemy(unit: CombatUnit, units: readonly CombatUnit[]): CombatUnit | null {
  return pickFirst(livingEnemies(unit, units), [(enemy) => hexDistance(unit.position, enemy.position)]);
}

/**
 * ✅ Cible : toujours l'ennemi le plus proche, réévalué à chaque décision de l'unité
 * (avant chaque pas et pendant qu'elle attaque). Si un autre ennemi devient plus proche, elle change de cible.
 * ⚠️ À égalité de distance, elle garde sa cible actuelle (pas d'hésitation entre deux ennemis),
 * sinon elle prend le plus petit identifiant.
 */
export function acquireTarget(unit: CombatUnit, units: readonly CombatUnit[]): CombatUnit | null {
  const enemies = livingEnemies(unit, units);
  const next = pickFirst(enemies, [
    (enemy) => hexDistance(unit.position, enemy.position),
    (enemy) => (enemy.uid === unit.targetUid ? 0 : 1),
  ]);
  unit.targetUid = next?.uid ?? null;
  return next;
}

/** ✅ Certaines compétences visent l'ennemi le plus faible ou la ligne arrière (le plus éloigné). */
export function selectTarget(rule: TargetRule, unit: CombatUnit, units: readonly CombatUnit[]): CombatUnit | null {
  const distance: Criterion = (enemy) => hexDistance(unit.position, enemy.position);
  switch (rule) {
    case 'currentTarget':
      return acquireTarget(unit, units);
    case 'lowestHpEnemy':
      return pickFirst(livingEnemies(unit, units), [(enemy) => enemy.hp, distance]);
    case 'farthestEnemy':
      return pickFirst(livingEnemies(unit, units), [(enemy) => -distance(enemy)]);
    case 'self':
      return unit;
  }
}

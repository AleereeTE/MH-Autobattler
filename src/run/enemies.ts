import type { Placement } from '../combat/index.ts';
import { BOARD_COLS, hexKey, type Hex } from '../core/hex.ts';
import { pickOne } from '../core/random.ts';
import type { Rng } from '../core/rng.ts';
import type { StarRank, StatBonus, UnitDefinition } from '../data/definitions.ts';
import { BOSS_VERSION } from '../data/boss-version.ts';
import { BOSSES_BY_STAGE, ENEMY_BUDGET } from '../data/run-balance.ts';
import { UNITS } from '../data/units/index.ts';
import { copiesForRank } from './economy.ts';
import { infiniteEnemyBonus } from './infinite.ts';
import { huntInfo } from './structure.ts';

/**
 * ⚠️ Escouades ennemies générées selon un budget (game-design §9, valeurs dans prototype-content.md).
 * Le budget recrute d'abord des monstres, puis monte leur rang. Un boss est la version boss d'un grand monstre
 * (bonus de statistiques et compétence de boss quand il s'enrage), avec une escorte réduite.
 */

interface Member {
  readonly unit: UnitDefinition;
  rank: StarRank;
  /** Bonus de la version boss (seulement pour le boss). */
  readonly bossBonus?: StatBonus;
}

const MONSTERS = UNITS.filter((unit) => unit.kind === 'monster');

export function huntBudget(hunt: number): number {
  return Math.floor(ENEMY_BUDGET.base + ENEMY_BUDGET.perHunt * (hunt - 1));
}

export function maxEnemyUnits(hunt: number): number {
  return Math.min(ENEMY_BUDGET.maxUnits, ENEMY_BUDGET.startUnits + Math.floor((hunt - 1) / ENEMY_BUDGET.huntsPerExtraUnit));
}

/** Prix pour monter un monstre du rang `rank` au suivant : la différence d'exemplaires × coût. */
function upgradeCost(member: Member): number {
  return member.unit.cost * (copiesForRank((member.rank + 1) as StarRank) - copiesForRank(member.rank));
}

/** Règle du stage (coût, rang, boss) ; au-delà de la dernière règle (mode infini), la dernière. */
function stageRule<T>(rules: readonly T[], stageIndex: number): T | undefined {
  return rules[Math.min(stageIndex, rules.length - 1)];
}

/** Bonus de la version boss (`extra`, selon le stage), ajouté au renforcement du mode infini s'il y en a un. */
export function bossBonus(infinite: StatBonus | null, extra: StatBonus): StatBonus {
  return {
    hpPercent: (infinite?.hpPercent ?? 0) + (extra.hpPercent ?? 0),
    attackPercent: (infinite?.attackPercent ?? 0) + (extra.attackPercent ?? 0),
    elementalPowerPercent: (infinite?.elementalPowerPercent ?? 0) + (extra.elementalPowerPercent ?? 0),
  };
}

/** Les tanks et bruisers se placent devant (rangée 3, puis 2), les DPS et supports derrière (0, puis 1). */
function placeMembers(members: readonly Member[], rng: Rng, bonus: StatBonus | null): Placement[] {
  const taken = new Set<string>();
  return members.map((member) => {
    const front = member.unit.role === 'tank' || member.unit.role === 'bruiser';
    const rows = front ? [3, 2, 1, 0] : [0, 1, 2, 3];
    let position: Hex = { col: 0, row: rows[0] ?? 0 };
    for (const row of rows) {
      const free = Array.from({ length: BOARD_COLS }, (_, col) => ({ col, row })).filter((hex) => !taken.has(hexKey(hex)));
      const picked = pickOne(rng, free);
      if (picked !== undefined) {
        position = picked;
        break;
      }
    }
    taken.add(hexKey(position));
    const placement: Placement = { unit: member.unit, position, equipment: [], rank: member.rank };
    if (member.bossBonus !== undefined) return { ...placement, boss: true, bonus: bossBonus(bonus, member.bossBonus) };
    return bonus === null ? placement : { ...placement, bonus };
  });
}

/**
 * Escouade de la chasse `hunt`. `extraHunts` (quête urgente) : budget et nombre de monstres de quelques chasses
 * plus loin, mais toujours avec les limites de coût et de rang du stage en cours.
 * En mode infini, les ennemis sont renforcés comme à l'étape `hunt + extraHunts`.
 */
export function generateSquad(hunt: number, rng: Rng, extraHunts = 0): Placement[] {
  const info = huntInfo(hunt);
  const stageIndex = info.stage - 1;
  const maxCost = stageRule(ENEMY_BUDGET.maxCostByStage, stageIndex) ?? 3;
  const maxRank = stageRule(ENEMY_BUDGET.maxRankByStage, stageIndex) ?? 3;
  let budget = huntBudget(hunt + extraHunts);
  let slots = maxEnemyUnits(hunt + extraHunts);

  const members: Member[] = [];
  const usualBoss = info.isBoss ? stageRule(BOSSES_BY_STAGE, stageIndex) : undefined;
  const bossRule = usualBoss?.rare !== undefined && rng.chance(usualBoss.rare.chance) ? usualBoss.rare : usualBoss;
  if (bossRule !== undefined) {
    const candidates = MONSTERS.filter(
      (unit) => (bossRule.cost === undefined || unit.cost === bossRule.cost) && (bossRule.trait === undefined || unit.traits.includes(bossRule.trait)),
    );
    const boss = pickOne(rng, candidates);
    if (boss !== undefined) {
      members.push({ unit: boss, rank: bossRule.rank as StarRank, bossBonus: bossRule.bonus });
      // ⚠️ Escorte réduite : une part des places et du budget habituels.
      slots = Math.max(1, Math.floor((slots - 1) * BOSS_VERSION.escortShare));
      budget = Math.floor(budget * BOSS_VERSION.escortBudgetShare);
    }
  }
  const escort: Member[] = [];

  // 1. Recruter des monstres au hasard, tant que le budget et les places le permettent.
  while (escort.length < slots) {
    const affordable = MONSTERS.filter((unit) => unit.cost <= Math.min(maxCost, budget));
    const unit = pickOne(rng, affordable);
    if (unit === undefined) break;
    escort.push({ unit, rank: 1 });
    budget -= unit.cost;
  }

  // 2. Monter le rang de monstres au hasard avec le budget restant.
  for (;;) {
    const upgradable = escort.filter((member) => member.rank < maxRank && upgradeCost(member) <= budget);
    const member = pickOne(rng, upgradable);
    if (member === undefined) break;
    budget -= upgradeCost(member);
    member.rank = (member.rank + 1) as StarRank;
  }

  return placeMembers([...members, ...escort], rng, infiniteEnemyBonus(hunt + extraHunts));
}

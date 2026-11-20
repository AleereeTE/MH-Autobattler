import type { Placement } from '../combat/index.ts';
import { BOARD_COLS, hexKey, type Hex } from '../core/hex.ts';
import { pickOne } from '../core/random.ts';
import type { Rng } from '../core/rng.ts';
import type { StarRank, UnitDefinition } from '../data/definitions.ts';
import { ENEMY_BUDGET } from '../data/run-balance.ts';
import { UNITS } from '../data/units/index.ts';
import { copiesForRank } from './economy.ts';
import { huntInfo } from './structure.ts';

/**
 * ⚠️ Escouades ennemies générées selon un budget (game-design §9, valeurs dans prototype-content.md).
 * Le budget recrute d'abord des monstres, puis monte leur rang. Les boss sont une escouade renforcée.
 */

interface Member {
  readonly unit: UnitDefinition;
  rank: StarRank;
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

/** Les tanks et bruisers se placent devant (rangée 3, puis 2), les DPS et supports derrière (0, puis 1). */
function placeMembers(members: readonly Member[], rng: Rng): Placement[] {
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
    return { unit: member.unit, position, equipment: [], rank: member.rank };
  });
}

export function generateSquad(hunt: number, rng: Rng): Placement[] {
  const info = huntInfo(hunt);
  const stageIndex = info.stage - 1;
  const maxCost = ENEMY_BUDGET.maxCostByStage[stageIndex] ?? 3;
  const maxRank = ENEMY_BUDGET.maxRankByStage[stageIndex] ?? 3;
  let budget = huntBudget(hunt);
  let slots = maxEnemyUnits(hunt);

  const members: Member[] = [];
  if (info.isBoss) {
    const boss = pickOne(rng, MONSTERS.filter((unit) => unit.cost === ENEMY_BUDGET.bossCost));
    if (boss !== undefined) {
      members.push({ unit: boss, rank: ENEMY_BUDGET.bossRank as StarRank });
      slots = Math.max(1, slots - 1);
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

  return placeMembers([...members, ...escort], rng);
}

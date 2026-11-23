import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../combat/simulate.ts';
import type { CombatEvent, UnitSnapshot } from '../combat/index.ts';
import { createDemoSetup } from '../sandbox/presets.ts';
import { formatCombatLog } from './text-log.ts';

describe('formatCombatLog', () => {
  it('s’arrête à l’instant demandé', () => {
    const result = simulateCombat(createDemoSetup(), 1);
    const full = formatCombatLog(result.events);
    const start = formatCombatLog(result.events, 0);

    expect(start[0]).toMatch(/Début du combat/);
    expect(start.length).toBeLessThan(full.length);
    expect(full.at(-1)).toMatch(/Fin du combat/);
    expect(start.some((line) => line.includes('Fin du combat'))).toBe(false);
  });
});

describe('formatCombatLog — statuts des objets', () => {
  const unit = (uid: number, side: 'player' | 'enemy'): UnitSnapshot => ({
    uid,
    defId: 'khezu',
    name: 'Khezu',
    side,
    kind: 'monster',
    role: 'tank',
    element: 'thunder',
    cost: 1,
    rank: 1,
    position: { col: 3, row: side === 'player' ? 4 : 3 },
    maxHp: 500,
    maxEnergy: 80,
    energy: 0,
    equipment: [],
    stats: { hp: 500, attack: 50, elementalPower: 30, critChance: 0, armor: 0, elementalResist: 0, attackSpeed: 1, range: 1, maxEnergy: 80 },
  });
  const events: CombatEvent[] = [
    { type: 'combatStart', tick: 0, units: [unit(1, 'player'), unit(2, 'enemy')], traits: { player: [], enemy: [] } },
    { type: 'status', tick: 10, uid: 2, status: 'poison', durationTicks: 80 },
    { type: 'damage', tick: 30, sourceUid: 1, targetUid: 2, amount: 30, absorbed: 0, damageType: 'elemental', cause: 'poison', isCrit: false, hpAfter: 470 },
    { type: 'status', tick: 40, uid: 2, status: 'paralysis', durationTicks: 30 },
  ];

  it('signale le poison, ses dégâts et la paralysie', () => {
    const log = formatCombatLog(events).join(' | ');
    expect(log).toContain('est empoisonné');
    expect(log).toContain('(poison)');
    expect(log).toContain('est paralysé');
  });
});

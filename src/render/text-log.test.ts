import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../combat/simulate.ts';
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

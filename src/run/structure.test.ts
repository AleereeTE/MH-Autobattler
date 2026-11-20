import { describe, expect, it } from 'vitest';
import { TOTAL_HUNTS, huntInfo } from './structure.ts';

describe('structure de la run', () => {
  it('compte 30 chasses, avec un boss aux chasses 10, 20 et 30', () => {
    expect(TOTAL_HUNTS).toBe(30);
    const bosses = Array.from({ length: 30 }, (_, i) => i + 1).filter((hunt) => huntInfo(hunt).isBoss);
    expect(bosses).toEqual([10, 20, 30]);
  });

  it('situe chaque chasse dans son stage', () => {
    expect(huntInfo(1)).toEqual({ stage: 1, indexInStage: 1, isBoss: false, isLast: false });
    expect(huntInfo(11)).toMatchObject({ stage: 2, indexInStage: 1 });
    expect(huntInfo(30)).toEqual({ stage: 3, indexInStage: 10, isBoss: true, isLast: true });
  });
});

import { describe, expect, it } from 'vitest';
import { UNITS } from '../../data/units/index.ts';
import { hasShieldSkill } from './unit-card.ts';

describe('rappel du bouclier sur les fiches', () => {
  it('concerne exactement les unités dont la compétence donne un bouclier', () => {
    const shielded = UNITS.filter(hasShieldSkill).map((unit) => unit.id).sort();
    expect(shielded).toEqual(['arlow', 'barroth', 'dire-miralis', 'fabius']);
  });
});

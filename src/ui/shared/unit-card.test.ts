import { describe, expect, it } from 'vitest';
import { UNITS, findUnit } from '../../data/units/index.ts';
import { hasShieldSkill } from './unit-card.ts';

describe('rappel du bouclier sur les fiches', () => {
  it('concerne exactement les unités dont la compétence donne un bouclier', () => {
    const shielded = UNITS.filter((unit) => hasShieldSkill(unit)).map((unit) => unit.id).sort();
    expect(shielded).toEqual(['arlow', 'barroth', 'dire-miralis', 'fabius']);
  });

  it('suit la compétence du rang : Dire Miralis garde son bouclier avec Cataclysme au ★3', () => {
    const direMiralis = findUnit('dire-miralis');
    if (direMiralis === undefined) throw new Error('Dire Miralis manquant');
    expect(hasShieldSkill(direMiralis, 3)).toBe(true);
    const fatalis = findUnit('fatalis');
    if (fatalis === undefined) throw new Error('Fatalis manquant');
    expect(hasShieldSkill(fatalis, 3)).toBe(false);
  });
});

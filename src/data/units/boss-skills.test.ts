import { describe, expect, it } from 'vitest';
import { BOSSES_BY_STAGE, type BossRule } from '../run-balance.ts';
import { UNITS } from './index.ts';

/** Monstres que cette règle de boss peut tirer. */
function candidates(rule: BossRule) {
  return UNITS.filter(
    (unit) => unit.kind === 'monster' && (rule.cost === undefined || unit.cost === rule.cost) && (rule.trait === undefined || unit.traits.includes(rule.trait)),
  );
}

describe('compétences de boss', () => {
  const bosses = BOSSES_BY_STAGE.flatMap((rule) => [rule, ...(rule.rare === undefined ? [] : [rule.rare])]).flatMap(candidates);
  const bossIds = new Set(bosses.map((unit) => unit.id));

  it('les 11 boss possibles en ont une, et eux seuls', () => {
    expect([...bossIds].sort()).toEqual(
      ['alatreon', 'dire-miralis', 'fatalis', 'kirin', 'lagiacrus', 'legiana', 'namielle', 'nargacuga', 'rathalos', 'safi-jiiva', 'teostra'].sort(),
    );
    for (const unit of UNITS) expect(unit.bossSkill !== undefined, unit.id).toBe(bossIds.has(unit.id));
  });

  it('chaque compétence de boss est différente de la compétence normale, avec un identifiant unique', () => {
    const ids = UNITS.flatMap((unit) => (unit.bossSkill === undefined ? [] : [unit.bossSkill.id]));
    expect(new Set(ids).size).toBe(ids.length);
    for (const unit of UNITS) {
      if (unit.bossSkill === undefined) continue;
      expect(unit.bossSkill.id).not.toBe(unit.skill.id);
      expect(unit.bossSkill.effects.length, unit.id).toBeGreaterThan(0);
      expect(unit.bossSkill.description.length, unit.id).toBeGreaterThan(0);
    }
  });
});

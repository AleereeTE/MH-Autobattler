import { describe, expect, it } from 'vitest';
import type { StarRank } from '../../data/definitions.ts';
import { findUnit } from '../../data/units/index.ts';
import { ULTIMATE_BANNER_TICKS, createReplay } from '../../render/replay.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { createCombatState } from '../setup.ts';
import type { CombatUnit } from '../state.ts';
import { progressCast, startCast } from './cast.ts';

/** Fatalis au rang donné, contre 4 ennemis éparpillés dans leur camp. */
function fatalisAgainstFour(rank: StarRank) {
  const fatalis = findUnit('fatalis');
  if (fatalis === undefined) throw new Error('Fatalis manquant');
  const enemies = [
    [0, 0],
    [6, 0],
    [0, 3],
    [6, 2],
  ].map(([col, row], index) => place(makeUnit({ id: `cible-${index}`, stats: { hp: 100_000 } }), col ?? 0, row ?? 0));
  const state = createCombatState({ player: [{ ...place(fatalis, 3, 7), rank }], enemy: enemies }, 1);
  const caster = state.units[0] as CombatUnit;
  caster.targetUid = state.units[1]?.uid ?? null;
  startCast(state, caster);
  while (caster.cast !== null) progressCast(state, caster);
  return state;
}

describe('compétence secrète des Dragons noirs ★3', () => {
  it('au ★3, Fatalis lance « Fin des temps » sur tous les ennemis', () => {
    const state = fatalisAgainstFour(3);
    const cast = state.events.find((event) => event.type === 'skillCast');
    expect(cast).toMatchObject({ skillName: 'Fin des temps', master: true });
    const hit = new Set(state.events.flatMap((event) => (event.type === 'damage' && event.cause === 'skill' ? [event.targetUid] : [])));
    expect(hit.size).toBe(4);
  });

  it('au ★2, il garde sa compétence habituelle, sans bandeau', () => {
    const state = fatalisAgainstFour(2);
    const cast = state.events.find((event) => event.type === 'skillCast');
    expect(cast).toMatchObject({ skillName: 'Souffle du Fatalis' });
    expect(cast?.type === 'skillCast' ? cast.master : undefined).toBeUndefined();
  });

  it('le replay affiche le bandeau pendant 2,5 s après le lancement', () => {
    const state = fatalisAgainstFour(3);
    const cast = state.events.find((event) => event.type === 'skillCast');
    const replay = createReplay(state.events);
    const castTick = cast?.tick ?? 0;
    expect(replay.frameAt(castTick).ultimate).toMatchObject({ skillName: 'Fin des temps', unitName: 'Fatalis', defId: 'fatalis', side: 'player', age: 0 });
    expect(replay.frameAt(castTick + ULTIMATE_BANNER_TICKS).ultimate).toBeNull();
    expect(createReplay(fatalisAgainstFour(2).events).frameAt(castTick).ultimate).toBeNull();
  });
});

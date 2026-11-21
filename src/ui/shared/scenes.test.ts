import { describe, expect, it } from 'vitest';
import { simulateCombat } from '../../combat/simulate.ts';
import { createReplay } from '../../render/replay.ts';
import { makeUnit, place } from '../../test-utils/factories.ts';
import { frameUnitAt } from './scenes.ts';

describe('frameUnitAt', () => {
  const result = simulateCombat(
    {
      player: [place(makeUnit({ id: 'joueur', stats: { range: 1 } }), 3, 7, [{ kind: 'material', material: 'bone' }])],
      enemy: [place(makeUnit({ id: 'ennemi' }), 3, 0)],
    },
    1,
  );
  const replay = createReplay(result.events);

  it('trouve l’unité affichée sur une case, avec ses statistiques et son équipement de départ', () => {
    const unit = frameUnitAt(replay.frameAt(0), { col: 3, row: 7 });
    expect(unit?.defId).toBe('joueur');
    expect(unit?.equipment).toEqual([{ kind: 'material', material: 'bone' }]);
    expect(unit?.stats.attack).toBe(65); // 50 + Os (15)
  });

  it('ne trouve rien sur une case vide', () => {
    expect(frameUnitAt(replay.frameAt(0), { col: 0, row: 5 })).toBeUndefined();
  });

  it('suit une unité qui se déplace (sur sa case d’arrivée passé la moitié du trajet)', () => {
    const move = result.events.find((event) => event.type === 'move');
    if (move === undefined || move.type !== 'move') throw new Error('aucun déplacement');
    const late = replay.frameAt(move.tick + Math.ceil(move.durationTicks * 0.75));
    expect(frameUnitAt(late, move.to)?.uid).toBe(move.uid);
  });
});

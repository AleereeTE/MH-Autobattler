import { describe, expect, it } from 'vitest';
import type { Frame, FrameUltimate } from '../../render/replay.ts';
import { UltimateCue } from './roars.ts';

const frame = (ultimate: Partial<FrameUltimate> | null): Frame => ({
  tick: 0,
  units: [],
  texts: [],
  areas: [],
  suddenDeath: false,
  winner: undefined,
  ultimate: ultimate === null ? null : { uid: 1, defId: 'fatalis', unitName: 'Fatalis', headline: 'Fatalis ★★★', skillName: 'Fin des temps', side: 'player', startTick: 40, age: 0, ...ultimate },
});

describe('cri des Dragons noirs ★3', () => {
  it('se joue une seule fois par compétence secrète, au début du bandeau', () => {
    const played: string[] = [];
    const cue = new UltimateCue((unitId) => played.push(unitId));
    cue.update(frame(null));
    cue.update(frame({ age: 0.05 }));
    cue.update(frame({ age: 0.4 }));
    expect(played).toEqual(['fatalis']);
    // Une autre compétence secrète plus tard dans le combat : nouveau cri.
    cue.update(frame({ startTick: 300, defId: 'alatreon', age: 0.1 }));
    expect(played).toEqual(['fatalis', 'alatreon']);
  });

  it('ne se joue pas quand on saute au milieu d’un bandeau, et recommence après un nouveau combat', () => {
    const played: string[] = [];
    const cue = new UltimateCue((unitId) => played.push(unitId));
    cue.update(frame({ age: 0.6 }));
    expect(played).toEqual([]);
    cue.reset();
    cue.update(frame({ age: 0 }));
    expect(played).toEqual(['fatalis']);
  });
});

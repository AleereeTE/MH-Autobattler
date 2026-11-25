import { describe, expect, it } from 'vitest';
import { UNITS, findUnit } from './index.ts';

describe('chasseurs', () => {
  it('portent des noms officiels de la série', () => {
    const hunters = UNITS.filter((unit) => unit.kind === 'hunter').map((unit) => unit.name).sort();
    expect(hunters).toEqual(['Aiden', 'Arlow', 'Fabius', 'Fiorayne', 'Fugen', 'Galleus', 'Hinoa', 'Lea', 'Luchika', 'Minoto', 'Olivia', 'Rondine']);
  });

  it('retrouvent leur fiche avec leur ancien identifiant (compositions et plans enregistrés)', () => {
    expect(findUnit('helga')?.id).toBe('olivia');
    expect(findUnit('garrick')?.id).toBe('fabius');
    expect(findUnit('ondine')?.id).toBe('galleus');
    expect(findUnit('olivia')?.name).toBe('Olivia');
    expect(findUnit('inconnu')).toBeUndefined();
  });
});

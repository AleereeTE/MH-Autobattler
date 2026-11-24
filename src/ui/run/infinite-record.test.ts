import { describe, expect, it } from 'vitest';
import { memoryRecordStore, parseRecord } from './infinite-record.ts';

describe('record du mode infini', () => {
  it('lit une étape enregistrée, et 0 pour tout contenu absent ou illisible', () => {
    expect(parseRecord('42')).toBe(42);
    expect(parseRecord(null)).toBe(0);
    expect(parseRecord('')).toBe(0);
    expect(parseRecord('abc')).toBe(0);
    expect(parseRecord('-3')).toBe(0);
    expect(parseRecord('12.5')).toBe(0);
  });

  it('le stockage en mémoire garde la dernière valeur enregistrée', () => {
    const store = memoryRecordStore(7);
    expect(store.load()).toBe(7);
    store.save(33);
    expect(store.load()).toBe(33);
  });
});

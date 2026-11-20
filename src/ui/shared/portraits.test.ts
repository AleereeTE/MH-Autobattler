import { describe, expect, it } from 'vitest';
import { portraitId, portraitUrls } from './portraits.ts';

describe('portraits', () => {
  it('déduit l’identifiant de l’unité du nom du fichier', () => {
    expect(portraitId('../../assets/portraits/tobi-kadachi.png')).toBe('tobi-kadachi');
    expect(portraitId('../../assets/portraits/barroth.webp')).toBe('barroth');
  });

  it('associe chaque unité à l’adresse de son image', () => {
    const urls = portraitUrls({
      '../../assets/portraits/khezu.png': '/assets/khezu-abc.png',
      '../../assets/portraits/legiana.svg': '/assets/legiana-def.svg',
    });
    expect(urls.get('khezu')).toBe('/assets/khezu-abc.png');
    expect(urls.get('legiana')).toBe('/assets/legiana-def.svg');
    expect(urls.size).toBe(2);
  });
});

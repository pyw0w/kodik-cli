import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KodikPlugin } from '../../../src/plugins/players/kodik/index.js';

beforeEach(() => vi.unstubAllGlobals());

describe('KodikPlugin', () => {
  it('has name "kodik"', () => {
    const p = new KodikPlugin('tok');
    expect(p.name).toBe('kodik');
  });

  it('isAvailable returns true when token resolves', async () => {
    const p = new KodikPlugin('manual-token');
    await expect(p.isAvailable()).resolves.toBe(true);
  });

  it('resolve returns PlayerMedia with player name', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ found: true, link: '//kodik.info/seria/1/player' }),
    }));
    const p = new KodikPlugin('tok');
    const media = await p.resolve('20', 'shikimori');
    expect(media?.player).toBe('kodik');
    expect(media?.mediaId).toContain('kodik.info');
  });

  it('resolve returns null when not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ found: false }),
    }));
    const p = new KodikPlugin('tok');
    const media = await p.resolve('99999', 'shikimori');
    expect(media).toBeNull();
  });
});

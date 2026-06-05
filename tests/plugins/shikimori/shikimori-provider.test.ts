import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShikimoriProvider } from '../../../src/plugins/providers/shikimori/index.js';

const fixtureDir = join(fileURLToPath(import.meta.url), '../../..', 'fixtures');
const animeFixture = JSON.parse(await readFile(join(fixtureDir, 'shikimori-anime-response.json'), 'utf-8'));

function mockFetch(body: unknown, ok = true, status?: number) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok,
    status: status ?? (ok ? 200 : 500),
    json: () => Promise.resolve(body),
  }));
}

beforeEach(() => vi.unstubAllGlobals());

describe('ShikimoriProvider', () => {
  it('has name "shikimori"', () => {
    expect(new ShikimoriProvider().name).toBe('shikimori');
  });

  it('search maps Shikimori fields to AnimeResult', async () => {
    mockFetch([animeFixture]);
    const p = new ShikimoriProvider();
    const results = await p.search('Наруто');
    expect(results).toHaveLength(1);
    const r = results[0];
    expect(r.title).toBe('Наруто');
    expect(r.title_orig).toBe('Naruto');
    expect(r.other_title).toBe('Naruto');
    expect(r.type).toBe('tv');
    expect(r.year).toBe(2002);
    expect(r.shikimori_id).toBe('20');
  });

  it('search sends User-Agent header', async () => {
    mockFetch([animeFixture]);
    const p = new ShikimoriProvider();
    await p.search('test');
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['User-Agent']).toBe('kodik-cli/1.0.0');
  });

  it('getById returns AnimeResult', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(animeFixture) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) }),
    );
    const p = new ShikimoriProvider();
    const result = await p.getById('20');
    expect(result?.shikimori_id).toBe('20');
    expect(result?.title).toBe('Наруто');
  });

  it('getById returns null for 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    }));
    const p = new ShikimoriProvider();
    const result = await p.getById('99999');
    expect(result).toBeNull();
  });

  it('getEpisodes returns synthetic episode list', async () => {
    mockFetch(animeFixture);
    const p = new ShikimoriProvider();
    const episodes = await p.getEpisodes('20');
    expect(episodes).toHaveLength(220);
    expect(episodes[0]).toEqual({ number: 1, aired: true });
    expect(episodes[219]).toEqual({ number: 220, aired: true });
  });

  it('search sends correct URL with query and limit', async () => {
    mockFetch([animeFixture]);
    const p = new ShikimoriProvider();
    await p.search('Наруто', 5);
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toContain('shikimori.one/api/animes');
    expect(url).toContain('limit=5');
  });
});

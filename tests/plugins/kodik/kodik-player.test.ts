import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KodikPlayer } from '../../../src/plugins/players/kodik/kodik-player.js';
import { NoResults } from '../../../src/errors/index.js';

const fixtureDir = join(fileURLToPath(import.meta.url), '../../..', 'fixtures');
const searchFixture = JSON.parse(await readFile(join(fixtureDir, 'kodik-search-response.json'), 'utf-8'));
const playerHtml = await readFile(join(fixtureDir, 'kodik-player.html'), 'utf-8');
const playerScript = await readFile(join(fixtureDir, 'kodik-player-script.js'), 'utf-8');
const videoFixture = JSON.parse(await readFile(join(fixtureDir, 'kodik-video-response.json'), 'utf-8'));

function mockFetchSequence(responses: Array<{ ok: boolean; body: unknown; text?: string }>) {
  let i = 0;
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
    const r = responses[i++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: r.ok,
      status: r.ok ? 200 : 500,
      json: () => Promise.resolve(r.body),
      text: () => Promise.resolve(r.text ?? JSON.stringify(r.body)),
    });
  }));
}

beforeEach(() => vi.unstubAllGlobals());

describe('KodikPlayer', () => {
  describe('search', () => {
    it('returns search results for title', async () => {
      mockFetchSequence([{ ok: true, body: searchFixture }]);
      const player = new KodikPlayer('test-token');
      const results = await player.search('Наруто');
      expect(results.total).toBe(1);
      expect(results.results[0].title).toBe('Наруто');
    });

    it('throws NoResults when results array is empty', async () => {
      mockFetchSequence([{ ok: true, body: { total: 0, time: '1ms', results: [] } }]);
      const player = new KodikPlayer('test-token');
      await expect(player.search('nonexistent')).rejects.toThrow(NoResults);
    });

    it('searches by shikimori_id', async () => {
      mockFetchSequence([{ ok: true, body: searchFixture }]);
      const player = new KodikPlayer('test-token');
      const results = await player.searchById('20', 'shikimori');
      expect(results.results[0].shikimori_id).toBe('20');
    });
  });

  describe('getPlayerLink', () => {
    it('returns https player URL when found', async () => {
      mockFetchSequence([{
        ok: true,
        body: { found: true, link: '//kodik.info/seria/1/player/v2' },
      }]);
      const player = new KodikPlayer('test-token');
      const link = await player.getPlayerLink('20', 'shikimori');
      expect(link).toBe('https://kodik.info/seria/1/player/v2');
    });

    it('throws NoResults when not found', async () => {
      mockFetchSequence([{ ok: true, body: { found: false } }]);
      const player = new KodikPlayer('test-token');
      await expect(player.getPlayerLink('99999', 'shikimori')).rejects.toThrow(NoResults);
    });
  });

  describe('getInfo', () => {
    it('returns MediaInfo with translations and series count', async () => {
      mockFetchSequence([{ ok: true, body: null, text: playerHtml }]);
      const player = new KodikPlayer('test-token');
      const info = await player.getInfo('https://kodik.info/seria/1/player/v2');
      expect(info.series_count).toBe(3);
      expect(info.translations).toHaveLength(3);
      expect(info.type).toBe('serial');
    });
  });

  describe('getLink', () => {
    it('returns StreamLink with HLS URL', async () => {
      mockFetchSequence([
        { ok: true, body: null, text: playerHtml },
        { ok: true, body: null, text: playerScript },
        { ok: true, body: videoFixture },
      ]);
      const player = new KodikPlayer('test-token');
      const stream = await player.getLink('https://kodik.info/seria/1/player/v2', 1);
      expect(stream.url).toContain('https://');
      expect(stream.url).toContain('m3u8');
      expect(stream.format).toBe('hls');
    });
  });
});

import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Extractor } from '../../src/plugins/players/kodik/extractor.js';

const fixtureDir = join(fileURLToPath(import.meta.url), '../..', 'fixtures');
const playerHtml = await readFile(join(fixtureDir, 'kodik-player.html'), 'utf-8');
const playerScript = await readFile(join(fixtureDir, 'kodik-player-script.js'), 'utf-8');

describe('Extractor.parseHtml', () => {
  it('extracts series list', () => {
    const e = new Extractor();
    const result = e.parseHtml(playerHtml);
    expect(result.seriesCount).toBe(3);
  });

  it('extracts translations', () => {
    const e = new Extractor();
    const result = e.parseHtml(playerHtml);
    expect(result.translations).toHaveLength(3);
    expect(result.translations[0]).toEqual({
      id: '610',
      title: 'AniDUB',
      type: 'voice',
      is_voice: true,
    });
    expect(result.translations[2]).toEqual({
      id: '254',
      title: 'Субтитры EN',
      type: 'subtitles',
      is_voice: false,
    });
  });

  it('extracts urlParams', () => {
    const e = new Extractor();
    const result = e.parseHtml(playerHtml);
    expect(result.urlParams['d']).toBe('kodik.info');
    expect(result.urlParams['d_sign']).toBe('test_sign_d');
  });

  it('extracts video params (type, hash, id)', () => {
    const e = new Extractor();
    const result = e.parseHtml(playerHtml);
    expect(result.videoParams.type).toBe('seria');
    expect(result.videoParams.hash).toBe('aBcDeFgHiJ');
    expect(result.videoParams.id).toBe('99999');
  });

  it('extracts player JS src', () => {
    const e = new Extractor();
    const result = e.parseHtml(playerHtml);
    expect(result.playerJsSrc).toBe('//kodikplayer.com/assets/app-v2.js');
  });

  it('detects serial type', () => {
    const e = new Extractor();
    const result = e.parseHtml(playerHtml);
    expect(result.mediaType).toBe('serial');
  });
});

describe('Extractor.extractPostUrl', () => {
  it('decodes base64 POST URL from player script', () => {
    const e = new Extractor();
    const url = e.extractPostUrl(playerScript);
    expect(url).toBe('https://kodik.info/get-videos');
  });
});

import { describe, it, expect } from 'vitest';
import { Decryptor } from '../../src/plugins/players/kodik/decryptor.js';
import { DecryptionFailure } from '../../src/errors/index.js';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encodeKodik(url: string, shift: number): string {
  const b64 = Buffer.from(url).toString('base64').replace(/=+$/, '');
  return [...b64]
    .map(c => {
      const i = UPPER.indexOf(c.toUpperCase());
      if (i === -1) return c;
      const r = UPPER[(i + shift) % 26];
      return c === c.toLowerCase() ? r.toLowerCase() : r;
    })
    .join('');
}

describe('Decryptor', () => {
  it('decrypts URL encoded with ROT-13', () => {
    const url = '//cdn.kodik.info/seria/1/mp4:hls:manifest.m3u8';
    const encoded = encodeKodik(url, 13);
    const d = new Decryptor();
    expect(d.decrypt(encoded)).toBe(url);
  });

  it('decrypts URL encoded with ROT-3', () => {
    const url = '//cdn.kodik.info/seria/2/mp4:hls:manifest.m3u8';
    const encoded = encodeKodik(url, 3);
    const d = new Decryptor();
    expect(d.decrypt(encoded)).toBe(url);
  });

  it('caches the shift after first decryption', () => {
    const url = '//cdn.kodik.info/seria/mp4:hls:manifest.m3u8';
    const encoded = encodeKodik(url, 7);
    const d = new Decryptor();
    d.decrypt(encoded);
    const url2 = '//cdn.kodik.info/seria/2/mp4:hls:manifest.m3u8';
    const encoded2 = encodeKodik(url2, 7);
    expect(d.decrypt(encoded2)).toBe(url2);
  });

  it('throws DecryptionFailure on invalid input', () => {
    const d = new Decryptor();
    expect(() => d.decrypt('this-is-not-valid-encoded-url')).toThrow(DecryptionFailure);
  });
});

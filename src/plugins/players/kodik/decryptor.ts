import { DecryptionFailure } from '../../../errors/index.js';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function rotChar(char: string, shift: number): string {
  const i = UPPER.indexOf(char.toUpperCase());
  if (i === -1) return char;
  const rotated = UPPER[(i + shift) % 26];
  return char === char.toLowerCase() ? rotated.toLowerCase() : rotated;
}

function rotString(str: string, shift: number): string {
  return [...str].map(c => rotChar(c, shift)).join('');
}

function tryDecode(encoded: string, shift: number): string | null {
  const rotated = rotString(encoded, shift);
  const padded = rotated + '='.repeat((4 - (rotated.length % 4)) % 4);
  try {
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    if (decoded.includes('mp4:hls:manifest.m3u8')) return decoded;
  } catch {
    // invalid base64
  }
  return null;
}

export class Decryptor {
  private _shift: number | null = null;

  decrypt(encoded: string): string {
    if (this._shift !== null) {
      const result = tryDecode(encoded, this._shift);
      if (result) return result;
    }

    for (let shift = 0; shift < 26; shift++) {
      const result = tryDecode(encoded, shift);
      if (result) {
        this._shift = shift;
        return result;
      }
    }

    throw new DecryptionFailure(
      'Failed to decrypt video URL after trying all ROT shifts',
    );
  }
}

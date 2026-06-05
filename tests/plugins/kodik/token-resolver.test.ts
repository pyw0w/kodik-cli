import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtureDir = join(fileURLToPath(import.meta.url), '../../..', 'fixtures');
const tokenScript = await readFile(join(fixtureDir, 'kodik-token-script.js'), 'utf-8');

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe('resolveToken', () => {
  it('returns manual token when provided', async () => {
    const { resolveToken } = await import('../../../src/plugins/players/kodik/token-resolver.js');
    const token = await resolveToken('manual-token-abc');
    expect(token).toBe('manual-token-abc');
  });

  it('auto-discovers token from script', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(tokenScript),
    }));
    const { resolveToken } = await import('../../../src/plugins/players/kodik/token-resolver.js');
    const token = await resolveToken();
    expect(token).toBe('abc123xyz789');
  });

  it('throws TokenError when script does not contain token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('var nothing = "here";'),
    }));
    const { resolveToken, clearTokenCache } = await import('../../../src/plugins/players/kodik/token-resolver.js');
    clearTokenCache();
    await expect(resolveToken()).rejects.toThrow('Could not extract token');
  });

  it('throws TokenError on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const { resolveToken, clearTokenCache } = await import('../../../src/plugins/players/kodik/token-resolver.js');
    clearTokenCache();
    await expect(resolveToken()).rejects.toThrow('Failed to fetch');
  });
});

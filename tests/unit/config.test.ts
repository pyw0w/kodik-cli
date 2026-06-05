import { describe, it, expect, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const tmpDir = await mkdtemp(join(tmpdir(), 'kodik-test-'));
process.env['KODIK_CONFIG_DIR'] = tmpDir;

const { loadConfig, saveConfig } = await import('../../src/core/config.js');

afterEach(async () => {
  // Очистить конфиг между тестами
  try {
    await rm(join(tmpDir, 'config.json'));
  } catch {
    // файл может не существовать
  }
});

describe('config', () => {
  it('returns empty object when config file does not exist', async () => {
    const cfg = await loadConfig();
    expect(cfg).toEqual({});
  });

  it('saves and loads config roundtrip', async () => {
    await saveConfig({ kodik: { token: 'test-token-123' } });
    const cfg = await loadConfig();
    expect(cfg.kodik?.token).toBe('test-token-123');
  });

  it('merges with existing config on save', async () => {
    await saveConfig({ kodik: { token: 'first' } });
    await saveConfig({ kodik: { token: 'second' } });
    const cfg = await loadConfig();
    expect(cfg.kodik?.token).toBe('second');
  });
});

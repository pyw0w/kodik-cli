import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Config } from '../types/index.js';

function getConfigDir(): string {
  return process.env['KODIK_CONFIG_DIR'] ?? join(homedir(), '.kodik');
}

function getConfigPath(): string {
  return join(getConfigDir(), 'config.json');
}

export async function loadConfig(): Promise<Config> {
  try {
    const raw = await readFile(getConfigPath(), 'utf-8');
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const dir = getConfigDir();
  await mkdir(dir, { recursive: true });
  await writeFile(getConfigPath(), JSON.stringify(config, null, 2), 'utf-8');
}

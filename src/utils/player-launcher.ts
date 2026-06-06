import { spawnSync, spawn } from 'node:child_process';
import { platform } from 'node:process';

export type ExternalPlayer = 'mpv' | 'vlc';

const _cache = new Map<ExternalPlayer, boolean>();

function isInstalled(name: ExternalPlayer): boolean {
  if (_cache.has(name)) return _cache.get(name)!;
  const cmd = platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [name], { encoding: 'utf-8' });
  const found = result.status === 0;
  _cache.set(name, found);
  return found;
}

export function checkPlayers(): Record<ExternalPlayer, boolean> {
  return {
    mpv: isInstalled('mpv'),
    vlc: isInstalled('vlc'),
  };
}

export function launchMpv(url: string): void {
  const proc = spawn('mpv', ['--no-terminal', url], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
}

export function launchVlc(url: string): void {
  const proc = spawn('vlc', [url], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
}

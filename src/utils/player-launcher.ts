import { spawnSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform, env } from 'node:process';

export type ExternalPlayer = 'mpv' | 'vlc';

// Windows fallback paths when the player isn't on PATH
const WIN_FALLBACKS: Record<ExternalPlayer, string[]> = {
  mpv: [
    'C:/Program Files/MPV Player/mpv.exe',
    'C:/Program Files/mpv/mpv.exe',
    'C:/Program Files (x86)/mpv/mpv.exe',
    `${env['SCOOP'] ?? (env['USERPROFILE'] ?? 'C:/Users/User') + '/scoop'}/shims/mpv.exe`,
  ],
  vlc: [
    'C:/Program Files/VideoLAN/VLC/vlc.exe',
    'C:/Program Files (x86)/VideoLAN/VLC/vlc.exe',
  ],
};

// Cache stores the resolved executable path (full path or bare name), or null if not found
const _cache = new Map<ExternalPlayer, string | null>();

function resolve(name: ExternalPlayer): string | null {
  if (_cache.has(name)) return _cache.get(name)!;

  // Try PATH first
  const cmd = platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(cmd, [name], { encoding: 'utf-8' });
  if (result.status === 0) {
    const resolved = result.stdout.trim().split('\n')[0].trim();
    _cache.set(name, resolved || name);
    return _cache.get(name)!;
  }

  // On Windows, check well-known install locations
  if (platform === 'win32') {
    for (const candidate of WIN_FALLBACKS[name] ?? []) {
      if (existsSync(candidate)) {
        _cache.set(name, candidate);
        return candidate;
      }
    }
  }

  _cache.set(name, null);
  return null;
}

export function checkPlayers(): Record<ExternalPlayer, boolean> {
  return {
    mpv: resolve('mpv') !== null,
    vlc: resolve('vlc') !== null,
  };
}

export function launchMpv(url: string): void {
  const bin = resolve('mpv') ?? 'mpv';
  const proc = spawn(bin, ['--no-terminal', url], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
}

export function launchVlc(url: string): void {
  const bin = resolve('vlc') ?? 'vlc';
  const proc = spawn(bin, [url], {
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();
}

import { describe, it, expect, vi } from 'vitest';
import { PluginRegistry } from '../../src/core/registry.js';
import type { IPlayerPlugin, IMetadataProvider } from '../../src/core/interfaces.js';

function makePlayer(name: string): IPlayerPlugin {
  return {
    name,
    version: '1.0.0',
    isAvailable: vi.fn().mockResolvedValue(true),
    resolve: vi.fn(),
    getInfo: vi.fn(),
    getStream: vi.fn(),
  };
}

function makeProvider(name: string): IMetadataProvider {
  return {
    name,
    search: vi.fn(),
    getById: vi.fn(),
    getEpisodes: vi.fn(),
  };
}

describe('PluginRegistry', () => {
  it('registers and retrieves a player', () => {
    const registry = new PluginRegistry();
    const player = makePlayer('kodik');
    registry.registerPlayer(player);
    expect(registry.getPlayer('kodik')).toBe(player);
  });

  it('registers and retrieves a provider', () => {
    const registry = new PluginRegistry();
    const provider = makeProvider('shikimori');
    registry.registerProvider(provider);
    expect(registry.getProvider('shikimori')).toBe(provider);
  });

  it('returns undefined for unknown player', () => {
    const registry = new PluginRegistry();
    expect(registry.getPlayer('unknown')).toBeUndefined();
  });

  it('lists all registered players', () => {
    const registry = new PluginRegistry();
    registry.registerPlayer(makePlayer('kodik'));
    registry.registerPlayer(makePlayer('sibnet'));
    expect(registry.listPlayers()).toEqual(['kodik', 'sibnet']);
  });

  it('lists all registered providers', () => {
    const registry = new PluginRegistry();
    registry.registerProvider(makeProvider('shikimori'));
    expect(registry.listProviders()).toEqual(['shikimori']);
  });
});

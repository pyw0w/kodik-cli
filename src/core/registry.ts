import type { IPlayerPlugin, IMetadataProvider } from './interfaces.js';

export class PluginRegistry {
  private players = new Map<string, IPlayerPlugin>();
  private providers = new Map<string, IMetadataProvider>();

  registerPlayer(plugin: IPlayerPlugin): void {
    this.players.set(plugin.name, plugin);
  }

  registerProvider(provider: IMetadataProvider): void {
    this.providers.set(provider.name, provider);
  }

  getPlayer(name: string): IPlayerPlugin | undefined {
    return this.players.get(name);
  }

  getProvider(name: string): IMetadataProvider | undefined {
    return this.providers.get(name);
  }

  listPlayers(): string[] {
    return [...this.players.keys()];
  }

  listProviders(): string[] {
    return [...this.providers.keys()];
  }
}

export { PluginRegistry } from './core/registry.js';
export type { IPlayerPlugin, IMetadataProvider } from './core/interfaces.js';
export { loadConfig, saveConfig } from './core/config.js';

export * from './types/index.js';
export * from './errors/index.js';

export { KodikPlugin } from './plugins/players/kodik/index.js';
export { ShikimoriProvider } from './plugins/providers/shikimori/index.js';
export { SearchBuilder, ListBuilder } from './plugins/players/kodik/query-builder.js';

import { PluginRegistry } from './core/registry.js';
import { KodikPlugin } from './plugins/players/kodik/index.js';
import { ShikimoriProvider } from './plugins/providers/shikimori/index.js';
import { loadConfig } from './core/config.js';
import type { Config } from './types/index.js';

export async function createDefaultRegistry(config?: Config): Promise<PluginRegistry> {
  const cfg = config ?? await loadConfig();
  const registry = new PluginRegistry();
  registry.registerPlayer(new KodikPlugin(cfg.kodik?.token));
  registry.registerProvider(new ShikimoriProvider());
  return registry;
}

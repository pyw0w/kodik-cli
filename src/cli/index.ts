import { Command } from 'commander';
import { searchCommand } from './commands/search.js';
import { infoCommand } from './commands/info.js';
import { linkCommand } from './commands/link.js';
import { configCommand } from './commands/config.js';
import { pluginCommand } from './commands/plugin.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const pkg = JSON.parse(
  await readFile(join(fileURLToPath(import.meta.url), '../../..', 'package.json'), 'utf-8'),
) as { version: string };

const program = new Command()
  .name('kodik-cli')
  .description('CLI для поиска и получения аниме-потоков (Kodik + Shikimori)')
  .version(pkg.version);

program.addCommand(searchCommand);
program.addCommand(infoCommand);
program.addCommand(linkCommand);
program.addCommand(configCommand);
program.addCommand(pluginCommand);

program.parse();

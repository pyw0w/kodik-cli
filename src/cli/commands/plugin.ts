import { Command } from 'commander';
import chalk from 'chalk';
import { createDefaultRegistry } from '../../index.js';

export const pluginCommand = new Command('plugin')
  .description('Управление плагинами');

pluginCommand
  .command('list')
  .description('Список подключённых плагинов')
  .action(async () => {
    const registry = await createDefaultRegistry();
    console.log(chalk.bold('Players:'));
    for (const name of registry.listPlayers()) {
      console.log(`  ${chalk.cyan(name)}`);
    }
    console.log(chalk.bold('Providers:'));
    for (const name of registry.listProviders()) {
      console.log(`  ${chalk.cyan(name)}`);
    }
  });
